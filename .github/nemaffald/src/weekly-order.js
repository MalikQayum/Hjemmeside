import { mkdir, readFile, rename, writeFile, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  ask,
  artifactsDir,
  closeContext,
  launchPortal,
  loadSettings
} from './browser.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const statePath = path.join(artifactsDir, 'weekly-state.json');
const lockPath = path.join(artifactsDir, 'weekly-run.lock');
const contactPath = path.join(projectRoot, 'config', 'contact.json');
const TIMEZONE = 'Europe/Copenhagen';
const testMode = process.argv.includes('--test');
const scheduledMode = process.argv.includes('--scheduled');

if (!testMode && !scheduledMode) {
  console.error('Choose either --test or --scheduled.');
  process.exit(2);
}

let context;
let lockHandle;
let lockAcquired = false;
let approvalAttempted = false;

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');
const portalHost = 'nemaffaldsservice.kk.dk';

const FINGERPRINT_FILES = [
  'src/weekly-order.js',
  'src/browser.js',
  'scripts/prepare-github-config.js',
  'config/settings.github.json',
  '.github/workflows/nemaffald-weekly.yml',
  'package.json',
  'package-lock.json'
];

async function getAutomationFingerprint() {
  const hash = createHash('sha256');
  for (const relativePath of FINGERPRINT_FILES) {
    hash.update(relativePath);
    hash.update('\0');
    const sourcePath = relativePath === '.github/workflows/nemaffald-weekly.yml'
      ? path.resolve(projectRoot, '../workflows/nemaffald-weekly.yml')
      : path.join(projectRoot, relativePath);
    hash.update(await readFile(sourcePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function routePath(page) {
  try { return new URL(page.url()).pathname; } catch { return ''; }
}

function copenhagenDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function nextFridayDate(now = new Date()) {
  const today = copenhagenDateParts(now);
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const weekday = date.getUTCDay();
  const daysUntilFriday = (5 - weekday + 7) % 7;
  // The weekly task runs on Friday and requests the following Friday.
  date.setUTCDate(date.getUTCDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return {
    year, month, day,
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  };
}

function formatDate(date) {
  return `${String(date.day).padStart(2, '0')}-${String(date.month).padStart(2, '0')}-${date.year}`;
}

function dateFromText(text) {
  const match = String(text || '').match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const iso = String(text || '').match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  return iso ? iso[0] : null;
}

function extractActiveHaveaffaldOrders(bodyText) {
  const text = String(bodyText || '');
  const start = text.indexOf('Aktive Bestillinger');
  const endCandidate = text.indexOf('Bestilling - Vælg affaldsordning', Math.max(0, start));
  if (start < 0 || endCandidate < 0 || endCandidate <= start) {
    throw new Error('Could not isolate the Aktive Bestillinger section. Refusing to assume there are no existing orders.');
  }
  const section = text.slice(start, endCandidate);
  const blocks = section.match(/Haveaffald[\s\S]*?(?=Haveaffald|$)/g) || [];
  const orders = [];
  for (const block of blocks) {
    if (!/Tømning af materiel/i.test(block) || !/Vigerslevvej\s+148/i.test(block) || !/240\s*l\s*Havebeholder/i.test(block)) continue;
    const date = dateFromText(block);
    const status = /Ikke bekræftet/i.test(block) ? 'Ikke bekræftet' : /Bekræftet/i.test(block) ? 'Bekræftet' : 'Ukendt';
    const priceMatch = block.match(/DKK\s*[\d.,]+/i);
    orders.push({
      service: 'Haveaffald - Tømning af materiel',
      standplads: 'VIGERSLEVVEJ 148',
      equipment: '240 l Havebeholder',
      requestedDate: date,
      status,
      price: priceMatch ? priceMatch[0].replace(/\s+/g, ' ').trim() : null,
      dateParsed: Boolean(date)
    });
  }
  return orders;
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tempPath, filePath);
}

async function readState() {
  try { return JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Could not read weekly state file: ${error.message}`);
  }
}

async function readContact() {
  try { return JSON.parse(await readFile(contactPath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Could not read config/contact.json: ${error.message}`);
  }
}

async function acquireLock() {
  await mkdir(artifactsDir, { recursive: true });
  try {
    lockHandle = await open(lockPath, 'wx');
    lockAcquired = true;
    await lockHandle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }, null, 2));
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another NemAffald weekly run appears active. Inspect artifacts/weekly-run.lock before removing it.');
    throw error;
  }
}

