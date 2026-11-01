import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BRAVE = 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
const ORIGINAL = pathToFileURL(path.join(root, 'design-source', 'pin-print-studio.html')).href;
const APP = process.env.APP_URL || 'http://127.0.0.1:4180/';
const SHOTS = path.join(root, 'tools', 'screenshots');

const PAGES = ['home', 'editor', 'gallery', 'templates', 'history', 'settings', 'help'];
const TOLERANCE = 1.5;

async function collectRects(page) {
  return page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-od-id]').forEach((el) => {
      const id = el.getAttribute('data-od-id');
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        out[id] = { hidden: true };
        return;
      }
      out[id] = {
        x: Math.round(r.x * 10) / 10,
        y: Math.round(r.y * 10) / 10,
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
      };
    });
    return out;
  });
}

async function gotoPage(page, name, selector) {
  const ok = await page.evaluate((sel) => Boolean(document.querySelector(sel)), selector);
  if (!ok) return false;
  await page.evaluate((n) => {
    if (window.pinGoPage) {
      window.pinGoPage(n);
    } else {
      const btn = document.querySelector(`[data-nav="${n}"]`);
      if (btn) btn.click();
    }
  }, name);
  await page.waitForTimeout(350);
  return true;
}

const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
fs.mkdirSync(SHOTS, { recursive: true });

const original = await ctx.newPage();
await original.goto(ORIGINAL, { waitUntil: 'load' });
await original.waitForTimeout(600);

const app = await ctx.newPage();
const consoleErrors = [];
app.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
app.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));
app.on('response', (r) => { if (r.status() >= 400) consoleErrors.push('HTTP' + r.status() + ' ' + r.url()); });
await app.goto(APP, { waitUntil: 'load' });
await app.waitForTimeout(900);

let totalChecked = 0;
let totalMissing = 0;
let totalMismatch = 0;
const report = [];

for (const name of PAGES) {
  await gotoPage(original, name, '[data-page="' + name + '"]');
  const appHasPage = await gotoPage(app, name, '[data-page="' + name + '"]');
  if (!appHasPage) { report.push({ page: name, compared: 0, missing: ['PAGE NOT RENDERED IN APP'], mismatched: [] }); totalMissing += 1; continue; }
  /* dismiss toasts so they never affect geometry */
  await original.evaluate(() => document.querySelectorAll('.toast').forEach((t) => { t.style.display = 'none'; }));
  await app.evaluate(() => document.querySelectorAll('.toast').forEach((t) => { t.style.display = 'none'; }));
  await original.waitForTimeout(120);
  await app.waitForTimeout(120);

  const a = await collectRects(original);
  const b = await collectRects(app);

  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  const missing = [];
  const mismatched = [];

  for (const id of ids) {
    const ra = a[id];
    const rb = b[id];
    totalChecked += 1;
    if (!ra || !rb) {
      missing.push(id + (!ra ? ' (only in app)' : ' (only in original)'));
      continue;
    }
    if (ra.hidden || rb.hidden) {
      if (Boolean(ra.hidden) !== Boolean(rb.hidden)) mismatched.push(`${id} hidden ${ra.hidden} vs ${rb.hidden}`);
      continue;
    }
    const d = Math.max(Math.abs(ra.x - rb.x), Math.abs(ra.y - rb.y), Math.abs(ra.w - rb.w), Math.abs(ra.h - rb.h));
    if (d > TOLERANCE) mismatched.push(`${id}: max Δ ${d.toFixed(1)}px  orig[${ra.x},${ra.y} ${ra.w}×${ra.h}] app[${rb.x},${rb.y} ${rb.w}×${rb.h}]`);
  }

  totalMissing += missing.length;
  totalMismatch += mismatched.length;
  report.push({ page: name, compared: ids.size, missing, mismatched });

  await original.screenshot({ path: path.join(SHOTS, `orig-${name}.png`) });
  await app.screenshot({ path: path.join(SHOTS, `app-${name}.png`) });
}

/* dialogs: open the export dialog on both and compare */
await gotoPage(original, 'editor');
await gotoPage(app, 'editor');
await original.evaluate(() => window.pinOpenDialog && window.pinOpenDialog('dlg-export'));
await app.evaluate(() => {
  const btn = document.querySelector('[data-od-id="btn-export"]');
  if (btn) btn.click();
});
await original.waitForTimeout(420);
await app.waitForTimeout(420);
await original.screenshot({ path: path.join(SHOTS, 'orig-dialog-export.png') });
await app.screenshot({ path: path.join(SHOTS, 'app-dialog-export.png') });

await browser.close();

console.log('\n═══ PARITY REPORT ═══');
for (const r of report) {
  console.log(`\n▸ ${r.page}: ${r.compared} data-od-id nodes, ${r.missing.length} missing, ${r.mismatched.length} mismatched`);
  r.missing.slice(0, 12).forEach((m) => console.log('   MISSING  ' + m));
  r.mismatched.slice(0, 12).forEach((m) => console.log('   MISMATCH ' + m));
}
console.log(`\nTOTAL: ${totalChecked} nodes · ${totalMissing} missing · ${totalMismatch} mismatch`);
if (consoleErrors.length) {
  console.log('\nCONSOLE ERRORS (' + consoleErrors.length + '):');
  consoleErrors.slice(0, 15).forEach((e) => console.log('  ' + e));
}
console.log('Screenshots →', SHOTS);
process.exit(totalMismatch === 0 && totalMissing === 0 && consoleErrors.length === 0 ? 0 : 1);
