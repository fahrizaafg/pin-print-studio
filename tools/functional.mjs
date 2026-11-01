/* Harness fungsional Pin Print Studio — Chromium bundled (playwright-core).
   Membuktikan tiap alur punya efek nyata + tidak ada error konsol. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

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
const CHROME = pickExecutable();
const BASE = process.env.PIN_URL || 'http://127.0.0.1:5173/';
const OUT = path.resolve('tools/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail: detail === undefined ? '' : String(detail) });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch(CHROME ? { executablePath: CHROME, headless: true } : { headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();

const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => problems.push('pageerror: ' + (e && e.message ? e.message : e)));

const txt = async (sel) => ((await page.locator(sel).first().textContent()) || '').replace(/\s+/g, ' ').trim();
const cnt = async (sel) => page.locator(sel).count();
const vis = async (sel) => page.locator(sel + ':visible').count();
const nav = async (id) => { await page.click(`[data-od-id='nav-${id}']`); await page.waitForTimeout(220); };
const isActive = async (sel) => page.locator(sel).evaluate((el) => el.classList.contains('is-active')).catch(() => false);

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
record('aplikasi termuat', (await cnt('#page-home')) > 0, 'proyek: ' + (await txt('#rail-project-name')));

/* 1 — navigasi seluruh halaman */
for (const [id, sel] of [['editor', '#page-editor'], ['gallery', '#page-gallery'], ['templates', '#page-templates'], ['history', '#page-history'], ['settings', '#page-settings'], ['help', '#page-help'], ['home', '#page-home']]) {
  await nav(id);
  record('navigasi ' + id, await isActive(sel));
}

/* 2 — editor: terapkan diameter ke pin terpilih */
await nav('editor');
const pinsTotal = await cnt('#page-editor .sheet .pin');
await page.locator('#page-editor .sheet .pin').first().click({ force: true });
await page.waitForTimeout(300);
const widthOf = () => page.locator('#page-editor .sheet .pin.is-selected').first().evaluate((el) => el.style.width);
const wBefore = await widthOf();
await page.fill('#in-cut', '70');
await page.dispatchEvent('#in-cut', 'change');
await page.click('#btn-apply-selected');
await page.waitForTimeout(350);
const wAfter = await widthOf();
record('terapkan diameter ke pin terpilih', wBefore !== wAfter, wBefore + ' -> ' + wAfter + ' (pin=' + pinsTotal + ')');

/* 3 — undo mengembalikan ukuran */
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
const wUndo = await widthOf();
record('undo mengembalikan ukuran pin', wUndo === wBefore, wUndo);