async function releaseLock() {
  if (!lockAcquired) return;
  if (lockHandle) await lockHandle.close().catch(() => {});
  await unlink(lockPath).catch(() => {});
  lockAcquired = false;
}

async function writeRunLog(data) {
  await mkdir(artifactsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(artifactsDir, `weekly-run-${stamp}.json`);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return file;
}

async function waitForPath(page, paths, timeout = 30000) {
  await page.waitForURL((url) => paths.includes(url.pathname), { timeout });
  if (new URL(page.url()).hostname !== portalHost) throw new Error('Navigation left the official NemAffald domain.');
}

async function clickExactLink(page, selector, label) {
  const links = page.locator(selector);
  const count = await links.count();
  const matches = [];
  for (let i = 0; i < count; i += 1) {
    const item = links.nth(i);
    const text = normalize(await item.innerText().catch(() => ''));
    if (text === normalize(label) && await item.isVisible().catch(() => false) && await item.isEnabled().catch(() => false)) matches.push(item);
  }
  if (matches.length !== 1) throw new Error(`Expected one visible ${label} control, found ${matches.length}.`);
  await matches[0].click({ timeout: 15000 });
}

async function chooseProperty(page, property) {
  if (routePath(page) !== '/') throw new Error(`Expected portal front page, found ${routePath(page)}.`);
  const search = page.locator('#SearchTerm');
  if (await search.count() !== 1 || !(await search.isVisible())) throw new Error('Could not find the inspected property search field #SearchTerm.');
  await search.fill(property.lookupValue);
  await page.waitForTimeout(1800);

  const suggestionSelectors = [
    '.ui-autocomplete:visible li',
    '.ui-menu-item:visible',
    '[role="option"]:visible'
  ];
  const suggestions = [];
  for (const selector of suggestionSelectors) {
    const items = page.locator(selector);
    const count = await items.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const item = items.nth(i);
      const text = normalize(await item.innerText().catch(() => ''));
      if (text.includes(normalize(property.lookupValue))) suggestions.push({ item, text });
    }
    if (suggestions.length) break;
  }

  if (suggestions.length === 1) {
    await suggestions[0].item.click({ timeout: 15000 });
  } else if (suggestions.length > 1) {
    const exact = suggestions.filter((entry) => entry.text === normalize(property.lookupValue));
    if (exact.length !== 1) throw new Error(`Property search returned ${suggestions.length} matching suggestions. Refusing to choose between them.`);
    await exact[0].item.click({ timeout: 15000 });
  } else {
    // The inspected search control uses this anchor as its form action. The
    // portal may submit the address directly when autocomplete has no menu.
    const searchButton = page.locator('#searchByAddress');
    if (await searchButton.count() !== 1 || !(await searchButton.isVisible())) {
      throw new Error('No visible property suggestion appeared and #searchByAddress was unavailable.');
    }
    await searchButton.click({ timeout: 15000 });
  }

  await waitForPath(page, ['/CustomerOverview/Overview', '/WasteHome/Default'], 30000);
  const body = normalize(await page.locator('body').innerText());
  if (!body.includes(normalize(property.lookupValue))) throw new Error('The selected property page does not display the configured address.');
}

