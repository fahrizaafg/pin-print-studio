# Pin Print Studio — React + Vite

Port React 19 + Vite dari prototipe statis `pin-print-studio.html`
(OpenDesign project `192b6adb-4825-41b7-971e-9452b1e2271d`).

Desain visual, tata letak, interaksi, dan aset **dipertahankan apa adanya**:
lapisan CSS disalin byte-per-byte dari sumber, dan seluruh halaman serta dialog
sudah diverifikasi identik piksel dengan prototipe.

## Menjalankan

```bash
npm install
npm run dev
```

Buka **http://127.0.0.1:5173/** (Vite memakai port 5173 secara default).

## Pratinjau hasil produksi

```bash
npm run build
npm run preview -- --port 4180 --host 127.0.0.1
```

Buka **http://127.0.0.1:4180/**.

> Port 4180 dipakai karena 4173 sudah ditempati proyek lain di mesin ini.
> Di mesin lain cukup `npm run preview` (port 4173).

## Verifikasi

Verifikasi paritas memerlukan server pratinjau yang sedang berjalan di
`http://127.0.0.1:4180/`:

```bash
npm run build
npm run preview -- --port 4180 --host 127.0.0.1   # terminal 1

node tools/parity.mjs      # terminal 2 — bounding box semua data-od-id
node tools/pixdiff.mjs     # diff piksel seluruh halaman
node tools/interactions.mjs  # uji interaksi + tulis tools/interaction-report.txt
npm run lint
```

Harness men-drive Brave (headless) lewat `playwright-core`. Jika Brave tidak ada
di `C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe`, ubah
`executablePath` di file terkait atau ganti ke Chromium.

### Hasil verifikasi terakhir

| Pemeriksaan | Hasil |
| --- | --- |
| `tools/parity.mjs` | 1995 node `data-od-id`, 0 hilang, 0 bergeser (7 halaman × 1440×900) |
| `tools/pixdiff.mjs` | 0 piksel berbeda di **semua** halaman (1.296.000 px/halaman) |
| Dialog (13 overlay) | 0 piksel berbeda |
| `tools/interactions.mjs` | 20/20 lolos, tanpa error konsol |
| `npm run lint` | bersih |

## Struktur

```
index.html                  entri Vite (lang="id", favicon)
public/favicon.svg
src/
  main.jsx                  import 10 lapisan CSS sesuai urutan asli, lalu bootstrap
  App.jsx                   ToastProvider > StudioProvider > ErrorBoundary > Shell
  styles/                   01-tokens … 08c-extra (byte-identik dengan prototipe)
  data/studioData.js        data awal: pin, aset, galeri, preset, toggle, settings
  state/
    StudioContext.jsx       useReducer store pusat + undo/redo + localStorage
    ToastContext.jsx        toast stack
  components/
    Rail.jsx                sidebar navigasi + status simpan
    Toolbar.jsx             toolbar atas tiap halaman
    editor/                 Toolbar, CanvasArea, Sheet, PanelKiri, InspectorPanel
    pages/                  Home, Editor, Galeri, Template, Riwayat, Pengaturan, Bantuan
    dialogs/                Dialog.jsx + 18 dialog
    ui/                     primitives.jsx, icons.jsx
  hooks/useKeyboardShortcuts.js
tools/                      harness paritas (parity, pixdiff, interaksi)
design-source/              salinan mentah prototipe + build/ (acuan, jangan diubah)
```

## Catatan implementasi

- **Navigasi** memakai state `page`, bukan router. Semua halaman dan dialog
  selalu ter-mount dan di-toggle dengan `is-active` / `is-open`, persis seperti
  prototipe (agar animasi dan `data-od-id` tetap sama).
- **Zoom lembar** = `scale(zoom / 78)`, clamp 25–200, langkah 10, `Fit to Screen`
  mengembalikan ke 78.
- **Undo/redo** berbasis snapshot stack di reducer.
- **Persistensi** memakai `localStorage` dengan prefiks `pin-studio:*`
  (halaman, zoom, toggle, waktu simpan, dsb.).
- **Aset** seluruhnya SVG inline / kelas `pin-art`; tidak ada berkas gambar.
- Perilaku prototipe yang sengaja dipertahankan: `window.prompt` untuk ganti nama
  proyek, data demo statis, cut marks yang selalu dirender, dan `[hidden]` pada
  `.progress-wrap` yang kalah oleh `display: grid`.
- **Spasi antar elemen** di JSX harus eksplisit (`{' '}` atau satu text node).
  React membuang whitespace antar-elemen, dan perbedaan satu spasi sudah cukup
  mengubah kerning/posisi teks. Beberapa label memakai template string agar
  tetap satu text node.
