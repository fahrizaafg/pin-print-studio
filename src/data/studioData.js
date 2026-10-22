/* Static demo content of the prototype (assets, pins, presets, history rows).
   Kept in one place so the JSX stays readable. */

export const PIN_SIZE = 150;

export const INITIAL_PINS = [
  { id: 'p1', x: 60, y: 60, size: PIN_SIZE, art: 'art-ink', icon: 'house', label: 'maskot-astronaut', locked: false },
  { id: 'p2', x: 235, y: 60, size: PIN_SIZE, art: 'art-brown', icon: 'coffee', label: 'logo-kopi-kenangan', locked: false },
  { id: 'p3', x: 410, y: 60, size: PIN_SIZE, art: 'art-green', icon: 'leaf', label: 'stiker-daun-hijau', locked: true },
  { id: 'p4', x: 60, y: 235, size: PIN_SIZE, art: 'art-blue', icon: 'cross', label: 'pola-geometris', locked: false },
  { id: 'p5', x: 235, y: 235, size: PIN_SIZE, art: 'art-ink', icon: 'house', label: 'maskot-astronaut', locked: false },
  { id: 'p6', x: 410, y: 235, size: PIN_SIZE, art: 'art-brown', icon: 'coffee', label: 'logo-kopi-kenangan', locked: false },
];

export const ASSET_STATUS_LABEL = {
  placed: 'Ditempatkan',
  unplaced: 'Belum Ditempatkan',
  locked: 'Terkunci',
};

export const INITIAL_ASSETS = [
  { id: 'a1', name: 'logo-kopi-kenangan.png', meta: 'PNG · 1200×1200', status: 'placed', order: 40, inLayout: 12, art: 'art-brown', icon: 'coffee', selected: false },
  { id: 'a2', name: 'maskot-astronaut.svg', meta: 'SVG · vektor', status: 'placed', order: 25, inLayout: 8, art: 'art-ink', icon: 'house', selected: true },
  { id: 'a3', name: 'teks-ulat-tahun.jpg', meta: 'JPG · 2400×1600', status: 'unplaced', order: 18, inLayout: 0, art: 'art-gray', icon: 'sun', selected: false },
  { id: 'a4', name: 'pola-geometris.png', meta: 'PNG · 800×800', status: 'placed', order: 32, inLayout: 6, art: 'art-blue', icon: 'cross', selected: false },
  { id: 'a5', name: 'stiker-daun-hijau.png', meta: 'PNG · 1000×1000', status: 'locked', order: 12, inLayout: 4, art: 'art-green', icon: 'leaf', selected: false },
  { id: 'a6', name: 'bintang-emas.png', meta: 'PNG · 600×600', status: 'unplaced', order: 20, inLayout: 0, art: 'art-yellow', icon: 'star', selected: false },
];

export const GALLERY_CARDS = [
  { id: 'g1', name: 'maskot-astronaut.svg', format: 'SVG', size: '1200×1200', art: 'art-ink', icon: 'house', checked: true, selected: false, status: null },
  { id: 'g2', name: 'logo-kopi-kenangan.png', format: 'PNG', size: '1200×1200', art: 'art-brown', icon: 'coffee', checked: true, selected: true, status: null },
  { id: 'g3', name: 'teks-ulat-tahun.jpg', format: 'JPG', size: '2400×1600', art: 'art-gray', icon: 'sun', checked: false, selected: false, status: 'unplaced' },
  { id: 'g4', name: 'pola-geometris.png', format: 'PNG', size: '800×800', art: 'art-blue', icon: 'cross', checked: false, selected: false, status: null },
];

export const PRESETS = [
  {
    id: 'preset-1',
    badge: { kind: 'pill', text: 'Aktif' },
    meta: 'A3 · 58mm',
    title: 'Grid Rapat A3',
    body: '4 baris × 3 kolom, jarak 4 mm, margin 8 mm. Untuk pesanan di atas 30 pcs.',
    confirm: 'Hapus preset Grid Rapat A3?',
  },
  {
    id: 'preset-2',
    badge: { kind: 'tag', text: 'Hemat Kertas' },
    meta: 'A4 · 44mm',
    title: 'Hemat A4 38mm',
    body: 'Mode hemat kertas untuk pin kecil. Muat hingga 40 potong per lembar.',
    confirm: 'Hapus preset Hemat A4 38mm?',
  },
  {
    id: 'preset-3',
    badge: { kind: 'tag', text: 'Presentasi' },
    meta: 'A3+ · 75mm',
    title: 'Pin Besar A3+',
    body: 'Diameter 75 mm dengan bleed 3 mm. Cocok untuk pin edisi terbatas.',
    confirm: 'Hapus preset Pin Besar A3+?',
  },
];

