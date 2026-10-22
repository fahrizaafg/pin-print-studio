import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const orig = await ctx.newPage();
await orig.goto(pathToFileURL('design-source/pin-print-studio.html').href);
await orig.waitForTimeout(500);
const app = await ctx.newPage();
await app.goto('http://127.0.0.1:4180/');
await app.waitForTimeout(1000);
const go = async (p) => { await p.evaluate(() => { const b = document.querySelector('[data-nav="editor"]'); if (b) b.click(); }); await p.waitForTimeout(350); };
await go(orig); await go(app);
// hide toasts & tooltips in both
for (const p of [orig, app]) await p.evaluate(() => { document.querySelectorAll('.toast').forEach((t) => { t.style.display = 'none'; }); const tl = document.querySelector('.tooltip-layer'); if (tl) tl.style.display = 'none'; });
await orig.waitForTimeout(200); await app.waitForTimeout(200);

const fn = () => {
  const sec = document.querySelector('[data-page="editor"]');
  return [...sec.querySelectorAll('*')].map((el) => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, cls: String(el.className).slice(0, 26), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
};
const a = await orig.evaluate(fn);
const b = await app.evaluate(fn);
const out = [];
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  const x = a[i], y = b[i];
  if (!x || !y) { out.push('idx' + i + ' ' + (i < a.length ? 'ONLY-ORIG ' : 'ONLY-APP ') + JSON.stringify((x || y)).slice(0, 200)); continue; }
  const geo = Math.abs(x.x - y.x) > 1.5 || Math.abs(x.y - y.y) > 1.5 || Math.abs(x.w - y.w) > 1.5 || Math.abs(x.h - y.h) > 1.5;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  if (geo || norm(x.text) !== norm(y.text) || x.tag !== y.tag) {
    out.push('idx' + i + ' <' + x.tag + ' ' + x.cls + '> geo:' + (geo ? 'Y' : 'n') + ' O[' + x.x + ',' + x.y + ' ' + x.w + 'x' + x.h + '] "' + norm(x.text).slice(0, 50) + '" ### A[' + y.x + ',' + y.y + ' ' + y.w + 'x' + y.h + '] "' + norm(y.text).slice(0, 50) + '"');
  }
}
fs.writeFileSync('tools/editor-diff.txt', out.join('\n'));
console.log('n', out.length, 'a', a.length, 'b', b.length);
// screenshots for visual comparison
await orig.screenshot({ path: 'tools/screenshots/orig-editor-clean.png' });
await app.screenshot({ path: 'tools/screenshots/app-editor-clean.png' });
await browser.close();
