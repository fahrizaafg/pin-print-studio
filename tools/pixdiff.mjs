import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const SH = 'tools/screenshots';
const pages = ['home','editor','gallery','templates','history','settings','help'];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true });
const page = await browser.newPage();

const lines = [];
for (const p of pages) {
  const a = fs.readFileSync(path.join(SH, 'orig-' + p + '.png')).toString('base64');
  const b = fs.readFileSync(path.join(SH, 'app-' + p + '.png')).toString('base64');
  const res = await page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { err: 'size ' + ia.width + 'x' + ia.height + ' vs ' + ib.width + 'x' + ib.height };
    const c = document.createElement('canvas');
    c.width = ia.width; c.height = ia.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(ia, 0, 0);
    const da = ctx.getImageData(0, 0, c.width, c.height).data;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(ib, 0, 0);
    const db = ctx.getImageData(0, 0, c.width, c.height).data;
    let diff = 0;
    const bands = new Array(9).fill(0);
    const H = c.height;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 24) { diff++; const y = Math.floor((i / 4 / c.width) / (H / 9)); if (y >= 0 && y < 9) bands[y]++; }
    }
    return { total: c.width * c.height, diff, pct: (diff / (c.width * c.height) * 100).toFixed(3), bands };
  }, [a, b]);
  lines.push(p + ': ' + JSON.stringify(res));
}
fs.writeFileSync('tools/pixel-diff.txt', lines.join('\n'));
await browser.close();