export const BUILTIN_TEMPLATES = [
  { id: 'tpl-std', name: 'Standar Industri 58 mm', last: false },
  { id: 'tpl-small', name: 'Bulat Kecil 32 mm', last: false },
  { id: 'tpl-magnet', name: 'Magnet Kulkas 65 mm', last: true },
];

export const RECENT_PROJECTS = [
  { id: 'home-open-1', name: 'Layout Pin A3 — Kopi Kenangan', paper: 'A3', designs: '6', changed: '2 menit lalu' },
  { id: 'home-open-2', name: 'Pin Wisuda 2026 — SMAN 3', paper: 'A4', designs: '12', changed: 'Kemarin' },
  { id: 'home-open-3', name: 'Merch Kucing Oren — Toko Paws', paper: 'A3+', designs: '9', changed: '3 hari lalu' },
];

export const HISTORY_ROWS = [
  { id: '1', name: 'Layout Pin A3 — Kopi Kenangan', paper: 'A3', designs: '6', changed: '2 menit lalu', size: '1,4 MB' },
  { id: '2', name: 'Pin Wisuda 2026 — SMAN 3', paper: 'A4', designs: '12', changed: 'Kemarin, 16:40', size: '2,1 MB' },
  { id: '3', name: 'Merch Kucing Oren — Toko Paws', paper: 'A3+', designs: '9', changed: '3 hari lalu', size: '3,6 MB' },
  { id: '4', name: 'Pin Komunitas Sepeda — GowesID', paper: 'A4', designs: '8', changed: '5 hari lalu', size: '1,0 MB' },
  { id: '5', name: 'Pin Restoran — Sate Pak Kumis', paper: 'A3', designs: '15', changed: '1 minggu lalu', size: '4,2 MB' },
];

export const OPEN_PROJECTS = [
  { id: 'op1', name: 'Layout Pin A3 — Kopi Kenangan', meta: 'A3 · 6 desain · 2 menit lalu' },
  { id: 'op2', name: 'Pin Wisuda 2026 — SMAN 3', meta: 'A4 · 12 desain · Kemarin' },
  { id: 'op3', name: 'Merch Kucing Oren — Toko Paws', meta: 'A3+ · 9 desain · 3 hari lalu' },
  { id: 'op4', name: 'Pin Komunitas Sepeda — GowesID', meta: 'A4 · 8 desain · 5 hari lalu' },
];

export const RESTORE_VERSIONS = [
  { id: 'v1', time: 'Hari ini, 14:02', meta: '6 desain · 3 halaman' },
  { id: 'v2', time: 'Hari ini, 13:40', meta: '6 desain · 3 halaman' },
  { id: 'v3', time: 'Hari ini, 11:15', meta: '4 desain · 2 halaman' },
];

export const DEFAULT_TOGGLES = {
  cut: true, bleed: true, grid: true, margin: false, safe: false, filename: true, number: true, marks: false,
};

export const DEFAULT_INSPECTOR = {
  diameter: 58,
  posX: 60,
  posY: 60,
  lock: false,
  bleed: 3,
  bleedColor: '#0071e3',
  imgZoom: 100,
  rotate: 0,
  qty: 40,
  paper: 'a3',
  orientation: 'portrait',
  margin: 8,
  gap: 4,
  rows: 4,
  cols: 3,
  customWidth: 329,
  customHeight: 483,
};

export const DEFAULT_SETTINGS = {
  dark: true,
  grid: true,
  unit: true,
  tooltip: true,
  lang: 'Bahasa Indonesia',
  dec: 'Koma (1,5 mm)',
  dia: 58,
  bleed: 3,
  gap2: 4,
  paper2: 'A3',
  safe: 4,
  margin2: 8,
  eco: false,
  dpi: '300 DPI',
  fmt: 'PDF (siap cetak)',
  cropmark: true,
  cmyk: false,
  name: '{proyek}-{tanggal}-hal{pages}',
  autosave: true,
  cache: true,
};

export const EXPORT_NOTES = [
  'Menyiapkan halaman…',
  'Merender desain 300 DPI…',
  'Menyematkan tanda potong…',
  'Menulis berkas…',
];

export const PAGE_TITLES = {
  home: 'Beranda',
  editor: 'Editor',
  gallery: 'Galeri Desain',
  templates: 'Template & Preset',
  history: 'Riwayat Proyek',
  settings: 'Pengaturan',
  help: 'Bantuan',
  preview: 'Pratinjau Cetak',
};