async function handleWasteResponsiblePage(page, contact, isTest) {
  if (routePath(page) !== '/Authentication') return 'not_required';

  if (contact && contact.firstName && contact.lastName && contact.email && contact.phone && contact.isWasteResponsible === true && contact.rememberMe === true) {
    const fields = [
      ['#FirstName', contact.firstName],
      ['#LastName', contact.lastName],
      ['#Email', contact.email],
      ['#RepeatedMailAddress', contact.email],
      ['#Phone', contact.phone],
      ['#RepeatedMobilenumber', contact.phone]
    ];
    for (const [selector, value] of fields) {
      const field = page.locator(selector);
      if (await field.count() !== 1 || !(await field.isVisible())) throw new Error(`Waste-responsible form field ${selector} was not found.`);
      await field.fill(String(value));
    }
    const responsible = page.locator('#ContactPerson_IsWasteResponsible');
    const remember = page.locator('#ContactPerson_RememberMe');
    if (await responsible.count() !== 1 || await remember.count() !== 1) throw new Error('Could not verify the waste-responsible and Remember me checkboxes.');
    if (!(await responsible.isChecked())) await responsible.check();
    if (!(await remember.isChecked())) await remember.check();
    const godkend = page.locator('a').filter({ hasText: /^\s*GODKEND\s*$/i });
    if (await godkend.count() !== 1) throw new Error('Could not uniquely identify the contact-registration GODKEND control.');
    await godkend.click({ timeout: 15000 });
    await waitForPath(page, ['/WasteAgreement/Overview'], 30000);
    return 'contact_profile_submitted_from_local_config';
  }

  if (!isTest || process.env.CI === 'true') {
    throw new Error('NemAffald is asking for waste-responsible details, but no valid config/contact.json profile is available. On GitHub Actions, add the NEMAFFALD_CONTACT_JSON repository secret. No order was submitted.');
  }

  console.log('\nNemAffald is asking for waste-responsible contact details.');
  console.log('Complete the fields in the browser, tick “JEG ER AFFALDSANSVARLIG / VILLAEJER” only if that is correct, and tick “Husk mig på denne computer i 6 måneder” if you consent.');
  console.log('Click the contact-page GODKEND button (this is not the final order approval).');
  await ask('When the browser reaches Aktive Bestillinger / WasteAgreement, press Enter here... ');
  await waitForPath(page, ['/WasteAgreement/Overview'], 30000);
  const rememberAnswer = await ask('Did you tick “Husk mig på denne computer i 6 måneder”? Type YES to confirm: ');
  if (rememberAnswer !== 'YES') throw new Error('The six-month remember option was not confirmed. Weekly setup remains blocked.');
  return 'contact_profile_completed_manually_with_remember_me';
}

async function checkActiveOrders(page, requestedDate, order) {
  const body = await page.locator('body').innerText({ timeout: 15000 });
  const activeOrders = extractActiveHaveaffaldOrders(body);
  const unknownDates = activeOrders.filter((entry) => !entry.dateParsed);
  if (unknownDates.length) throw new Error(`Found ${unknownDates.length} existing Haveaffald order(s), but could not read their dates. Refusing to risk a duplicate order.`);
  const duplicate = activeOrders.find((entry) => entry.requestedDate === requestedDate);
  if (duplicate) {
    return { activeOrders, duplicate: true };
  }
  return { activeOrders, duplicate: false };
}

async function checkBasketBadge(page) {
  const numericLinks = page.locator('a[href*="/Basket/Overview"]');
  const count = await numericLinks.count();
  for (let i = 0; i < count; i += 1) {
    const link = numericLinks.nth(i);
    if (!(await link.isVisible().catch(() => false))) continue;
    const label = (await link.innerText().catch(() => '')).trim();
    if (/^\d+$/.test(label) && Number(label) > 0) {
      throw new Error(`The portal basket indicator shows ${label} item(s). Clear/review the basket manually before the weekly job; nothing was added.`);
    }
  }
}

