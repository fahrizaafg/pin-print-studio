import { chromium } from 'playwright-core';
import fs from 'node:fs';
const CANDIDATES = [
  process.env.PIN_CHROME,
  'C:/Users/Fahriza/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const pickExe = () => { for (const p of CANDIDATES) { try { fs.accessSync(p); return p; } catch { } } return undefined; };
const EXE = pickExe();
console.log('EXE:', EXE || '(bundled)');

const browser = await chromium.launch(EXE ? { executablePath: EXE, headless: true } : { headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

console.log('goto...');
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const title = await page.title();
const html = await page.content();
const rootContent = await page.evaluate(() => {
  const root = document.getElementById('root');
  return root ? root.innerHTML.slice(0, 800) : 'NO #root';
});
const navCount = await page.evaluate(() => document.querySelectorAll('[data-od-id]').length);
const pageHome = await page.evaluate(() => {
  const el = document.getElementById('page-home');
  return el ? 'FOUND' : 'NO #page-home';
});

console.log('title:', title);
console.log('bodyLen:', html.length);
console.log('rootContent:', rootContent);
console.log('data-od-id count:', navCount);
console.log('page-home:', pageHome);
console.log('errors:', errs);
await page.screenshot({ path: 'tools/screenshots/probe-clean.png' });
await browser.close();
