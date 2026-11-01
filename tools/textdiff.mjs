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
await app.waitForTimeout(900);

const fn = (_page) => {
  const nodes = [...document.querySelectorAll('[data-od-id]')];
  return nodes.map((n) => ({ id: n.getAttribute('data-od-id'), page: n.closest('[data-page]') ? n.closest('[data-page]').getAttribute('data-page') : '-', text: (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90) }));
};
const a = await orig.evaluate(fn);
const b = await app.evaluate(fn);
const mapB = new Map(b.map((x) => [x.id, x]));
const diffs = [];
for (const x of a) {
  const y = mapB.get(x.id);
  if (!y) { diffs.push('ONLY-ORIG ' + x.id); continue; }
  if (x.text !== y.text) diffs.push('[' + x.page + '] ' + x.id + '\n   O: ' + x.text + '\n   A: ' + y.text);
}
const setA = new Set(a.map((x) => x.id));
for (const y of b) if (!setA.has(y.id)) diffs.push('ONLY-APP ' + y.id);
fs.writeFileSync('tools/text-diff.txt', diffs.join('\n'));
await browser.close();
console.log('diffs', diffs.length);
