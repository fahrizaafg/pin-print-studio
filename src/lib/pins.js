/* Geometri pin & packing lembar — fungsi murni, tanpa React dan tanpa state.
   Dipakai reducer dan aksi di StudioContext. */
import { PAPER_LABEL, PAPER_MM } from '../data/studioData.js';

/* Pin box 150 px ↔ 57 mm garis potong (default). */
const PIN_MM_TO_PX = 150 / 57;
/* The sheet is 620 px wide for an A3 (297 mm) page. */
const MM_TO_PX = 620 / PAPER_MM.a3[0];

export function cutMmOf(insp) {
  const v = Number(insp?.cutSizeMm ?? insp?.diameter);
  return v > 0 ? v : 57;
}

export function paperSizePx(inspector) {
  const insp = inspector || {};
  let wMm = PAPER_MM[insp.paper]?.[0];
  let hMm = PAPER_MM[insp.paper]?.[1];
  if (insp.paper === 'custom' || !wMm) {
    wMm = Number(insp.customWidth) || 297;
    hMm = Number(insp.customHeight) || 420;
  }
  if (insp.orientation === 'landscape') {
    const t = wMm; wMm = hMm; hMm = t;
  }
  return { w: Math.max(200, Math.round(wMm * MM_TO_PX)), h: Math.max(200, Math.round(hMm * MM_TO_PX)) };
}

export function pinSizeFromCut(cutMm) {
  return Math.max(24, Math.round((Number(cutMm) || 57) * PIN_MM_TO_PX));
}

/* Geometric packing: how many same-size pins really fit on the sheet. */
export function packingGrid(inspector, sheetPx, pinSize) {
  const size = Math.max(24, Math.round(pinSize) || 150);
  const marginPx = Math.max(0, Number(inspector?.margin) || 0) * MM_TO_PX;
  const gapPx = Math.max(0, Number(inspector?.gap) || 0) * MM_TO_PX;
  const cell = size + gapPx;
  const usableW = Math.max(0, sheetPx.w - marginPx * 2);
  const usableH = Math.max(0, sheetPx.h - marginPx * 2);
  const colsFit = cell > 0 ? Math.max(0, Math.floor((usableW + gapPx) / cell)) : 0;
  const rowsFit = cell > 0 ? Math.max(0, Math.floor((usableH + gapPx) / cell)) : 0;
  return { size, marginPx, gapPx, cell, colsFit, rowsFit, total: colsFit * rowsFit };
}

export function circlesCollide(x1, y1, s1, x2, y2, s2) {
  const r1 = s1 / 2;
  const r2 = s2 / 2;
  const dx = (x1 + r1) - (x2 + r2);
  const dy = (y1 + r1) - (y2 + r2);
  return Math.hypot(dx, dy) < (r1 + r2) - 1;
}

/* Free grid cells that fit without overlapping existing pins or margins. */
export function freePackingCells(pins, inspector, sheetPx, pinSize) {
  const grid = packingGrid(inspector, sheetPx, pinSize);
  if (!grid.total) return { grid, cells: [] };
  const cells = [];
  for (let row = 0; row < grid.rowsFit; row += 1) {
    for (let col = 0; col < grid.colsFit; col += 1) {
      const x = Math.round(grid.marginPx + col * grid.cell);
      const y = Math.round(grid.marginPx + row * grid.cell);
      if (x + grid.size > sheetPx.w - grid.marginPx + 1) continue;
      if (y + grid.size > sheetPx.h - grid.marginPx + 1) continue;
      const hit = pins.some((p) => circlesCollide(x, y, grid.size, p.x, p.y, p.size || grid.size));
      if (!hit) cells.push({ x, y });
    }
  }
  return { grid, cells };
}

/* Re-flow the pins of the open page into a rows x cols grid. */
export function gridPins(pins, inspector, mode) {
  const cutMm = cutMmOf(inspector);
  const gap = Number(inspector.gap) || 0;
  const margin = Number(inspector.margin) || 0;
  const cols = Math.max(1, Number(inspector.cols) || 1);
  const rows = Math.max(1, Number(inspector.rows) || 1);
  const size = pinSizeFromCut(cutMm);
  const { w: sheetW, h: sheetH } = paperSizePx(inspector);
  const cell = size + gap * MM_TO_PX;
  const origin = Math.max(8, Math.round(margin * MM_TO_PX));
  const totalW = cols * cell - gap * MM_TO_PX;
  const totalH = rows * cell - gap * MM_TO_PX;
  const startX = mode === 'center' ? Math.max(8, Math.round((sheetW - totalW) / 2)) : origin;
  const startY = mode === 'center' ? Math.max(8, Math.round((sheetH - totalH) / 2)) : origin;
  return pins.map((pin, index) => ({
    ...pin,
    size,
    x: Math.round(startX + (index % cols) * cell),
    y: Math.round(startY + Math.floor(index / cols) * cell),
  }));
}

export function paperLabelOf(paper) {
  return PAPER_LABEL[paper] || 'A3';
}

export function makePin(source, index, art, icon, label, crop) {
  const c = crop || {};
  return {
    id: 'p' + Date.now().toString(36) + '-' + index,
    x: 60 + (index % 3) * 175,
    y: 60 + Math.floor(index / 3) * 175,
    size: 150,
    art,
    icon,
    label,
    locked: c.locked || false,
    crop: c.crop || false,
    cropX: c.cropX ?? 50,
    cropY: c.cropY ?? 50,
    cropZoom: c.cropZoom ?? 100,
    rotate: 0,
    zoom: 100,
    url: source && source.url ? source.url : undefined,
  };
}