import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const here = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(here, '..');
export const artifactsDir = path.join(projectRoot, 'artifacts');
export const profileDir = path.join(projectRoot, '.nemaffald-profile');
export const settingsPath = path.join(projectRoot, 'config', 'settings.json');

export async function loadSettings() {
  try {
    const raw = await readFile(settingsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'Missing config/settings.json. Copy config/settings.example.json to config/settings.json and fill in the property details.'
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(`config/settings.json is not valid JSON: ${error.message}`);
    }
    throw error;
  }
}

export async function launchPortal(settings, options = {}) {
  await mkdir(artifactsDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: options.headless ?? false,
    viewport: { width: 1440, height: 960 },
    acceptDownloads: false
  });

  const page = context.pages()[0] ?? await context.newPage();
  page.setDefaultTimeout(15000);

  const portalUrl = options.startUrl || settings.portalUrl || 'https://nemaffaldsservice.kk.dk/';
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  return { context, page };
}

export async function ask(question) {
  const rl = readline.createInterface({ input, output });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function waitForUserToReachForm() {
  console.log('\nThe browser is open.');
  console.log('Use it to select the property, sign in, and navigate to the relevant order page.');
  console.log('You can stop at the order form, basket, or approval/checkout page.');
  console.log('Do not press the portal\'s final order/submit button during inspection.');
  await ask('When the page you want us to inspect is visible, press Enter here... ');
}

// Inspects the main document and any iframe documents. It deliberately does not
// read input values, typed text, cookies, local storage, or page HTML.
export async function inspectPage(page) {
  const frames = page.frames();
  const frameReports = [];

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex];
    try {
      const report = await frame.locator('body').evaluate((body) => {
        const isVisible = (el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' &&
            rect.width > 0 && rect.height > 0;
        };

        const preserveDates = (value) => {
          const dates = [];
          const text = String(value || '').replace(/\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/g, (match) => {
            const token = `__NEMAFFALD_DATE_${dates.length}__`;
            dates.push(match);
            return token;
          });
          return { text, dates };
        };

        const restoreDates = (text, dates) => dates.reduce(
          (result, date, index) => result.replace(`__NEMAFFALD_DATE_${index}__`, date),
          text
        );

        const redactInline = (value) => {
          const protectedValue = preserveDates(value);
          const redacted = protectedValue.text
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
            .replace(/(?:\+45[\s.-]?)?(?:\d[\s.-]?){8}/g, '[REDACTED_PHONE]')
            .replace(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi, '[REDACTED_ID]')
            .replace(/\b\d{6,}\b/g, '[REDACTED_NUMBER]');
          return restoreDates(redacted, protectedValue.dates);
        };

        const cleanText = (value, max = 220) => redactInline(
          String(value || '').replace(/\s+/g, ' ').trim()
        ).slice(0, max);

        // Keep useful basket/order descriptions while masking common identifiers
        // and contact details. The report never reads input.value or cookies.
        const redactVisibleText = (value) => {
          const protectedValue = preserveDates(value);
          const redacted = protectedValue.text
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
            .replace(/\b(?:\+45[\s.-]?)?(?:\d[\s.-]?){8}\b/g, '[REDACTED_PHONE]')
            .replace(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi, '[REDACTED_ID]')
            .replace(/\b\d{6,}\b/g, '[REDACTED_NUMBER]')
            .replace(/\b\d{4}\s+[\p{L}][\p{L} .'-]{1,40}\b/gu, '[REDACTED_POSTCODE_CITY]');
          return restoreDates(redacted, protectedValue.dates)
            .split('\n')
            .map((line) => /adresse|ejendomsnummer|kundenummer|customer\s*id|kunde\s*nr/i.test(line)
              ? '[REDACTED_PROPERTY_OR_CUSTOMER_LINE]'
              : line.trim())
            .filter(Boolean)
            .join('\n')
            .slice(0, 6000);
        };

        const headings = Array.from(body.querySelectorAll('h1,h2,h3,h4,[role="heading"]'))
          .filter(isVisible)
          .map((el) => cleanText(el.innerText || el.textContent, 300))
          .filter(Boolean)
          .slice(0, 40);

        const candidates = body.querySelectorAll(
          'button,input,textarea,select,a[href],[role],[tabindex]:not([tabindex="-1"]),[onclick],[class*="button" i],[class*="btn" i]'
        );

        const controls = Array.from(candidates)
          .filter(isVisible)
          .map((el) => {
            const tag = el.tagName.toLowerCase();
            const labels = el.labels
              ? Array.from(el.labels).map((label) => cleanText(label.innerText, 180)).filter(Boolean)
              : [];
            const parentLabel = cleanText(el.closest('label')?.innerText, 180);
            const text = cleanText(el.innerText || el.textContent, 220);
            const role = el.getAttribute('role');
            const className = typeof el.className === 'string' ? el.className : '';
            const href = el.getAttribute('href');
            let safeHref = null;
            if (href) {
              try {
                const parsed = new URL(href, window.location.href);
                // Query strings are omitted because they can contain customer/session identifiers.
                safeHref = `${parsed.origin}${parsed.pathname}`;
              } catch {
                safeHref = href.split(/[?#]/)[0];
              }
            }

            return {
              tag,
              type: el.getAttribute('type') || null,
              id: cleanText(el.id, 180) || null,
              name: cleanText(el.getAttribute('name'), 180) || null,
              role,
              labels: [...new Set([...labels, parentLabel].filter(Boolean))],
              ariaLabel: cleanText(el.getAttribute('aria-label'), 180) || null,
              ariaLabelledBy: cleanText(el.getAttribute('aria-labelledby'), 180) || null,
              title: cleanText(el.getAttribute('title'), 180) || null,
              placeholder: cleanText(el.getAttribute('placeholder'), 180) || null,
              text: text || null,
              className: cleanText(className, 180) || null,
              href: safeHref,
              required: Boolean(el.required),
              disabled: Boolean(el.disabled)
            };
          })
          .filter((item) => item.tag !== 'div' && item.tag !== 'span' ||
            item.role || item.text || item.ariaLabel || item.href)
          .slice(0, 250);

        const visibleText = redactVisibleText(body.innerText || '');

        return {
          headings,
          controls,
          bodyTextLength: (body.innerText || '').length,
          visibleText
        };
      });

      let frameUrl = frame.url();
      try {
        const parsed = new URL(frameUrl);
        frameUrl = `${parsed.origin}${parsed.pathname}`;
      } catch {
        frameUrl = frameUrl.split(/[?#]/)[0];
      }

      frameReports.push({
        frameIndex,
        isMainFrame: frame === page.mainFrame(),
        url: frameUrl,
        headings: report.headings,
        controls: report.controls,
        bodyTextLength: report.bodyTextLength,
        visibleText: report.visibleText
      });
    } catch (error) {
      frameReports.push({
        frameIndex,
        isMainFrame: frame === page.mainFrame(),
        url: frame.url().split(/[?#]/)[0],
        inspectionError: error.message
      });
    }
  }

  return {
    capturedAt: new Date().toISOString(),
    pageTitle: await page.title().catch(() => ''),
    pageUrl: (() => {
      try {
        const parsed = new URL(page.url());
        return `${parsed.origin}${parsed.pathname}`;
      } catch {
        return page.url().split(/[?#]/)[0];
      }
    })(),
    frameCount: frames.length,
    frames: frameReports,
    note: 'Visible page text is included for identifying basket/order descriptions. Input values, typed form values, cookies, session data, and URL query strings are not recorded. Common phone numbers, email addresses, GUIDs, long numbers, and postcode/city strings are redacted. Collection dates in common Danish formats are deliberately preserved for duplicate-order checks; review the report before sharing.'
  };
}

export async function getVisibleControls(page) {
  const report = await inspectPage(page);
  return report.frames.flatMap((frame) =>
    (frame.controls || []).map((control) => ({
      frameIndex: frame.frameIndex,
      frameUrl: frame.url,
      ...control
    }))
  );
}

export async function closeContext(context) {
  if (context) await context.close().catch(() => {});
}