async function navigateToOrderForm(page, settings, requestedDate, isTest) {
  const property = settings.property || {};
  const order = settings.order || {};
  if (property.lookupType !== 'address' || !property.lookupValue) throw new Error('settings.property.lookupType must be address and lookupValue must contain the property address.');
  await chooseProperty(page, property);
  await clickExactLink(page, 'a.items', 'BESTILLING');
  await waitForPath(page, ['/Authentication', '/WasteAgreement/Overview'], 30000);
  const contact = await readContact();
  const authResult = await handleWasteResponsiblePage(page, contact, isTest);
  if (routePath(page) !== '/WasteAgreement/Overview') await waitForPath(page, ['/WasteAgreement/Overview'], 30000);

  const active = await checkActiveOrders(page, requestedDate, order);
  await atomicWriteJson(path.join(artifactsDir, 'active-orders.json'), {
    capturedAt: new Date().toISOString(),
    status: 'read_only_active_order_check',
    requestedDateForThisRun: requestedDate,
    count: active.activeOrders.length,
    orders: active.activeOrders,
    note: 'Only matching Haveaffald order dates, statuses and prices are recorded. No order is created by this report.'
  });
  console.log(`Existing matching Haveaffald orders: ${active.activeOrders.length}`);
  for (const entry of active.activeOrders) console.log(`  ${entry.requestedDate} · ${entry.status} · ${entry.price || 'price not parsed'}`);
  if (active.duplicate && !isTest) return { duplicate: true, activeOrders: active.activeOrders, authResult };

  await checkBasketBadge(page);
  await clickExactLink(page, 'a.fractionTile', 'HAVEAFFALD');
  await waitForPath(page, ['/Action'], 30000);
  await clickExactLink(page, 'a.serviceTile', 'TØMNING AF MATERIEL');
  await waitForPath(page, ['/Site/SelectServiceSite'], 30000);

  const body = normalize(await page.locator('body').innerText());
  if (!body.includes(normalize(order.expectedHeading || 'Haveaffald - Tømning af materiel'))) throw new Error('The order form heading does not match the configured Haveaffald service.');
  if (!body.includes(normalize(order.expectedSite || 'VIGERSLEVVEJ 148'))) throw new Error('The order form does not show VIGERSLEVVEJ 148.');
  const dateInput = page.locator('#datepicker');
  if (await dateInput.count() !== 1 || !(await dateInput.isVisible())) throw new Error('The requested date field #datepicker is not visible.');
  const result = await setRequestedDate(dateInput, requestedDate);
  const message = String(order.message ?? settings.weekly?.message ?? '');
  if (message.length > 2000) throw new Error('Configured message exceeds 2,000 characters.');
  if (message) {
    const messageField = page.locator('#commentText');
    if (await messageField.count() !== 1 || !(await messageField.isVisible())) throw new Error('A message is configured, but #commentText is not visible.');
    await messageField.fill(message);
  }
  return { duplicate: active.duplicate, activeOrders: active.activeOrders, authResult, dateResult: result };
}

async function setRequestedDate(dateInput, date) {
  const result = await dateInput.evaluate((input, parts) => {
    const $ = window.jQuery;
    if (!$ || !$.datepicker || typeof $.datepicker.formatDate !== 'function' || !$(input).hasClass('hasDatepicker')) return { ok: false, reason: 'NemAffald datepicker API unavailable; refusing to guess date format.' };
    const format = $(input).datepicker('option', 'dateFormat');
    if (!format) return { ok: false, reason: 'Datepicker did not expose its date format.' };
    const dateObject = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
    const formatted = $.datepicker.formatDate(format, dateObject);
    try { $(input).datepicker('setDate', dateObject); $(input).trigger('change'); }
    catch (error) { return { ok: false, reason: `Could not set date: ${error.message}` }; }
    return { ok: input.value === formatted, format, formatted, actualValue: input.value };
  }, date);
  if (!result.ok) throw new Error(result.reason || `Requested date did not verify. Expected ${result.formatted}, got ${result.actualValue}.`);
  return result;
}

