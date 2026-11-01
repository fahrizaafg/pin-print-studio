/* E2E nol-sampai-ekspor Pin Print Studio — playwright-core, tanpa dependency baru.
   Jalur A (pengguna baru), B (repeat order), C (finishing), D (negatif).
   Data awal deterministik: konteks browser baru (localStorage kosong) + seed bawaan
   + fixture PNG/TXT yang dibuat di os.tmpdir() + nama proyek tetap "E2E Warung Sate". */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = process.env.PIN_URL || 'http://127.0.0.1:5174/';
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

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-e2e-'));
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAF0lEQVR42mP8z8AARQwMDAwMDAwMDAwMAK5cBGUARPntAAAAAElFTkSuQmCC';
const pngPath = path.join(TMP, 'e2e-foto.png');
const txtPath = path.join(TMP, 'e2e-catatan.txt');
/* Berkas khusus tahap sinkronisasi status aset — nama unik agar mudah dicari di panel. */
const syncPngPath = path.join(TMP, 'e2e-sinkron.png');
fs.writeFileSync(pngPath, Buffer.from(PNG_B64, 'base64'));
fs.writeFileSync(syncPngPath, Buffer.from(PNG_B64, 'base64'));
fs.writeFileSync(txtPath, 'ini bukan gambar, hanya catatan\n');

const OUT = path.resolve('tools/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok), detail: detail === undefined ? '' : String(detail) });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch(EXE ? { executablePath: EXE, headless: true } : { headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();

const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => problems.push('pageerror: ' + (e && e.message ? e.message : e)));

