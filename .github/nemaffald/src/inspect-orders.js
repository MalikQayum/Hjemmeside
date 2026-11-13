import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, artifactsDir, closeContext, launchPortal, loadSettings } from './browser.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let context;
const normalize = (v) => String(v || '').replace(/\s+/g, ' ').trim();

function dateFromText(text) {
  const m = String(text || '').match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (!m) return null;
  const d = Number(m[1]); const mo = Number(m[2]); const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseOrders(text) {
  const start = text.indexOf('Aktive Bestillinger');
  const end = text.indexOf('Bestilling - Vælg affaldsordning', Math.max(start, 0));
  if (start < 0 || end < 0 || end <= start) throw new Error('Could not locate the active orders section.');
  const section = text.slice(start, end);
  const blocks = section.match(/Haveaffald[\s\S]*?(?=Haveaffald|$)/g) || [];
  return blocks.filter((b) => /Tømning af materiel/i.test(b) && /Vigerslevvej\s+148/i.test(b) && /240\s*l\s*Havebeholder/i.test(b)).map((block) => ({
    service: 'Haveaffald – Tømning af materiel',
    site: 'Vigerslevvej 148',
    equipment: '240 l Havebeholder',
    requestedDate: dateFromText(block),
    status: /Ikke bekræftet/i.test(block) ? 'Ikke bekræftet' : /Bekræftet/i.test(block) ? 'Bekræftet' : 'Ukendt',
    price: block.match(/DKK\s*[\d.,]+/i)?.[0] || null
  }));
}

async function main() {
  const settings = await loadSettings();
  const { context: ctx, page } = await launchPortal(settings, { startUrl: settings.portalUrl || 'https://nemaffaldsservice.kk.dk/' });
  context = ctx;
  console.log('Navigate through NemAffald to BESTILLING > the page headed “Aktive Bestillinger”.');
  console.log('Do not select a new waste type and do not click GODKEND.');
  await ask('When Aktive Bestillinger is visible, press Enter here... ');
  const url = new URL(page.url());
  if (url.hostname !== 'nemaffaldsservice.kk.dk' || url.pathname !== '/WasteAgreement/Overview') throw new Error(`Expected /WasteAgreement/Overview, found ${url.pathname}.`);
  const body = await page.locator('body').innerText();
  const orders = parseOrders(body);
  const report = {
    capturedAt: new Date().toISOString(),
    status: 'read_only_active_order_check',
    count: orders.length,
    orders,
    note: 'Only the existing Haveaffald orders for Vigerslevvej 148 and their dates/status/prices are recorded. No orders were created, changed or submitted.'
  };
  await writeFile(path.join(artifactsDir, 'active-orders.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nFound ${orders.length} matching active Haveaffald order(s):`);
  for (const [i, order] of orders.entries()) console.log(`  ${i + 1}. ${order.requestedDate || 'DATE NOT READ'} · ${order.status} · ${order.price || 'price not read'}`);
  console.log(`\nSaved: ${path.relative(root, path.join(artifactsDir, 'active-orders.json'))}`);
  if (orders.some((order) => !order.requestedDate)) console.log('WARNING: At least one order date could not be read. Do not enable weekly ordering until reviewed.');
  await ask('\nPress Enter to close the browser... ');
}

try { await main(); }
catch (error) { console.error(`\nActive-order inspection failed: ${error.message}`); process.exitCode = 1; }
finally { await closeContext(context); }
