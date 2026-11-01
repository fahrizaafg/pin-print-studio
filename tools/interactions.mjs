import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CANDIDATES = [
  process.env.PIN_CHROME,
  'C:/Users/Fahriza/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const pickExecutable = () => {
  for (const p of CANDIDATES) {
    try { fs.accessSync(p); return p; } catch { /* coba berikutnya */ }
  }
  return undefined;
};
const EXE = pickExecutable();
const BASE = process.env.PIN_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch(EXE ? { executablePath: EXE, headless: true } : { headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const results = [];
const step = async (name, fn) => {
  try { const v = await fn(); results.push('✓ ' + name + (v === undefined ? '' : ' → ' + JSON.stringify(v))); }
  catch (e) { results.push('✗ ' + name + ' → ' + e.message); }
};

// navigation across every page
for (const p of ['editor', 'gallery', 'templates', 'history', 'settings', 'help', 'home']) {
  await step('nav ' + p, async () => {
    await page.click(`[data-od-id='nav-${p}']`);
    await page.waitForTimeout(220);
    return await page.evaluate((n) => document.querySelector('[data-page="' + n + '"]').classList.contains('is-active'), p);
  });
}
// editor interactions
await page.click("[data-od-id='nav-editor']");
await page.waitForTimeout(250);

await step('zoom in', async () => {
  const before = await page.textContent('#zoom-val');
  await page.click('#zoom-in');
  await page.waitForTimeout(200);
  return before + ' -> ' + await page.textContent('#zoom-val');
});
await step('zoom fit', async () => {
  await page.click('#zoom-fit');
  await page.waitForTimeout(250);
  return await page.textContent('#zoom-val');
});
await step('toggle layer', async () => {
  const sel = "[data-od-id='toggle-margin']";
  const before = await page.getAttribute(sel, 'class');
  await page.click(sel);
  await page.waitForTimeout(200);
  return before + ' -> ' + await page.getAttribute(sel, 'class');
});
await step('select pin', async () => {
  await page.click('#page-editor .sheet .pin');
  await page.waitForTimeout(250);
  return await page.evaluate(() => document.querySelectorAll('#page-editor .sheet .pin.is-selected').length);
});
await step('page add', async () => {
  const b = await page.textContent('#page-indicator');
  await page.click('#page-add');
  await page.waitForTimeout(250);
  return b + ' -> ' + await page.textContent('#page-indicator');
});
await step('save', async () => {
  await page.click('#rail-save');
  await page.waitForTimeout(600);
  return await page.textContent('#save-label');
});
await step('open export dialog', async () => {
  await page.click('[data-od-id="btn-export"]');
  await page.waitForTimeout(400);
  return await page.evaluate(() => document.getElementById('dlg-export').classList.contains('is-open'));
});
await step('close export dialog', async () => {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return await page.evaluate(() => document.getElementById('dlg-export').classList.contains('is-open'));
});
await step('confirm flow', async () => {
  await page.click('#page-del');
  await page.waitForTimeout(400);
  const open = await page.evaluate(() => document.getElementById('dlg-confirm').classList.contains('is-open'));
  const msg = await page.textContent('#confirm-msg');
  await page.click('#confirm-ok');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => document.getElementById('dlg-confirm').classList.contains('is-open'));
  return { open, msg: msg.slice(0, 40), closed };
});
await step('undo', async () => {
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  return await page.textContent('#page-indicator');
});
await step('dialogs inventory', async () => {
  const ids = await page.evaluate(() => [...document.querySelectorAll('.overlay[id]')].map((o) => o.id));
  return ids.length + ': ' + ids.join(',');
});
await step('persisted localStorage', async () => {
  return await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pin-studio:')).length);
});

fs.mkdirSync('tools/screenshots', { recursive: true });
await page.screenshot({ path: 'tools/screenshots/app-editor-final.png', fullPage: false });
fs.writeFileSync('tools/interaction-report.txt', results.join('\n') + '\n\nERRORS: ' + (errs.length ? errs.join(' | ') : 'none'));
await browser.close();