/* 4 — tambah halaman */
const pagesBefore = Number(((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 0);
await page.click('#page-add');
await page.waitForTimeout(300);
const pagesAfter = Number(((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 0);
record('tambah halaman', pagesAfter === pagesBefore + 1, pagesBefore + ' -> ' + pagesAfter);
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
const pagesUndo = Number(((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 0);
record('undo menghapus halaman baru', pagesUndo === pagesBefore, String(pagesUndo));

/* 5 — toggle layer grid */
const gridBefore = await cnt('#layer-grid');
await page.click("[data-od-id='toggle-grid']");
await page.waitForTimeout(250);
const gridAfter = await cnt('#layer-grid');
record('toggle layer grid', gridBefore !== gridAfter, gridBefore + ' -> ' + gridAfter);
await page.click("[data-od-id='toggle-grid']");

/* 6 — reset layout lewat konfirmasi */
await page.click('#btn-reset-layout');
await page.waitForTimeout(300);
const confirmShown = await page.locator('#dlg-confirm.is-open').count();
await page.click('#confirm-ok');
await page.waitForTimeout(400);
const confirmClosed = await page.locator('#dlg-confirm.is-open').count();
const pinsAfterReset = await cnt('#page-editor .sheet .pin');
record('reset layout berjalan setelah konfirmasi', confirmShown > 0 && confirmClosed === 0 && pinsAfterReset === 0, 'dialog=' + confirmShown + '->' + confirmClosed + ' pins=' + pinsAfterReset);
/* kembalikan pin untuk tes berikutnya */
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);

/* 7 — galeri: duplikat + hapus lewat konfirmasi */
await nav('gallery');
const gBefore = await cnt('#page-gallery .gcard');
await page.locator("#page-gallery [data-od-id$='-dup']").first().click();
await page.waitForTimeout(300);
const gDup = await cnt('#page-gallery .gcard');
record('duplikat kartu galeri', gDup === gBefore + 1, gBefore + ' -> ' + gDup);
await page.locator("#page-gallery [data-od-id$='-del']").first().click();
await page.waitForTimeout(300);
await page.click('#confirm-ok');
await page.waitForTimeout(400);
const gDel = await cnt('#page-gallery .gcard');
record('hapus kartu galeri', gDel === gDup - 1, gDup + ' -> ' + gDel);

/* 8 — filter galeri */
await page.fill('#page-gallery input[type="text"]', 'zzz-tidak-ada');
await page.waitForTimeout(250);
record('filter galeri menyembunyikan kartu', (await vis('#page-gallery .gcard')) === 0 && (await vis("#page-gallery [data-od-id='gallery-no-match']")) === 1);
await page.fill('#page-gallery input[type="text"]', '');
await page.waitForTimeout(200);
record('hapus filter memunculkan kartu lagi', (await vis('#page-gallery .gcard')) > 0);

/* 9 — preset: gunakan membuka editor + mengubah geometri */
await nav('templates');
const presetsCount = await cnt('#page-templates .card');
await page.locator("#page-templates [data-od-id$='-use']").first().click();
await page.waitForTimeout(500);
record('gunakan preset membuka editor', presetsCount > 0 && (await isActive('#page-editor')), 'preset=' + presetsCount);

/* 10 — riwayat: duplikat proyek */
await nav('history');
const hBefore = await cnt('#page-history tbody tr');
await page.locator("#page-history tbody tr [data-od-id^='hist-dup']").first().click();
await page.waitForTimeout(400);
const hAfter = await cnt('#page-history tbody tr');
record('duplikat proyek dari riwayat', hAfter === hBefore + 1, hBefore + ' -> ' + hAfter);

/* 11 — pratinjau merender halaman nyata */
await nav('editor');
await page.click("[data-od-id='btn-preview-print']");
await page.waitForTimeout(400);
const previewSheets = await cnt('#page-preview .sheet');
record('pratinjau merender halaman', previewSheets > 0, 'sheet=' + previewSheets);

/* 12 — ekspor PNG menghasilkan unduhan nyata (via dialog, satu pintu biru) */
await nav('editor');
await page.click("[data-od-id='btn-export']");
await page.waitForTimeout(400);
await page.selectOption('#ex-format', 'PNG');
await page.waitForTimeout(200);
const dl = await Promise.race([
  page.waitForEvent('download', { timeout: 20000 }),
  page.click("[data-od-id='btn-start-export']").then(() => new Promise((r) => setTimeout(() => r(null), 20000))),
]);
record('ekspor PNG menghasilkan berkas', Boolean(dl), dl ? await dl.suggestedFilename() : 'tidak ada unduhan');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

/* 13 — tema gelap memengaruhi kanvas */
await nav('editor');
const darkBefore = await page.locator('#canvas-scroll').evaluate((el) => el.classList.contains('is-dark-canvas'));
await nav('settings');
await page.click("[data-od-id='set-dark']");
await page.waitForTimeout(250);
await nav('editor');
const darkAfter = await page.locator('#canvas-scroll').evaluate((el) => el.classList.contains('is-dark-canvas'));
record('tema gelap mengubah kanvas', darkBefore !== darkAfter, darkBefore + '->' + darkAfter);
await nav('settings');
await page.click("[data-od-id='set-dark']");
await page.waitForTimeout(200);

/* 14 — guard keyboard di input */
await nav('editor');
await page.locator('#page-editor .sheet .pin').first().click({ force: true });
await page.waitForTimeout(200);
const pinsBeforeKey = await cnt('#page-editor .sheet .pin');
await page.fill('#asset-search-input', 'kopi');
await page.keyboard.press('Backspace');
await page.keyboard.press('Delete');
await page.waitForTimeout(250);
const pinsAfterKey = await cnt('#page-editor .sheet .pin');
record('Backspace/Delete di input tidak menghapus pin', pinsBeforeKey === pinsAfterKey, pinsBeforeKey + ' -> ' + pinsAfterKey);
await page.fill('#asset-search-input', '');

/* 15 — dialog buka proyek */
await page.click("[data-od-id='btn-open-project']");
await page.waitForTimeout(350);
const openRows = await cnt('#dlg-open-project tbody tr');
record('dialog buka proyek tampil', (await page.locator('#dlg-open-project.is-open').count()) > 0 && openRows > 0, 'baris=' + openRows);
await page.keyboard.press('Escape');
await page.waitForTimeout(250);

/* 16 — persistensi setelah reload */
const nameBefore = await txt('#rail-project-name');
await page.waitForTimeout(1400);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
record('nama proyek bertahan setelah reload', nameBefore === (await txt('#rail-project-name')), nameBefore + ' / ' + (await txt('#rail-project-name')));

await page.screenshot({ path: path.join(OUT, 'functional-editor.png') });
await nav('gallery');
await page.screenshot({ path: path.join(OUT, 'functional-gallery.png') });

record('tidak ada pageerror / console error', problems.length === 0, problems.slice(0, 4).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
fs.writeFileSync('tools/functional-report.txt',
  results.map((r) => (r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' — ' + r.detail : '')).join('\n')
  + '\n\n' + (results.length - failed.length) + '/' + results.length + ' pemeriksaan lulus\n');
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' pemeriksaan lulus');
if (failed.length) { console.log('GAGAL:'); failed.forEach((f) => console.log(' - ' + f.name + ' :: ' + f.detail)); process.exitCode = 1; }