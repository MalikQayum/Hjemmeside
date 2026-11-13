import {
  ask,
  closeContext,
  launchPortal,
  loadSettings,
  waitForUserToReachForm
} from './browser.js';

let context;

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');

async function getVisibleBodyText(page) {
  return page.locator('body').innerText({ timeout: 10000 });
}

async function getBasketCount(page) {
  // The portal displays the current basket count as a numeric link.
  const candidates = page.locator('a.ignoreBasketWarning[href*="/Basket/Overview"]');
  const count = await candidates.count();

  for (let index = 0; index < count; index += 1) {
    const text = (await candidates.nth(index).innerText().catch(() => '')).trim();
    if (/^\d+$/.test(text)) return Number(text);
  }

  return null;
}

async function requireOrderPage(page, expectedHeading, expectedSite) {
  const current = new URL(page.url());
  if (current.hostname !== 'nemaffaldsservice.kk.dk' || current.pathname !== '/Site/SelectServiceSite') {
    throw new Error(
      `The browser is not on the expected order form. Current page: ${current.pathname}. Navigate to the service/site form and run again.`
    );
  }

  const bodyText = await getVisibleBodyText(page);
  const normalizedBody = normalize(bodyText);

  if (!normalizedBody.includes(normalize(expectedHeading))) {
    throw new Error(
      `Could not verify the expected service heading: "${expectedHeading}". The current page may be a different collection type.`
    );
  }

  if (!normalizedBody.includes(normalize(expectedSite))) {
    throw new Error(
      `Could not verify the expected standplads: "${expectedSite}". No fields were changed.`
    );
  }
}


async function findVisibleNextLink(page) {
  const anchors = page.locator('a[href*="/Site/SelectServiceSite"]');
  const count = await anchors.count();
  const candidates = [];

  for (let index = 0; index < count; index += 1) {
    const anchor = anchors.nth(index);
    const details = await anchor.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        href: element.getAttribute('href'),
        className: typeof element.className === 'string' ? element.className : ''
      };
    }).catch(() => null);

    if (details) {
      candidates.push(details);
      if (normalize(details.text) === 'videre' && details.visible && await anchor.isVisible().catch(() => false)) {
        return anchor;
      }
    }
  }

  // The inspector also observed the label inside a span.submitButton. Some
  // versions of the portal expose the anchor's accessible name inconsistently.
  const submitLabel = page.locator('span.submitButton').filter({ hasText: /^\s*VIDERE\s*$/i });
  const spanCount = await submitLabel.count();
  for (let index = 0; index < spanCount; index += 1) {
    const span = submitLabel.nth(index);
    if (await span.isVisible().catch(() => false)) {
      const text = normalize(await span.innerText().catch(() => ''));
      if (text === 'videre') return span;
    }
  }

  console.error('Could not identify a visible VIDERE control. Matching observed anchors:');
  console.error(JSON.stringify(candidates, null, 2));
  throw new Error(
    'Could not find a visible VIDERE control using the inspected portal markup. No order was added to the basket. Run npm.cmd run inspect on this page and share the new report.'
  );
}

async function fillRequestedDate(page, requestedDate) {
  if (!requestedDate) return false;

  const dateInput = page.locator('#datepicker');
  await dateInput.waitFor({ state: 'visible' });

  // This is a text/date-picker input (not input[type=date]). The value must
  // match the display format used by the portal's date picker.
  await dateInput.fill(String(requestedDate));
  await dateInput.press('Tab');
  return true;
}

async function fillMessage(page, message) {
  if (!message) return false;

  const messageInput = page.locator('#commentText');
  await messageInput.waitFor({ state: 'visible' });
  await messageInput.fill(String(message));
  return true;
}

async function main() {
  const settings = await loadSettings();
  const order = settings.order || {};

  // Defaults are grounded in the inspected Haveaffald flow. Override them in
  // config/settings.json when preparing a different service or standplads.
  const expectedHeading = order.expectedHeading || 'Haveaffald - Tømning af materiel';
  const expectedSite = order.expectedSite || 'VIGERSLEVVEJ 148';
  const expectedBasketText = order.expectedBasketText || 'Haveaffald';

  const { context: browserContext, page } = await launchPortal(settings);
  context = browserContext;

  await waitForUserToReachForm();
  await requireOrderPage(page, expectedHeading, expectedSite);

  const existingBasketCount = await getBasketCount(page);
  if (existingBasketCount !== null && existingBasketCount > 0) {
    console.log(`\nThe portal currently shows ${existingBasketCount} item(s) in the basket.`);
    console.log('To avoid accidentally adding a duplicate, review or clear the existing basket before running this draft again.');
    await ask('Press Enter to close the browser... ');
    return;
  }

  console.log('\nVerified order target:');
  console.log(`  Service: ${expectedHeading}`);
  console.log(`  Standplads: ${expectedSite}`);

  const configuredDate = order.requestedDate ?? '';
  const requestedDate = configuredDate || await ask(
    'Requested date (use the exact format shown by NemAffald; leave blank to skip): '
  );

  const configuredMessage = order.message ?? '';
  const message = configuredMessage || await ask(
    'Message to the municipality (optional; press Enter to skip): '
  );

  if (message.length > 2000) {
    throw new Error('The message exceeds NemAffaldsservice\'s 2,000-character limit.');
  }

  const dateFilled = await fillRequestedDate(page, requestedDate);
  const messageFilled = await fillMessage(page, message);

  console.log('\nDraft prepared in the portal:');
  console.log(`  Requested date: ${dateFilled ? 'entered' : 'left unchanged'}`);
  console.log(`  Message: ${messageFilled ? 'entered' : 'left unchanged'}`);
  console.log('  Final approval (GODKEND): will NOT be clicked.');

  const confirmationPhrase = 'ADD TO BASKET';
  const confirmation = await ask(
    `\nReview the browser. To add this order to the basket, type exactly "${confirmationPhrase}": `
  );

  if (confirmation !== confirmationPhrase) {
    console.log('Confirmation did not match. The order was not added to the basket.');
    await ask('Press Enter to close the browser... ');
    return;
  }

  // VIDERE advances the current order into the basket. It is not the final
  // order submission control; the final control is GODKEND on Basket/Overview.
  // The live inspector found this as an <a href="/Site/SelectServiceSite">,
  // but Playwright's accessible-role locator did not expose it as a link.
  // Use the observed DOM structure and verify the exact visible label instead.
  const nextLink = await findVisibleNextLink(page);
  await nextLink.scrollIntoViewIfNeeded();
  await nextLink.click({ timeout: 15000 });

  await page.waitForURL((url) =>
    url.pathname === '/Basket/Overview' || url.pathname === '/Basket/PreApproveOrder',
    { timeout: 30000 }
  );

  const basketText = normalize(await getVisibleBodyText(page));
  if (!basketText.includes(normalize(expectedBasketText))) {
    throw new Error(
      'The portal opened the basket, but the expected collection type was not found in the visible basket summary. Review the browser manually; do not approve the order.'
    );
  }

  console.log('\nOrder successfully added to the basket and verified.');
  console.log('The browser is left on the basket for your review.');
  console.log('The script has NOT clicked the terms checkbox or GODKEND.');
  await ask('After reviewing the basket, press Enter to close the browser... ');
}

try {
  await main();
} catch (error) {
  console.error('\nOrder preparation failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeContext(context);
}