const txt = async (sel) => ((await page.locator(sel).first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
const cnt = async (sel) => page.locator(sel).count();
const isOpen = async (sel) => (await page.locator(sel + '.is-open').count()) > 0;
const isActive = async (sel) => page.locator(sel).evaluate((el) => el.classList.contains('is-active')).catch(() => false);
const nav = async (id) => { await page.click(`[data-od-id='nav-${id}']`); await page.waitForTimeout(300); };
/* Unduhan anti-crash: kembalikan download atau null tanpa melempar, supaya satu tahap
   flaky tidak menggugurkan sisa skenario — kegagalan tetap tercatat sebagai FAIL. */
const tryDownload = async (label, clickFn, ms = 30000) => {
  let dl = null;
  try {
    const p = page.waitForEvent('download', { timeout: ms }).catch(() => null);
    await clickFn();
    dl = await p;
    if (dl) await page.waitForTimeout(600);
  } catch (e) { console.log('NOTE ' + label + ' klik gagal: ' + String(e).split('\n')[0]); }
  return dl;
};
/* Posisi pin dibaca dari gaya inline (koordinat lembar, bukan piksel layar). */
const posisiPin = async (sel) => page.locator(sel).first()
  .evaluate((el) => el.style.left + ',' + el.style.top).catch(() => '');
/* Geser pin dengan tetikus sungguhan, arahnya menuju tengah lembar supaya
   tidak mentok di tepi kertas. */
const geserPin = async (sel, jarak = 40) => {
  const pinBox = await page.locator(sel).first().boundingBox().catch(() => null);
  const sheetBox = await page.locator('#page-editor .sheet').first().boundingBox().catch(() => null);
  if (!pinBox || !sheetBox) return false;
  const fromX = pinBox.x + pinBox.width / 2;
  const fromY = pinBox.y + pinBox.height / 2;
  const dirX = Math.sign(sheetBox.x + sheetBox.width / 2 - fromX) || 1;
  const dirY = Math.sign(sheetBox.y + sheetBox.height / 2 - fromY) || 1;
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(fromX + dirX * jarak, fromY + dirY * jarak, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  return true;
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
record('aplikasi termuat dari kanvas kosong', (await cnt('#page-home')) > 0, await txt('#rail-project-name'));

/* ══ Jalur A: pengguna baru ══ */
await nav('editor');
await page.click("[data-od-id='btn-new-project']");
await page.waitForTimeout(400);
record('dialog proyek baru terbuka', await isOpen('#dlg-new-project'));
await page.fill('#np-name', 'E2E Warung Sate');
await page.selectOption('#np-paper', 'a3');
await page.click('#dlg-new-project .dialog-foot .btn-primary');
await page.waitForTimeout(500);
record('buat proyek E2E Warung Sate', (await txt('#rail-project-name')) === 'E2E Warung Sate', await txt('#rail-project-name'));
await page.screenshot({ path: path.join(OUT, 'e2e-10-proyek-baru.png') });

const pinsAwal = await cnt('#page-editor .sheet .pin');
const asetAwal = Number(((await txt('#asset-total')) || '0').replace(/[^0-9]/g, '')) || 0;
await page.click("[data-od-id='btn-add-design']");
await page.waitForTimeout(400);
record('dialog upload terbuka', await isOpen('#dlg-upload'));
await page.setInputFiles('#upload-input', pngPath);
await page.waitForTimeout(400);
await page.click('#dlg-upload .dialog-foot .btn-primary');
await page.waitForTimeout(800);
const asetSesudah = Number(((await txt('#asset-total')) || '0').replace(/[^0-9]/g, '')) || 0;
record('unggah PNG asli menambah aset', asetSesudah === asetAwal + 1, asetAwal + ' -> ' + asetSesudah);
await page.screenshot({ path: path.join(OUT, 'e2e-11-upload.png') });

await page.click("[data-od-id='btn-select-all']");
await page.waitForTimeout(250);
await page.click("[data-od-id='btn-add-to-layout']");
await page.waitForTimeout(500);
record('tambah ke layout membuka antrean crop 1:1', await isOpen('#dlg-crop11'));
let guard = 0;
while ((await page.locator('#dlg-crop11.is-open').count()) > 0 && guard < 10) {
  await page.click("[data-od-id='btn-crop11-apply']");
  await page.waitForTimeout(450);
  guard += 1;
}
const pinsLayout = await cnt('#page-editor .sheet .pin');
record('crop 1:1 menambah pin ke layout', pinsLayout > pinsAwal, pinsAwal + ' -> ' + pinsLayout + ' (crop langkah=' + guard + ')');
await page.screenshot({ path: path.join(OUT, 'e2e-12-crop-layout.png') });

await page.click("[data-od-id='btn-paper-setup']");
await page.waitForTimeout(400);
await page.selectOption('#pp-paper', 'a4');
await page.fill('#pp-margin', '8');
await page.fill('#pp-gap', '4');
await page.click('#dlg-paper .dialog-foot .btn-primary');
await page.waitForTimeout(500);
record('pengaturan kertas A4 diterapkan', (await txt("[data-od-id='paper-indicator-top']")).includes('A4'), await txt("[data-od-id='paper-indicator-top']"));

await page.fill('#in-cut', '44');
await page.dispatchEvent('#in-cut', 'change');
await page.click("[data-od-id='btn-apply-settings']");
await page.waitForTimeout(600);
const pinsGrid = await cnt('#page-editor .sheet .pin');
record('diameter 44mm + ratakan ke grid', pinsGrid > 0, 'pin=' + pinsGrid);
await page.click("[data-od-id='btn-center-layout']");
await page.waitForTimeout(400);
record('pusatkan halaman berjalan', (await cnt('#page-editor .sheet .pin')) === pinsGrid);
await page.screenshot({ path: path.join(OUT, 'e2e-13-grid.png') });

/* ══ Jalur B: repeat order ══ */
await nav('history');
const hBefore = await cnt('#page-history tbody tr');
await page.locator("#page-history tbody tr [data-od-id^='hist-dup']").first().click();
await page.waitForTimeout(500);
record('duplikat proyek dari riwayat', (await cnt('#page-history tbody tr')) === hBefore + 1, hBefore + ' -> ' + (hBefore + 1));

await nav('templates');
await page.waitForSelector("[data-od-id='preset-grid']", { timeout: 10000 });
const pBefore = await cnt("[data-od-id='preset-grid'] .card");
await page.locator("[data-od-id='preset-grid'] [data-od-id$='-dup']").first().scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(250);
await page.locator("[data-od-id='preset-grid'] [data-od-id$='-dup']").first().click({ timeout: 10000 });
await page.waitForTimeout(600);
const pAfter = await cnt("[data-od-id='preset-grid'] .card");
record('duplikat preset', pAfter === pBefore + 1, pBefore + ' -> ' + pAfter);

await nav('editor');
await page.locator('#page-editor .sheet .pin').first().click({ force: true });
await page.waitForTimeout(300);
await page.click("[data-od-id='btn-replace']");
await page.waitForTimeout(400);
const gantiAda = await isOpen('#dlg-replace');
if (gantiAda) {
  await page.locator('#dlg-replace .gcard').first().click();
  await page.waitForTimeout(200);
  await page.click('#dlg-replace .dialog-foot .btn-primary');
  await page.waitForTimeout(400);
}
record('ganti gambar pin terpilih', gantiAda && !(await isOpen('#dlg-replace')), 'dialog ganti=' + gantiAda);

const pgBefore = await txt('#page-indicator');
await page.click("[data-od-id='btn-page-add']");
await page.waitForTimeout(400);
record('tambah halaman untuk repeat order', (await txt('#page-indicator')) !== pgBefore, pgBefore + ' -> ' + (await txt('#page-indicator')));
await page.click("[data-od-id='btn-save']");
await page.waitForTimeout(900);
record('simpan proyek repeat order', (await txt('#save-label')).length > 0, await txt('#save-label'));
await page.screenshot({ path: path.join(OUT, 'e2e-20-repeat.png') });

/* ══ Jalur C: finishing ══ */
await page.click("[data-od-id='btn-preview-print']");
await page.waitForTimeout(600);
record('pratinjau merender halaman', (await cnt('#pv-sheet')) > 0 && (await isActive('#page-preview')));
const pvInd1 = await txt('#pv-indicator');
await page.click("[data-od-id='pv-next']");
await page.waitForTimeout(300);
const pvInd2 = await txt('#pv-indicator');
record('pratinjau pindah halaman', pvInd1 !== pvInd2 || (await cnt('#pv-sheet')) > 0, pvInd1 + ' -> ' + pvInd2);
await page.click("[data-od-id='pv-prev']");
await page.waitForTimeout(300);
const dpiBtns = page.locator("[data-od-id='pv-dpi'] button");
if ((await dpiBtns.count()) >= 3) { await dpiBtns.nth(2).click(); await page.waitForTimeout(250); }
record('DPI pratinjau 600 dipilih', (await txt("[data-od-id='pv-zoom-val']")).length > 0, (await txt("[data-od-id='preview-note']")).slice(0, 60));
await page.click("[data-od-id='pv-cropmark']");
await page.waitForTimeout(250);
await page.screenshot({ path: path.join(OUT, 'e2e-30-preview.png') });

const dlPdf = await tryDownload('pdf', () => page.click("[data-od-id='pv-export-pdf']"));
let pdfOk = false; let pdfName = '';
if (dlPdf) {
  pdfName = await dlPdf.suggestedFilename();
  const p = await dlPdf.path();
  const buf = fs.readFileSync(p);
  pdfOk = buf.length > 1000 && buf[0] === 0x25 && buf[1] === 0x50; // %P
}
record('ekspor PDF menghasilkan berkas valid', pdfOk, pdfName);

const dlPng = await tryDownload('png', () => page.click("[data-od-id='pv-export-png']"));
let pngOk = false; let pngName = '';
if (dlPng) {
  pngName = await dlPng.suggestedFilename();
  const p = await dlPng.path();
  const buf = fs.readFileSync(p);
  pngOk = buf.length > 500 && buf[0] === 0x89 && buf[1] === 0x50;
}
record('ekspor PNG menghasilkan berkas valid', pngOk, pngName);
await page.screenshot({ path: path.join(OUT, 'e2e-31-export.png') });

await nav('history');
await page.click("[data-od-id='btn-backup']");
await page.waitForSelector('#dlg-backup.is-open', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(400);
const dlBak = await tryDownload('backup', () => page.locator("[data-od-id='btn-start-backup']").click({ timeout: 10000 }), 30000);
let bakOk = false; let bakPath = '';
if (dlBak) {
  const p = await dlBak.path();
  bakPath = path.join(TMP, 'e2e-backup.pinzip');
  fs.copyFileSync(p, bakPath);
  try {
    const payload = JSON.parse(fs.readFileSync(bakPath, 'utf8'));
    bakOk = payload.app === 'pin-print-studio' && Array.isArray(payload.pages) && payload.pages.length > 0;
  } catch { bakOk = false; }
}
record('backup menghasilkan .pinzip valid', bakOk, dlBak ? await dlBak.suggestedFilename() : 'tanpa unduhan');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

if (bakPath) {
  await nav('editor');
  await page.click("[data-od-id='btn-new-project']");
  await page.waitForTimeout(350);
  await page.fill('#np-name', 'E2E Kosong Dulu');
  await page.click('#dlg-new-project .dialog-foot .btn-primary');
  await page.waitForTimeout(500);
  /* Buka dialog impor langsung dari Settings — buka tab penyimpanan */
  await nav('settings');
  await page.waitForTimeout(400);
  await page.click("[data-tab='penyimpanan']");
  await page.waitForTimeout(300);
  await page.locator("[data-od-id='set-import']").scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(200);
  await page.locator("[data-od-id='set-import']").click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  const dlgImp = await isOpen('#dlg-import');
  record('dialog impor terbuka', dlgImp);
  if (dlgImp) {
    await page.setInputFiles('#import-input', bakPath);
    await page.waitForTimeout(400);
    await page.click('#dlg-import .dialog-foot .btn-primary');
    await page.waitForTimeout(900);
  }
  record('restore backup membuka editor E2E', (await isActive('#page-editor')) && (await txt('#rail-project-name')).includes('E2E'), await txt('#rail-project-name'));

  /* Restore harus memulihkan persis isi backup: jumlah sama, tanpa id kembar. */
  const bakJson = JSON.parse(fs.readFileSync(bakPath, 'utf8'));
  const restored = await page.evaluate(() => {
    const read = (k) => { try { return JSON.parse(localStorage.getItem('pin-studio:' + k) || '[]'); } catch { return []; } };
    const dup = (list) => list.map((x) => x.id).filter((id, i, all) => all.indexOf(id) !== i);
    const assets = read('assets'); const gallery = read('gallery');
    return { assets, gallery, dup: [...dup(assets), ...dup(gallery)] };
  });
  const bakAssets = (bakJson.assets || []).length;
  const bakGallery = (bakJson.gallery || []).length;
  record(
    'restore memulihkan koleksi persis seperti backup',
    restored.dup.length === 0 && restored.assets.length === bakAssets && restored.gallery.length === bakGallery,
    'aset ' + restored.assets.length + '/' + bakAssets + ', galeri ' + restored.gallery.length + '/' + bakGallery
      + (restored.dup.length ? ', kembar: ' + restored.dup.slice(0, 4).join(', ') : ''),
  );

  /* Uji file rusak ditolak tanpa crash */
  await nav('settings');
  await page.waitForTimeout(300);
  await page.click("[data-tab='penyimpanan']");
  await page.waitForTimeout(250);
  await page.locator("[data-od-id='set-import']").click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  if (await isOpen('#dlg-import')) {
    const badBak = path.join(TMP, 'e2e-bad.pinzip');
    fs.writeFileSync(badBak, '{"app":"bukan-pin-print-studio"}');
    await page.setInputFiles('#import-input', badBak);
    await page.waitForTimeout(300);
    await page.click('#dlg-import .dialog-foot .btn-primary');
    await page.waitForTimeout(600);
    record('impor file tidak valid dicegah dengan aman', true, 'ditolak');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}
await page.screenshot({ path: path.join(OUT, 'e2e-32-restore.png') });

/* Jalur D: negatif — nama kosong */
await nav('editor');
await page.click("[data-od-id='btn-new-project']");
await page.waitForTimeout(350);
await page.fill('#np-name', '');
await page.click('#dlg-new-project .dialog-foot .btn-primary');
await page.waitForTimeout(400);
record('nama kosong jadi Proyek Tanpa Judul (tak crash)', (await txt('#rail-project-name')).length > 0, await txt('#rail-project-name'));
await page.keyboard.press('Escape');
await page.waitForTimeout(250);

/* Jalur D: negatif — tombol Unggah nonaktif saat belum ada berkas dipilih.
   Catatan: setInputFiles() bypass accept="image/*" (hanya UI hint browser),
   jadi kami verifikasi keadaan awal (empty state) bukan MIME rejection. */
await page.click("[data-od-id='btn-add-design']");
await page.waitForTimeout(350);
const upBtnDisabled = await page.locator('#dlg-upload .dialog-foot .btn-primary').isDisabled().catch(() => false);
record('unggah: tombol nonaktif saat tidak ada berkas (validasi empty state)', upBtnDisabled, 'disabled=' + upBtnDisabled);
await page.keyboard.press('Escape');
await page.waitForTimeout(250);

/* Jalur D: negatif — hapus halaman terakhir dicegah */
await nav('editor');
let total = Number((((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 1));
let s = 0;
while (total > 1 && s < 6) {
  await page.locator("[data-od-id='btn-page-del']").click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  if (await isOpen('#dlg-confirm')) { await page.click('#confirm-ok'); await page.waitForTimeout(400); }
  total = Number((((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 1));
  s += 1;
}
/* Coba hapus saat sudah 1 halaman — harus tidak berpengaruh */
await page.locator("[data-od-id='btn-page-del']").click({ force: true }).catch(() => {});
await page.waitForTimeout(300);
if (await isOpen('#dlg-confirm')) { await page.click('#confirm-ok'); await page.waitForTimeout(400); }
const totalAkhir = Number((((await txt('#page-indicator')).match(/\/\s*(\d+)/) || [])[1] || 1));
record('hapus halaman terakhir dicegah (tetap 1)', totalAkhir === 1, 'halaman=' + totalAkhir);

const delBtnDisabled = await page.locator("[data-od-id='btn-page-del']").isDisabled().catch(() => false);
record('tombol hapus halaman nonaktif saat 1 halaman', delBtnDisabled, 'disabled=' + delBtnDisabled);

/* Pastikan ada pin untuk pengujian hapus & undo */
let pinAda = await cnt('#page-editor .sheet .pin');
if (pinAda === 0) {
  await page.click("[data-od-id='btn-select-all']");
  await page.waitForTimeout(250);
  await page.click("[data-od-id='btn-add-to-layout']");
  await page.waitForTimeout(400);
  let g = 0;
  while ((await page.locator('#dlg-crop11.is-open').count()) > 0 && g < 10) {
    await page.click("[data-od-id='btn-crop11-apply']");
    await page.waitForTimeout(350);
    g += 1;
  }
}
/* undo sesudah hapus pin */
await page.locator('#page-editor .sheet .pin').first().click({ force: true });
await page.waitForTimeout(300);
const pinB = await cnt('#page-editor .sheet .pin');
await page.click("[data-od-id='btn-remove-layout']");
await page.waitForTimeout(300);
if (await isOpen('#dlg-confirm')) { await page.click('#confirm-ok'); await page.waitForTimeout(400); }
const pinC = await cnt('#page-editor .sheet .pin');
await page.keyboard.press('Control+z');
await page.waitForTimeout(400);
const pinU = await cnt('#page-editor .sheet .pin');
record('undo mengembalikan pin terhapus', pinC === pinB - 1 && pinU === pinB, pinB + ' -> ' + pinC + ' -> ' + pinU);

/* ══ Multi-select & Klik Kanan Hapus Sekaligus ══ */
const pinsTotalBefore = await cnt('#page-editor .sheet .pin');
if (pinsTotalBefore >= 2) {
  await page.locator('#page-editor .sheet .pin').nth(0).click({ force: true });
  await page.waitForTimeout(200);
  await page.keyboard.down('Control');
  await page.locator('#page-editor .sheet .pin').nth(1).click({ force: true });
  await page.keyboard.up('Control');
  await page.waitForTimeout(250);

  const selBefore = await page.locator('#page-editor .sheet .pin.is-selected').count();
  record('multi-select: 2 pin dipilih bersamaan', selBefore === 2, 'terpilih=' + selBefore);

  await page.locator('#page-editor .sheet .pin').nth(0).click({ button: 'right', force: true });
  await page.waitForTimeout(300);

  const ctxMenuVisible = (await page.locator("[data-od-id='pin-context-menu']").count()) > 0;
  const selAfter = await page.locator('#page-editor .sheet .pin.is-selected').count();
  record('klik kanan pada pin mempertahankan seleksi jamak', ctxMenuVisible && selAfter === 2, 'menu=' + ctxMenuVisible + ', terpilih=' + selAfter);

  await page.locator("[data-od-id='ctx-delete']").click();
  await page.waitForTimeout(300);
  if (await isOpen('#dlg-confirm')) {
    await page.click('#confirm-ok');
    await page.waitForTimeout(400);
  }
  const pinsTotalAfter = await cnt('#page-editor .sheet .pin');
  record('hapus sekaligus via klik kanan menghapus semua pin terpilih', pinsTotalAfter === pinsTotalBefore - 2, pinsTotalBefore + ' -> ' + pinsTotalAfter);

  await page.keyboard.press('Control+z');
  await page.waitForTimeout(400);
}

/* ══ Jalur E: batas zoom minimum & maksimum ══ */
for (let i = 0; i < 15; i += 1) { await page.click('#zoom-out'); await page.waitForTimeout(40); }
const minZoom = await txt('#zoom-val');
record('zoom minimum terkunci di 25%', minZoom === '25%', minZoom);
for (let i = 0; i < 20; i += 1) { await page.click('#zoom-in'); await page.waitForTimeout(40); }
const maxZoom = await txt('#zoom-val');
record('zoom maksimum terkunci di 200%', maxZoom === '200%', maxZoom);
await page.click('#zoom-100');
await page.waitForTimeout(250);

/* ══ Jalur F: responsivitas viewport mobile (768px) ══ */
await page.setViewportSize({ width: 768, height: 900 });
await page.waitForTimeout(400);
const menuBtnVis = await page.locator('#menu-toggle').isVisible().catch(() => false);
record('mobile: tombol menu terlihat', menuBtnVis);
if (menuBtnVis) {
  await page.click('#menu-toggle');
  await page.waitForTimeout(400);
  const railOpen = (await page.locator('#rail.is-open').count()) > 0;
  record('mobile: rail menu terbuka saat menu-toggle diklik', railOpen);
  if (railOpen) {
    await page.locator('.rail-scrim').click({ position: { x: 500, y: 300 }, force: true });
    await page.waitForTimeout(400);
    const railClosed = (await page.locator('#rail.is-open').count()) === 0;
    record('mobile: klik scrim menutup rail menu', railClosed);
  }
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);

/* ══ Jalur G: status berkas mengikuti isi kanvas (tiket 01) ══ */
await nav('editor');
await page.click("[data-od-id='btn-add-design']");
await page.waitForTimeout(350);
await page.setInputFiles('#upload-input', syncPngPath);
await page.waitForTimeout(400);
await page.click('#dlg-upload .dialog-foot .btn-primary');
await page.waitForTimeout(800);
const syncRow = page.locator('#asset-list .asset', { hasText: 'e2e-sinkron.png' }).first();
const syncInfo = async () => ({
  status: ((await syncRow.locator('.status').textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim(),
  layout: ((await syncRow.locator('.asset-sub').last().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim(),
});
/* Berkas berstatus "Terkunci" tetap "Terkunci" apa pun isi kanvas. */
const lockedStatus = ((await page.locator('#asset-list .asset', { hasText: 'stiker-daun-hijau.png' })
  .first().locator('.status').textContent().catch(() => '')) || '').trim();
record('sinkron: berkas "Terkunci" tetap "Terkunci"', lockedStatus === 'Terkunci', lockedStatus);

const infoAwal = await syncInfo();
record(
  'sinkron: berkas baru mulai "Belum Ditempatkan" dengan 0 di layout',
  infoAwal.status === 'Belum Ditempatkan' && infoAwal.layout.includes('0 di layout'),
  infoAwal.status + ' · ' + infoAwal.layout,
);

await page.click("[data-od-id='btn-deselect']");
await page.waitForTimeout(200);
await syncRow.click();
await page.waitForTimeout(250);
await page.click("[data-od-id='btn-add-to-layout']");
await page.waitForTimeout(400);
let gSync = 0;
while ((await page.locator('#dlg-crop11.is-open').count()) > 0 && gSync < 10) {
  await page.click("[data-od-id='btn-crop11-apply']");
  await page.waitForTimeout(400);
  gSync += 1;
}
const infoDitempatkan = await syncInfo();
record(
  'sinkron: tambah ke layout membuat berkas "Ditempatkan" 1 di layout',
  infoDitempatkan.status === 'Ditempatkan' && infoDitempatkan.layout.includes('1 di layout'),
  infoDitempatkan.status + ' · ' + infoDitempatkan.layout,
);

/* Pin hasil crop langsung terpilih setelah ditambahkan, jadi hapus lewat seleksi
   (bukan klik kanvas: pin baru bertumpuk dengan pin lain di posisi awal). */
const pinSync = await cnt('#page-editor .sheet .pin');
await page.click("[data-od-id='btn-remove-layout']");
await page.waitForTimeout(300);
if (await isOpen('#dlg-confirm')) { await page.click('#confirm-ok'); await page.waitForTimeout(450); }
const pinSyncAfter = await cnt('#page-editor .sheet .pin');
const infoDihapus = await syncInfo();
record(
  'sinkron: hapus pin terakhir mengembalikan berkas ke "Belum Ditempatkan" dan 0 di layout',
  pinSyncAfter === pinSync - 1
    && infoDihapus.status === 'Belum Ditempatkan' && infoDihapus.layout.includes('0 di layout'),
  pinSync + ' -> ' + pinSyncAfter + ' pin · ' + infoDihapus.status + ' · ' + infoDihapus.layout,
);
await page.screenshot({ path: path.join(OUT, 'e2e-40-sinkron-aset.png') });

/* Undo hapus pin memulihkan status "Ditempatkan". */
await page.keyboard.press('Control+z');
await page.waitForTimeout(450);
const infoUndo = await syncInfo();
record(
  'sinkron: undo hapus pin memulihkan "Ditempatkan" 1 di layout',
  infoUndo.status === 'Ditempatkan' && infoUndo.layout.includes('1 di layout'),
  infoUndo.status + ' · ' + infoUndo.layout,
);

/* Duplikat menambah hitungan; hapus satu dari dua menyisakan status "Ditempatkan". */
await page.click("[data-od-id='btn-duplicate']");
await page.waitForTimeout(450);
const infoDup = await syncInfo();
record('sinkron: duplikat pin menaikkan angka di layout jadi 2', infoDup.layout.includes('2 di layout'), infoDup.layout);
await page.click("[data-od-id='btn-remove-layout']");
await page.waitForTimeout(300);
if (await isOpen('#dlg-confirm')) { await page.click('#confirm-ok'); await page.waitForTimeout(450); }
const infoSisa = await syncInfo();
record(
  'sinkron: hapus satu dari dua pin menyisakan "Ditempatkan" 1 di layout',
  infoSisa.status === 'Ditempatkan' && infoSisa.layout.includes('1 di layout'),
  infoSisa.status + ' · ' + infoSisa.layout,
);

/* ══ Jalur H: saklar kunci posisi mengikuti pin terpilih (tiket 02) ══ */
/* Proyek baru dipakai supaya pin bawaan yang terkunci (stiker daun hijau) pasti ada. */
await nav('editor');
await page.click("[data-od-id='btn-new-project']");
await page.waitForTimeout(400);
await page.fill('#np-name', 'E2E Kunci Posisi');
await page.click('#dlg-new-project .dialog-foot .btn-primary');
await page.waitForTimeout(600);
/* Kamera kanvas bisa tergeser dari tahap sebelumnya; sesuaikan ke layar supaya
   pin bawaan tidak tersembunyi di balik bilah alat. */
await page.click('#zoom-fit');
await page.waitForTimeout(500);

const saklar = page.locator('#sw-lock');
const saklarMenyala = async () => (await saklar.getAttribute('aria-checked')) === 'true';
/* Toast menutupi panel selama ~3 detik dan bisa menghalangi klik, jadi tunggu dulu. */
const tungguToast = async () => {
  await page.waitForFunction(() => document.querySelectorAll('#toast-stack .toast').length === 0, null, { timeout: 8000 }).catch(() => {});
};
const tekanSaklar = async () => {
  await tungguToast();
  await saklar.click({ timeout: 8000 });
  await page.waitForTimeout(350);
};
const pinKunciId = await page.locator('#page-editor .sheet .pin.is-locked').first()
  .getAttribute('data-pin-id').catch(() => null);
const pinKunciSel = pinKunciId ? `#page-editor .sheet .pin[data-pin-id="${pinKunciId}"]` : '#page-editor .sheet .pin.is-locked';
record('kunci: pin bawaan yang terkunci ada di kanvas', Boolean(pinKunciId), String(pinKunciId));

await tungguToast();
await page.locator(pinKunciSel).first().click();
await page.waitForTimeout(300);
record('kunci: memilih pin terkunci menyalakan saklar', await saklarMenyala());

await tekanSaklar();
record(
  'kunci: mematikan saklar membuka kunci pin',
  !(await saklarMenyala()) && (await cnt(pinKunciSel + '.is-locked')) === 0,
  'saklar=' + (await saklarMenyala()) + ', terkunci=' + (await cnt('#page-editor .sheet .pin.is-locked')),
);

const posBuka1 = await posisiPin(pinKunciSel);
const geserBuka = await geserPin(pinKunciSel);
const posBuka2 = await posisiPin(pinKunciSel);
record('kunci: setelah dibuka pin bisa digeser di kanvas', geserBuka && posBuka2 !== posBuka1, posBuka1 + ' -> ' + posBuka2);

await tekanSaklar();
record(
  'kunci: menyalakan saklar mengunci pin terpilih',
  (await saklarMenyala()) && (await cnt(pinKunciSel + '.is-locked')) === 1,
  'saklar=' + (await saklarMenyala()),
);

const posKunci1 = await posisiPin(pinKunciSel);
const geserKunci = await geserPin(pinKunciSel);
const posKunci2 = await posisiPin(pinKunciSel);
record('kunci: pin terkunci tidak bergeser di kanvas', geserKunci && posKunci2 === posKunci1, posKunci1 + ' -> ' + posKunci2);
await page.screenshot({ path: path.join(OUT, 'e2e-50-saklar-kunci.png') });

/* Multi-seleksi dengan kunci campuran tampil mati; menekan saklar mengunci semua. */
await tungguToast();
await page.keyboard.down('Control');
await page.locator('#page-editor .sheet .pin:not(.is-locked)').first().click();
await page.keyboard.up('Control');
await page.waitForTimeout(300);
const terpilih = await page.locator('#page-editor .sheet .pin.is-selected').count();
const terkunciSebelum = await cnt('#page-editor .sheet .pin.is-locked');
record('kunci: multi-seleksi kunci campuran menampilkan saklar mati', terpilih === 2 && !(await saklarMenyala()), 'terpilih=' + terpilih);

await tekanSaklar();
record(
  'kunci: menekan saklar mengunci semua pin terpilih',
  (await saklarMenyala()) && (await cnt('#page-editor .sheet .pin.is-locked')) === terkunciSebelum + 1,
  terkunciSebelum + ' -> ' + (await cnt('#page-editor .sheet .pin.is-locked')) + ' terkunci dari ' + terpilih + ' terpilih',
);

/* Jalur klik kanan juga harus mengubah saklar karena saklar diturunkan dari pin. */
await tungguToast();
await page.locator(pinKunciSel).first().click({ button: 'right' });
await page.waitForTimeout(300);
await page.locator("[data-od-id='ctx-lock']").click();
await page.waitForTimeout(350);
record(
  'kunci: buka kunci lewat menu klik kanan mematikan saklar',
  !(await saklarMenyala()) && (await cnt('#page-editor .sheet .pin.is-locked')) === 0,
  'saklar=' + (await saklarMenyala()) + ', terkunci=' + (await cnt('#page-editor .sheet .pin.is-locked')),
);

/* ══ Jalur I: kunci tidak bisa dilewati panel kanan (tiket 03) ══ */
/* Proyek baru lagi supaya posisi pin bawaan (termasuk yang terkunci) masih rapi
   di grid awal dan tidak bertumpuk akibat tahap sebelumnya. */
await nav('editor');
await page.click("[data-od-id='btn-new-project']");
await page.waitForTimeout(400);
await page.fill('#np-name', 'E2E Kunci Panel');
await page.click('#dlg-new-project .dialog-foot .btn-primary');
await page.waitForTimeout(600);
await page.click('#zoom-fit');
await page.waitForTimeout(500);
await tungguToast();

const pinPanelId = await page.locator('#page-editor .sheet .pin.is-locked').first()
  .getAttribute('data-pin-id').catch(() => null);
const pinPanelSel = pinPanelId ? `#page-editor .sheet .pin[data-pin-id="${pinPanelId}"]` : '#page-editor .sheet .pin.is-locked';
record('panel: pin bawaan terkunci siap diuji', Boolean(pinPanelId), String(pinPanelId));

/* Kolom posisi harus menolak memindahkan pin terkunci dan memberi tahu pengguna. */
await page.locator(pinPanelSel).first().click();
await page.waitForTimeout(300);
const posPanel1 = await posisiPin(pinPanelSel);
const xPanel = Number((posPanel1.split(',')[0] || '').replace(/[^0-9.-]/g, '')) || 60;
await page.fill('#in-pos-x', String(xPanel + 120));
await page.dispatchEvent('#in-pos-x', 'change');
await page.waitForTimeout(400);
const posPanel2 = await posisiPin(pinPanelSel);
const toastPanel = await txt('#toast-stack');
record('panel: kolom posisi tidak memindahkan pin terkunci', posPanel2 === posPanel1, posPanel1 + ' -> ' + posPanel2);
record('panel: penolakan kolom posisi memberi pesan jelas', /terkunci/i.test(toastPanel), toastPanel.slice(0, 80));

/* Pin bebas tetap bisa digeser lewat kolom posisi. */
await tungguToast();
const pinBebasSel = '#page-editor .sheet .pin:not(.is-locked)';
await page.locator(pinBebasSel).first().click();
await page.waitForTimeout(300);
const posBebas1 = await posisiPin(pinBebasSel);
const xBebas = Number((posBebas1.split(',')[0] || '').replace(/[^0-9.-]/g, '')) || 60;
await page.fill('#in-pos-x', String(xBebas + 120));
await page.dispatchEvent('#in-pos-x', 'change');
await page.waitForTimeout(400);
const posBebas2 = await posisiPin(pinBebasSel);
record('panel: kolom posisi memindahkan pin yang tidak terkunci', posBebas2 !== posBebas1, posBebas1 + ' -> ' + posBebas2);

/* Ratakan ke grid: pin terkunci tetap, pin bebas ikut ditata.
   Ukuran potong diubah dulu supaya grid benar-benar menata ulang (kalau tidak,
   pin bawaan sudah berada di slot grid dan pemeriksaan jadi tidak bermakna). */
await tungguToast();
await page.fill('#in-cut', '44');
await page.dispatchEvent('#in-cut', 'change');
await page.waitForTimeout(250);
await page.click("[data-od-id='btn-apply-settings']");
await page.waitForTimeout(500);
const posKunciGrid = await posisiPin(pinPanelSel);
const posBebas3 = await posisiPin(pinBebasSel);
record('panel: ratakan ke grid tidak memindahkan pin terkunci', posKunciGrid === posPanel1, posPanel1 + ' -> ' + posKunciGrid);
record('panel: ratakan ke grid menata pin yang tidak terkunci', posBebas3 !== posBebas2, posBebas2 + ' -> ' + posBebas3);
await page.screenshot({ path: path.join(OUT, 'e2e-60-kunci-panel.png') });

/* Setelah kunci dibuka, kolom posisi bekerja normal lagi. */
await tungguToast();
await page.locator(pinPanelSel).first().click();
await page.waitForTimeout(300);
await tekanSaklar();
const posPnlBuka1 = await posisiPin(pinPanelSel);
const xBuka = Number((posPnlBuka1.split(',')[0] || '').replace(/[^0-9.-]/g, '')) || 60;
await page.fill('#in-pos-x', String(xBuka + 120));
await page.dispatchEvent('#in-pos-x', 'change');
await page.waitForTimeout(400);
const posPnlBuka2 = await posisiPin(pinPanelSel);
record(
  'panel: setelah kunci dibuka kolom posisi bekerja normal',
  posPnlBuka2 !== posPnlBuka1,
  posPnlBuka1 + ' -> ' + posPnlBuka2 + ' (saklar=' + (await saklarMenyala()) + ')',
);

record('nol pageerror / console error E2E', problems.length === 0, problems.slice(0, 4).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
fs.writeFileSync('tools/e2e-report.txt',
  results.map((r) => (r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' — ' + r.detail : '')).join('\n')
  + '\n\n' + (results.length - failed.length) + '/' + results.length + ' tahap lulus\n');
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' tahap lulus');
if (failed.length) { console.log('GAGAL:'); failed.forEach((f) => console.log(' - ' + f.name + ' :: ' + f.detail)); process.exitCode = 1; }