async function visibleElementCount(locator) {
  return locator.evaluateAll((elements) => elements.filter((element) => {
    const style = window.getComputedStyle(element); const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).length);
}

async function findVisibleNextLink(page) {
  const anchors = page.locator('a[href*="/Site/SelectServiceSite"]');
  const matches = [];
  for (let i = 0; i < await anchors.count(); i += 1) {
    const a = anchors.nth(i);
    if (normalize(await a.innerText().catch(() => '')) === 'videre' && await a.isVisible().catch(() => false) && await a.isEnabled().catch(() => false)) matches.push(a);
  }
  if (matches.length === 1) return matches[0];
  const span = page.locator('span.submitButton').filter({ hasText: /^\s*VIDERE\s*$/i });
  if (await span.count() === 1 && await span.isVisible().catch(() => false)) return span;
  throw new Error(`Could not uniquely identify VIDERE (found ${matches.length} matching links).`);
}

async function verifyBasket(page, order) {
  if (routePath(page) !== '/Basket/Overview') throw new Error(`Expected /Basket/Overview, found ${routePath(page)}.`);
  const body = await page.locator('body').innerText({ timeout: 15000 });
  const normalized = normalize(body);
  for (const [label, expected] of [
    ['collection', order.expectedBasketText || 'Haveaffald'],
    ['service', order.expectedServiceDescription || 'Tømning af materiel'],
    ['standplads', order.expectedSite || 'VIGERSLEVVEJ 148'],
    ['equipment', order.expectedEquipment || '240 l Havebeholder']
  ]) if (!normalized.includes(normalize(expected))) throw new Error(`Basket ${label} does not match expected value: ${expected}.`);
  const itemCount = await visibleElementCount(page.locator('a.deleteLineButton'));
  if (itemCount !== 1) throw new Error(`Expected exactly one basket item; found ${itemCount}.`);
  const totalMatch = body.match(/\bTOTAL\s*(DKK\s*[\d.,]+)/i);
  if (!totalMatch) throw new Error('Could not read the basket total.');
  const total = totalMatch[1].replace(/\s+/g, ' ').trim();
  if (normalize(total) !== normalize(order.expectedTotal || 'DKK 0,00')) throw new Error(`Basket total ${total} does not match expected ${order.expectedTotal || 'DKK 0,00'}.`);
  const terms = page.locator('#TermsOfDeliveryChecked');
  const submit = page.locator('#submitButton');
  if (await terms.count() !== 1 || !(await terms.isEnabled())) throw new Error('Delivery terms checkbox could not be verified.');
  if (await submit.count() !== 1 || !(await submit.isVisible()) || !(await submit.isEnabled()) || normalize(await submit.innerText()) !== 'godkend') throw new Error('Final GODKEND control could not be verified.');
  return { itemCount, total, terms, submit };
}

async function submitBasket(page, verified) {
  if (!(await verified.terms.isChecked())) await verified.terms.check({ timeout: 10000 });
  if (!(await verified.terms.isChecked())) throw new Error('Delivery terms checkbox did not remain checked.');
  const submitPath = await verified.submit.getAttribute('href');
  if (!submitPath || new URL(submitPath, page.url()).pathname !== '/Basket/Overview') throw new Error('GODKEND target did not match the inspected basket action.');
  // This state is persisted BEFORE the final click. The same date will never be
  // retried automatically if the connection fails after the portal receives it.
  return verified.submit;
}

async function main() {
  const settings = await loadSettings();
  const order = settings.order || {};
  const weekly = settings.weekly || {};
  if ((weekly.timezone || TIMEZONE) !== TIMEZONE) throw new Error(`Weekly timezone must be ${TIMEZONE}.`);
  if ((weekly.scheduleDay || 'Friday') !== 'Friday' || (weekly.scheduleTime || '04:00') !== '04:00') throw new Error('This build is configured for Fridays at 04:00 Europe/Copenhagen.');
  if (scheduledMode && process.env.CI === 'true' && process.env.NEMAFFALD_ENABLE_SUBMISSION !== 'true') {
    throw new Error('GitHub live ordering is disabled. Set the repository variable NEMAFFALD_ENABLE_SUBMISSION to true only after the hosted test succeeds and the Windows task has been disabled. No order was submitted.');
  }
  if (scheduledMode) {
    let readiness;
    try { readiness = JSON.parse(await readFile(path.join(artifactsDir, 'weekly-route-ready.json'), 'utf8')); }
    catch { throw new Error('No successful weekly:test readiness record exists. Run npm.cmd run weekly:test first.'); }
    if (readiness.status !== 'automated_route_and_datepicker_verified') {
      throw new Error('Weekly route readiness is not verified. Run npm.cmd run weekly:test before enabling scheduled ordering.');
    }
    if (process.env.CI === 'true') {
      const currentFingerprint = await getAutomationFingerprint();
      if (readiness.automationFingerprint !== currentFingerprint) {
        throw new Error('The hosted automation files changed after the last successful test. Run workflow_dispatch in test mode again on the default branch before production.');
      }
    }
  }

  await acquireLock();

  const requestedDate = nextFridayDate();
  const state = await readState();
  const skipDates = Array.isArray(weekly.skipRequestedDates) ? weekly.skipRequestedDates.map(String) : [];
  if (skipDates.includes(requestedDate.iso)) {
    const log = await writeRunLog({ status: 'skipped_configured_date', requestedDate: requestedDate.iso });
    console.log(`Requested date ${requestedDate.iso} is on weekly.skipRequestedDates. Skipped. Log: ${log}`);
    return;
  }
  if (state.lastAttemptedRequestedDate === requestedDate.iso || state.lastConfirmedRequestedDate === requestedDate.iso) {
    throw new Error(`Requested date ${requestedDate.iso} already has a recorded attempt/submission. Refusing a duplicate run.`);
  }

  const { context: browserContext, page } = await launchPortal(settings, { headless: process.env.CI === 'true', startUrl: settings.portalUrl || 'https://nemaffaldsservice.kk.dk/' });
  context = browserContext;
  if (routePath(page) !== '/') throw new Error(`Expected front page at start; found ${routePath(page)}.`);

  const route = await navigateToOrderForm(page, settings, requestedDate, testMode);
  if (route.duplicate && !testMode) {
    const log = await writeRunLog({ status: 'skipped_existing_active_order', requestedDate: requestedDate.iso, matchingActiveOrders: route.activeOrders.length });
    console.log(`An existing Haveaffald order already requests ${requestedDate.iso}. Skipped to avoid a duplicate. Log: ${log}`);
    return;
  }
  if (route.duplicate && testMode) {
    console.log('TEST MODE: this requested date already exists in Aktive Bestillinger. Continuing only to verify the hosted service form; no order will be added or submitted.');
  }

  console.log('\nVerified weekly order target:');
  console.log(`  Service: ${order.expectedHeading || 'Haveaffald - Tømning af materiel'}`);
  console.log(`  Standplads: ${order.expectedSite || 'VIGERSLEVVEJ 148'}`);
  console.log(`  Requested date: ${formatDate(requestedDate)} (${route.dateResult.formatted})`);
  console.log(`  Existing active matching orders: ${route.activeOrders.length}`);
  console.log(`  Contact page: ${route.authResult}`);

  if (testMode) {
    await atomicWriteJson(path.join(artifactsDir, 'weekly-route-ready.json'), {
      testedAt: new Date().toISOString(),
      sourceRevision: process.env.GITHUB_SHA || null,
      automationFingerprint: process.env.CI === 'true' ? await getAutomationFingerprint() : null,
      status: 'automated_route_and_datepicker_verified',
      homepagePropertySearch: 'passed',
      overviewBookingNavigation: 'passed',
      activeOrdersDateCheck: 'passed',
      contactPageHandling: route.authResult,
      service: order.expectedHeading || 'Haveaffald - Tømning af materiel',
      standplads: order.expectedSite || 'VIGERSLEVVEJ 148',
      requestedDate: requestedDate.iso,
      datepickerFormat: route.dateResult.format,
      datepickerValue: route.dateResult.actualValue,
      note: 'Automatic route and requested-date entry verified in test mode. No VIDERE, terms checkbox or final GODKEND action was performed.'
    });
    console.log('\nTEST MODE SUCCEEDED.');
    console.log('The script navigated from the front page to the Haveaffald form and populated the following-Friday date.');
    console.log('No order was added to the basket and no final submission was made.');
    console.log('Route readiness saved to artifacts/weekly-route-ready.json.');
    if (process.env.CI === 'true') {
      console.log('CI test complete. Closing the headless browser without waiting for interactive input.');
    } else {
      await ask('Review the form in the browser, then press Enter to close... ');
    }
    return;
  }

  const next = await findVisibleNextLink(page);
  await next.scrollIntoViewIfNeeded();
  await next.click({ timeout: 15000 });
  await waitForPath(page, ['/Basket/Overview'], 30000);
  const basket = await verifyBasket(page, order);
  const submit = await submitBasket(page, basket);

  await atomicWriteJson(statePath, {
    ...state,
    lastAttemptedRequestedDate: requestedDate.iso,
    lastAttemptedAt: new Date().toISOString(),
    lastStatus: 'approval_attempted'
  });
  approvalAttempted = true;
  let clickError = null;
  try { await submit.click({ timeout: 15000 }); }
  catch (error) {
    clickError = error.message;
    console.error(`GODKEND click returned an error: ${error.message}`);
    console.error('The order may still have reached the municipality. It will not be retried automatically.');
  }

  await page.waitForTimeout(7000);
  const finalPath = routePath(page);
  const finalText = normalize(await page.locator('body').innerText().catch(() => ''));
  const success = finalPath === '/Basket/PreApproveOrder' && finalText.includes('din henvendelse er nu registreret hos københavns kommune');
  const finalState = {
    ...state,
    lastAttemptedRequestedDate: requestedDate.iso,
    lastAttemptedAt: new Date().toISOString(),
    lastStatus: success ? 'submitted_and_confirmation_observed' : 'approval_attempted_outcome_unconfirmed',
    ...(success ? { lastConfirmedRequestedDate: requestedDate.iso, lastConfirmedAt: new Date().toISOString() } : {})
  };
  await atomicWriteJson(statePath, finalState);
  const log = await writeRunLog({
    status: success ? 'submitted_and_confirmation_observed' : 'approval_attempted_outcome_unconfirmed',
    requestedDate: requestedDate.iso,
    service: order.expectedHeading || 'Haveaffald - Tømning af materiel',
    standplads: order.expectedSite || 'VIGERSLEVVEJ 148',
    equipment: order.expectedEquipment || '240 l Havebeholder',
    itemCount: basket.itemCount,
    total: basket.total,
    approvalAttempted,
    clickError,
    finalPath
  });
  if (success) {
    console.log('\nNemAffald confirms: Din henvendelse er nu registreret hos Københavns Kommune.');
    console.log('The requested date remains subject to the municipality\'s confirmation email.');
  } else {
    throw new Error(`Final approval was attempted, but confirmation could not be verified. Do not retry. Check NemAffald and email. Final path: ${finalPath}.`);
  }
  console.log(`Run log: ${path.relative(projectRoot, log)}`);
}

try {
  await main();
} catch (error) {
  console.error(`\nNemAffald weekly run stopped safely: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeContext(context);
  await releaseLock();
}
