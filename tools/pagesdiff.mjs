import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const orig = await ctx.newPage();
await orig.goto(pathToFileURL('design-source/pin-print-studio.html').href);
await orig.waitForTimeout(400);
const app = await ctx.newPage();
await app.goto('http://127.0.0.1:4180/');
await app.waitForTimeout(900);
const go = async (p, n) => { await p.evaluate((x) => { const b = document.querySelector('[data-nav="' + x + '"]'); if (b) b.click(); }, n); await p.waitForTimeout(320); };
const out = [];
for (const pg of ['settings', 'help', 'gallery']) {
  await go(orig, pg); await go(app, pg);
  const fn = (sel) => {
    const sec = document.querySelector('[data-page="' + sel + '"]');
    return [...sec.querySelectorAll('*')].map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, cls: String(el.className).slice(0, 26), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
  };
  const a = await orig.evaluate(fn, pg);
  const b = await app.evaluate(fn, pg);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (!x || !y) { out.push(pg + ' idx' + i + ' ' + (i < a.length ? 'ONLY-ORIG ' : 'ONLY-APP ') + JSON.stringify(x || y)); continue; }
    const same = x.text === y.text && Math.abs(x.x - y.x) < 1.5 && Math.abs(x.y - y.y) < 1.5 && Math.abs(x.w - y.w) < 1.5 && Math.abs(x.h - y.h) < 1.5;
    if (!same) out.push(pg + ' idx' + i + ' <' + x.tag + ' ' + x.cls + '> O[' + x.x + ',' + x.y + ' ' + x.w + 'x' + x.h + '] "' + x.text + '" ### A[' + y.x + ',' + y.y + ' ' + y.w + 'x' + y.h + '] "' + y.text + '"');
  }
}
fs.writeFileSync('tools/pages-diff.txt', out.join('\n'));
console.log('n', out.length);
await browser.close();
