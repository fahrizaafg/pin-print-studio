/* Static seed content of the prototype (assets, pins, presets, history rows).
   Kept in one place so the JSX stays readable. Runtime state lives in StudioContext. */

export const PIN_SIZE = 150;

export const INITIAL_PINS = [
  { id: 'p1', x: 60, y: 60, size: PIN_SIZE, art: 'art-ink', icon: 'house', label: 'maskot-astronaut', locked: false },
  { id: 'p2', x: 235, y: 60, size: PIN_SIZE, art: 'art-brown', icon: 'coffee', label: 'logo-kopi-kenangan', locked: false },
  { id: 'p3', x: 410, y: 60, size: PIN_SIZE, art: 'art-green', icon: 'leaf', label: 'stiker-daun-hijau', locked: true },
  { id: 'p4', x: 60, y: 235, size: PIN_SIZE, art: 'art-blue', icon: 'cross', label: 'pola-geometris', locked: false },
  { id: 'p5', x: 235, y: 235, size: PIN_SIZE, art: 'art-ink', icon: 'house', label: 'maskot-astronaut', locked: false },
  { id: 'p6', x: 410, y: 235, size: PIN_SIZE, art: 'art-brown', icon: 'coffee', label: 'logo-kopi-kenangan', locked: false },
];

const clonePins = (prefix, list) => list.map((pin, index) => ({
  ...pin, id: `${prefix}-p${index + 1}`, locked: false,
}));

/* Three real sheet pages: 6, 6 and 4 designs (matches the prototype copy). */
export const PAGE_SEED = [
  { id: 'page-1', pins: INITIAL_PINS },
  { id: 'page-2', pins: clonePins('p2', INITIAL_PINS) },
  { id: 'page-3', pins: clonePins('p3', INITIAL_PINS.slice(0, 4)) },
];

export const ART_PALETTE = ['art-ink', 'art-brown', 'art-green', 'art-blue', 'art-gray', 'art-yellow'];
export const ICON_PALETTE = ['house', 'coffee', 'leaf', 'cross', 'sun', 'star'];

export const PAPER_MM = { a4: [210, 297], a3: [297, 420], a3p: [329, 483] };
export const PAPER_LABEL = { a4: 'A4', a3: 'A3', a3p: 'A3+' };

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
    builtin: true,
    geometry: { paper: 'a3', orientation: 'portrait', diameter: 58, rows: 4, cols: 3, gap: 4, margin: 8, bleed: 3 },
  },
  {
    id: 'preset-2',
    badge: { kind: 'tag', text: 'Hemat Kertas' },
    meta: 'A4 · 44mm',
    title: 'Hemat A4 38mm',
    body: 'Mode hemat kertas untuk pin kecil. Muat hingga 40 potong per lembar.',
    confirm: 'Hapus preset Hemat A4 38mm?',
    builtin: true,
    geometry: { paper: 'a4', orientation: 'portrait', diameter: 44, rows: 5, cols: 4, gap: 3, margin: 6, bleed: 2 },
  },
  {
    id: 'preset-3',
    badge: { kind: 'tag', text: 'Presentasi' },
    meta: 'A3+ · 75mm',
    title: 'Pin Besar A3+',
    body: 'Diameter 75 mm dengan bleed 3 mm. Cocok untuk pin edisi terbatas.',
    confirm: 'Hapus preset Pin Besar A3+?',
    builtin: true,
    geometry: { paper: 'a3p', orientation: 'portrait', diameter: 75, rows: 3, cols: 3, gap: 6, margin: 10, bleed: 3 },
  },
];

export const BUILTIN_TEMPLATES = [
  { id: 'tpl-std', name: 'Standar Industri 58 mm', last: false },
  { id: 'tpl-small', name: 'Bulat Kecil 32 mm', last: false },
  { id: 'tpl-magnet', name: 'Magnet Kulkas 65 mm', last: true },
];

/* Project history (also feeds the "Proyek terbaru" table on the home page). */
export const HISTORY_ROWS = [
  { id: '1', name: 'Layout Pin A3 — Kopi Kenangan', paper: 'A3', designs: '6', changed: '2 menit lalu', size: '1,4 MB' },
  { id: '2', name: 'Pin Wisuda 2026 — SMAN 3', paper: 'A4', designs: '12', changed: 'Kemarin, 16:40', size: '2,1 MB' },
  { id: '3', name: 'Merch Kucing Oren — Toko Paws', paper: 'A3+', designs: '9', changed: '3 hari lalu', size: '3,6 MB' },
  { id: '4', name: 'Pin Komunitas Sepeda — GowesID', paper: 'A4', designs: '8', changed: '5 hari lalu', size: '1,0 MB' },
  { id: '5', name: 'Pin Restoran — Sate Pak Kumis', paper: 'A3', designs: '15', changed: '1 minggu lalu', size: '4,2 MB' },
];

export const RESTORE_VERSIONS = [
  { id: 'v1', time: 'Hari ini, 14:02', meta: '6 desain · 3 halaman' },
  { id: 'v2', time: 'Hari ini, 13:40', meta: '6 desain · 3 halaman' },
  { id: 'v3', time: 'Hari ini, 11:15', meta: '4 desain · 2 halaman' },
];

export const DEFAULT_TOGGLES = {
  cut: true, bleed: true, grid: true, margin: false, safe: false, number: false, marks: false,
};

export const DEFAULT_INSPECTOR = {
  photoSizeMm: 47,
  cutSizeMm: 57,
  unit: 'mm',
  posX: 60,
  posY: 60,
  lock: false,
  snap: false,
  bleed: 3,
  rotate: 0,
  paper: 'a3',
  orientation: 'portrait',
  margin: 8,
  gap: 4,
  rows: 4,
  cols: 3,
  cutStyle: 'solid',
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

export const BACKUP_NOTES = [
  'Mengumpulkan proyek…',
  'Menulis arsip .pinzip…',
  'Memeriksa cadangan…',
  'Menyelesaikan…',
];

export const DEFAULT_PROJECT_NAME = 'Layout Pin A3 — Kopi Kenangan';

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
