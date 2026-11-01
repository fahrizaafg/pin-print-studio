import { chromium } from 'playwright-core';
const BASE = 'http://127.0.0.1:5174/';
const browser = await chromium.launch({ executablePath: 'C:/Users/Fahriza/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + (e.message||'').slice(0,300)));
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.click("[data-od-id='nav-editor']");
await p.waitForTimeout(400);

// 1) box select: drag empty area kanan-bawah ke kiri-atas
const sheet = p.locator('#sheet');
const box = await sheet.boundingBox();
console.log('sheet box', box ? Math.round(box.width)+'x'+Math.round(box.height) : 'none');
await p.mouse.move(box.x + box.width - 30, box.y + box.height - 60);
await p.mouse.down();
await p.mouse.move(box.x + 60, box.y + 60, { steps: 12 });
await p.mouse.up();
await p.waitForTimeout(300);
const marqueeGone = await p.locator("[data-od-id='marquee-box']").count();
const selCount = await p.evaluate(() => document.querySelectorAll('#page-editor .sheet .pin.is-selected').length);
const hint = await p.locator("[data-od-id='multi-hint']").count();
console.log('marquee leftover', marqueeGone, 'selected', selCount, 'hint', hint);
console.log(selCount >= 2 && marqueeGone === 0 ? 'BOX-SELECT-OK' : 'BOX-SELECT-FAIL');

// 2) ctrl+klik toggle satu pin
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
const afterEsc = await p.evaluate(() => document.querySelectorAll('#page-editor .sheet .pin.is-selected').length);
console.log('after esc', afterEsc);
await p.locator('#page-editor .sheet .pin').first().click({ force: true });
await p.waitForTimeout(250);
const one = await p.evaluate(() => document.querySelectorAll('#page-editor .sheet .pin.is-selected').length);
console.log('single', one);
// ctrl-click pin kedua
await p.keyboard.down('Control');
await p.locator('#page-editor .sheet .pin').nth(1).click({ force: true });
await p.keyboard.up('Control');
await p.waitForTimeout(250);
const two = await p.evaluate(() => document.querySelectorAll('#page-editor .sheet .pin.is-selected').length);
console.log('after ctrl-click', two, two === 2 ? 'CTRL-MULTI-OK' : 'CTRL-MULTI-FAIL');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);

// 3) export berisi foto + tanpa angka (render langsung)
const out = await p.evaluate(async () => {
  const mod = await import('/src/lib/exporters.js');
  const c = document.createElement('canvas'); c.width = 200; c.height = 100;
  const g = c.getContext('2d');
  g.fillStyle = '#ff0000'; g.fillRect(0,0,100,100);
  g.fillStyle = '#0000ff'; g.fillRect(100,0,100,100);
  const url = c.toDataURL('image/png');
  const pins = [{ id:'t1', x:60, y:60, size:150, art:'art-blue', label:'x', url, crop:true, cropX:50, cropY:50, cropZoom:100, rotate:0 }];
  const blob = await mod.renderSheetPng({ pins, toggles:{ number:true }, paper:'a3', dpi:'150 DPI', cropmark:false, cutStyle:'solid', photoRatio:0.82 });
  const bmp = await createImageBitmap(blob);
  const cv = document.createElement('canvas'); cv.width=40; cv.height=40;
  const cx = cv.getContext('2d');
  const sx = Math.round(bmp.width*135/620)-20, sy = Math.round(bmp.height*135/877)-20;
  cx.drawImage(bmp, sx, sy, 40, 40, 0, 0, 40, 40);
  const d = cx.getImageData(0,0,40,40).data;
  let red=0,blue=0,n=0; for(let i=0;i<d.length;i+=16){red+=d[i];blue+=d[i+2];n++;}
  return { size: blob.size, r: Math.round(red/n), b: Math.round(blue/n) };
});
console.log('export sample', out, out.r > 60 && out.b > 60 ? 'PHOTO-FIT-OK' : 'PHOTO-FIT-FAIL');

// 4) printSheets resolves true (tidak blank)
const pr = await p.evaluate(async () => {
  const mod = await import('/src/lib/exporters.js');
  const ok = await mod.printSheets({ pages: [{ pins: [], toggles: {} }], paper: 'a3', dpi: '150 DPI', cropmark: false });
  await new Promise(r => setTimeout(r, 800));
  const frames = document.querySelectorAll('iframe').length;
  const _imgs = document.querySelectorAll('iframe img').length;
  return { ok, frames };
});
console.log('print', pr, pr.ok ? 'PRINT-OK' : 'PRINT-FAIL');
console.log('ERRORS', errs.length ? errs.join(' | ') : 'none');
await browser.close();
