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
const go = async (p) => { await p.evaluate(() => { const b = document.querySelector('[data-nav="editor"]'); if (b) b.click(); }); await p.waitForTimeout(350); };
await go(orig); await go(app);
const fn = () => {
  const out = {};
  document.querySelectorAll('.pin').forEach((p, i) => {
    const art = p.querySelector('.pin-art');
    const svg = p.querySelector('.pin-art svg');
    const r = p.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    const sr = svg.getBoundingClientRect();
    out['pin' + (i + 1)] = {
      pin: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      art: [Math.round(ar.x), Math.round(ar.y), Math.round(ar.width), Math.round(ar.height)],
      svg: [Math.round(sr.x), Math.round(sr.y), Math.round(sr.width), Math.round(sr.height)],
      svgBox: svg.getAttribute('viewBox'),
      artCS: getComputedStyle(art).width + '|' + getComputedStyle(art).height,
      svgCS: getComputedStyle(svg).width + '|' + getComputedStyle(svg).height,
    };
  });
  return out;
};
const a = await orig.evaluate(fn);
const b = await app.evaluate(fn);
const lines = [];
for (const k of Object.keys(a)) {
  const x = a[k], y = b[k];
  const same = JSON.stringify(x) === JSON.stringify(y);
  lines.push(k + (same ? ' OK' : ' DIFF') + '\n  O ' + JSON.stringify(x) + '\n  A ' + JSON.stringify(y));
}
fs.writeFileSync('tools/pins2.txt', lines.join('\n'));
await browser.close();
