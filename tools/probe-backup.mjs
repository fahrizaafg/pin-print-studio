/* Probe diagnostik sementara: kenapa dialog backup tidak memicu unduhan .pinzip. HAPUS setelah dipakai. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.PIN_URL || 'http://127.0.0.1:5175/';
const CANDIDATES = [
  process.env.PIN_CHROME,
  'C:/Users/Fahriza/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const pickExe = () => {
  for (const p of CANDIDATES) { try { fs.accessSync(p); return p; } catch { /* lanjut */ } }
  return undefined;
};
const EXE = pickExe();

const browser = await chromium.launch(EXE ? { executablePath: EXE, headless: true } : { headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('PAGEERROR:', String((e && e.message) || e).slice(0, 300)));

await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(800);
await page.click("[data-od-id='nav-history']");
await page.waitForTimeout(400);
console.log('history-active:', await page.locator('#page-history.is-active').count());
await page.click("[data-od-id='btn-backup']");
await page.waitForTimeout(600);
console.log('dlg-backup-open:', await page.locator('#dlg-backup.is-open').count());
console.log('start-btn-count:', await page.locator("[data-od-id='btn-start-backup']").count());

let dlFired = false;
page.on('download', () => { dlFired = true; console.log('DOWNLOAD-FIRED'); });
await page.locator("[data-od-id='btn-start-backup']").click({ timeout: 10000 }).catch((e) => console.log('CLICK-ERR:', String(e).split('\n')[0]));
for (let i = 0; i < 10; i += 1) {
  await page.waitForTimeout(800);
  const openNow = await page.locator('#dlg-backup.is-open').count();
  const prog = await page.locator('#dlg-backup').first().textContent().catch(() => '');
  console.log(`t=${((i + 1) * 0.8).toFixed(1)}s open=${openNow} dl=${dlFired} prog=`, (prog || '').replace(/\s+/g, ' ').trim().slice(0, 160));
  if (dlFired) break;
}
console.log('HASIL-AKHIR dlFired=' + dlFired);
await browser.close();
