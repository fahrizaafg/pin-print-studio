/* Real exporters: the sheet is rasterised on a canvas and turned into PNG,
   JPEG-backed PDF pages, or a printable document. No external libraries. */
import { PAPER_MM } from '../data/studioData.js';
import { filterOf } from './pinGeometry.js';

/* The sheet is authored at 620 x 877 px for an A3 portrait page. */
export const SHEET_W = 620;
export const SHEET_H = 877;
const PX_PER_MM = SHEET_W / PAPER_MM.a3[0];

const ART_COLORS = {
  'art-ink': '#1d1d1f',
  'art-brown': '#7a4a21',
  'art-gray': '#6e6e73',
  'art-blue': '#0071e3',
  'art-green': '#16a34a',
  'art-yellow': '#eab308',
};

export function sheetSize(paperOrOpts) {
  let paper = paperOrOpts;
  let orientation = 'portrait';
  let customW = 297;
  let customH = 420;
  if (typeof paperOrOpts === 'object' && paperOrOpts !== null) {
    paper = paperOrOpts.paper;
    orientation = paperOrOpts.orientation;
    customW = Number(paperOrOpts.customWidth) || 297;
    customH = Number(paperOrOpts.customHeight) || 420;
  }
  let wMm;
  let hMm;
  if (paper === 'custom' || (!PAPER_MM[paper])) {
    wMm = customW;
    hMm = customH;
  } else {
    const pair = PAPER_MM[paper] || PAPER_MM.a3;
    wMm = pair[0];
    hMm = pair[1];
  }
  if (orientation === 'landscape') {
    const t = wMm;
    wMm = hMm;
    hMm = t;
  }
  return { width: wMm * PX_PER_MM, height: hMm * PX_PER_MM };
}

function dpiScale(dpi) {
  const value = Number(String(dpi).replace(/[^0-9.]/g, '')) || 300;
  return (value / 25.4) / PX_PER_MM;
}

/* Cache decoded images per URL so multi-page exports reuse them. */
const imageCache = new Map();

function loadImage(url) {
  if (!url) return Promise.resolve(null);
  if (imageCache.has(url)) return imageCache.get(url);
  const job = new Promise((resolve) => {
    try {
      const img = new Image();
      /* Blob/data URLs never need CORS; remote URLs do. */
      if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
      /* Already cached by the browser. */
      if (img.complete && img.naturalWidth > 0) resolve(img);
    } catch {
      resolve(null);
    }
  });
  imageCache.set(url, job);
  return job;
}


/* Draw the photo image clipped to a circle.
   Mirrors the editor: cover when pin.crop is on, contain otherwise,
   with the same object-position (cropX/cropY) + scale (cropZoom) math. */
function drawPhoto(ctx, img, cx, cy, diameter, pin) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return false;
  const zoomVal = Number(pin.cropZoom);
  const zoom = Math.max(50, Math.min(400, Number.isFinite(zoomVal) ? zoomVal : 100)) / 100;
  const pxVal = Number(pin.cropX);
  const px = Math.max(0, Math.min(100, Number.isFinite(pxVal) ? pxVal : 50)) / 100;
  const pyVal = Number(pin.cropY);
  const py = Math.max(0, Math.min(100, Number.isFinite(pyVal) ? pyVal : 50)) / 100;
  /* Editor uses object-fit:cover for cropped pins, contain otherwise. */
  const cover = Boolean(pin.crop);
  const base = cover ? Math.max(diameter / iw, diameter / ih) : Math.min(diameter / iw, diameter / ih);
  const dw = iw * base * zoom;
  const dh = ih * base * zoom;
  /* object-position: 0% aligns start edges, 100% aligns end edges. */
  const x0 = cx - diameter / 2 - (dw - diameter) * px;
  const y0 = cy - diameter / 2 - (dh - diameter) * py;
  const rotate = (Number(pin.rotate) || 0) * (Math.PI / 180);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  if (rotate) ctx.rotate(rotate);
  ctx.translate(-cx, -cy);
  try {
    ctx.filter = filterOf(pin);
  } catch { /* older canvas: ignore filter */ }
  ctx.drawImage(img, x0, y0, dw, dh);
  try {
    ctx.filter = 'none';
  } catch { /* noop */ }
  ctx.restore();
  return true;
}

/* Draw one sheet (paper + overlays + pins) into a 2D context. */
async function paintSheet(ctx, opts) {
  const toggles = opts.toggles || {};
  const pins = opts.pins || [];
  const cropmark = opts.cropmark !== false;
  const cutStyle = opts.cutStyle === 'dashed' ? 'dashed' : 'solid';
  const photoRatio = Math.max(0.3, Math.min(1, Number(opts.photoRatio) || 0.82));
  const transparent = Boolean(opts.transparent);
  const size = sheetSize(opts);
  const width = size.width;
  const height = size.height;

  ctx.save();
  if (transparent) {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  if (toggles.bleed) {
    ctx.save();
    ctx.strokeStyle = '#0071e3';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-9, -9, width + 18, height + 18);
    ctx.restore();
  }
  if (toggles.margin) {
    ctx.save();
    ctx.strokeStyle = '#c7c7cc';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(34, 34, width - 68, height - 68);
    ctx.restore();
  }
  if (toggles.safe) {
    ctx.save();
    ctx.strokeStyle = '#16a34a';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(52, 52, width - 104, height - 104);
    ctx.restore();
  }

  /* Preload all photos in parallel so multi-pin sheets stay fast. */
  const images = await Promise.all(pins.map((pin) => (pin.url ? loadImage(pin.url) : Promise.resolve(null))));

  pins.forEach(function (pin, index) {
    const pinSize = pin.size || 150;
    const cx = pin.x + pinSize / 2;
    const cy = pin.y + pinSize / 2;
    const photoD = pinSize * photoRatio;
    /* White cut area (the only ring outside the photo). */
    ctx.beginPath();
    ctx.arc(cx, cy, pinSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    /* Inner photo circle: real image when available, art color fallback. */
    const img = images[index];
    let drewPhoto = false;
    if (img && img.naturalWidth > 0) {
      try {
        drewPhoto = drawPhoto(ctx, img, cx, cy, photoD, pin);
      } catch {
        drewPhoto = false;
      }
    }
    if (!drewPhoto) {
      ctx.beginPath();
      ctx.arc(cx, cy, photoD / 2, 0, Math.PI * 2);
      ctx.fillStyle = ART_COLORS[pin.art] || '#1d1d1f';
      ctx.fill();
    }
    /* Permanent cut edge (always printed, style follows cutStyle). */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, pinSize / 2 - 1, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1b1b1f';
    ctx.setLineDash(cutStyle === 'dashed' ? [7, 5] : []);
    ctx.stroke();
    ctx.restore();
    if (toggles.number) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 15px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      /* Slight shadow so the number stays readable over real photos. */
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 4;
      ctx.fillText(String(index + 1), cx, cy);
      ctx.restore();
    }
    if (toggles.filename) {
      ctx.fillStyle = '#6e6e73';
      ctx.font = '11px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(pin.label || '', cx, pin.y + pinSize + 6);
    }
  });

  if (cropmark) {
    ctx.save();
    ctx.strokeStyle = '#1d1d1f';
    ctx.lineWidth = 1;
    const arm = 10;
    const corners = [[14, 14, 1, 1], [width - 14, 14, -1, 1], [14, height - 14, 1, -1], [width - 14, height - 14, -1, -1]];
    corners.forEach(function (corner) {
      ctx.beginPath();
      ctx.moveTo(corner[0], corner[1]);
      ctx.lineTo(corner[0] + arm * corner[2], corner[1]);
      ctx.moveTo(corner[0], corner[1]);
      ctx.lineTo(corner[0], corner[1] + arm * corner[3]);
      ctx.stroke();
    });
    ctx.restore();
  }

  ctx.restore();
  return { width: width, height: height };
}

export async function renderSheetCanvas(opts) {
  const options = opts || {};
  const scale = dpiScale(options.dpi || '300 DPI');
  const size = sheetSize(options);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(size.width * scale));
  canvas.height = Math.max(1, Math.round(size.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  await paintSheet(ctx, options);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (blob) resolve(blob);
      else reject(new Error('Kanvas tidak dapat dirender.'));
    }, type || 'image/png', quality || 0.92);
  });
}

function blobToBytes(blob) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(new Uint8Array(reader.result)); };
    reader.onerror = function () { reject(reader.error || new Error('Berkas tidak dapat dibaca.')); };
    reader.readAsArrayBuffer(blob);
  });
}

export async function renderSheetPng(opts) {
  return canvasToBlob(await renderSheetCanvas(opts), 'image/png');
}

/* --- minimal PDF writer (one JPEG image per page) ------------------- */
function latin1(text) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

export async function renderPdf(opts) {
  const options = opts || {};
  const pages = options.pages || [];
  const size = sheetSize(options);
  const pageW = (size.width / PX_PER_MM / 25.4) * 72;
  const pageH = (size.height / PX_PER_MM / 25.4) * 72;

  const images = [];
  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await renderSheetCanvas(Object.assign({}, pages[i], {
      paper: options.paper, orientation: options.orientation, customWidth: options.customWidth, customHeight: options.customHeight,
      dpi: options.dpi, cropmark: options.cropmark,
      transparent: false,
    }));
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    images.push({ bytes: await blobToBytes(blob), width: canvas.width, height: canvas.height });
  }

  const chunks = [];
  const offsets = [];
  let length = 0;
  const push = function (part) {
    const bytes = typeof part === 'string' ? latin1(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };

  push('%PDF-1.4\n');
  const total = images.length;
  const pageIds = images.map(function (_, i) { return 4 + i * 3; });
  offsets[1] = length;
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2] = length;
  push('2 0 obj\n<< /Type /Pages /Count ' + total + ' /Kids [' + pageIds.map(function (id) { return id + ' 0 R'; }).join(' ') + '] >>\nendobj\n');

  images.forEach(function (image, index) {
    const pageId = 4 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const content = 'q\n' + pageW.toFixed(2) + ' 0 0 ' + pageH.toFixed(2) + ' 0 0 cm\n/Im0 Do\nQ\n';
    const colorSpace = options.cmyk ? '/DeviceCMYK' : '/DeviceRGB';

    offsets[pageId] = length;
    push(pageId + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW.toFixed(2) + ' ' + pageH.toFixed(2) + '] '
      + '/Resources << /XObject << /Im0 ' + imageId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>\nendobj\n');
    offsets[contentId] = length;
    push(contentId + ' 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n');
    offsets[imageId] = length;
    push(imageId + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + image.width + ' /Height ' + image.height
      + ' /ColorSpace ' + colorSpace + ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' + image.bytes.length + ' >>\nstream\n');
    push(image.bytes);
    push('\nendstream\nendobj\n');
  });

  const xrefStart = length;
  const maxId = 2 + total * 3;
  let xref = 'xref\n0 ' + (maxId + 1) + '\n0000000000 65535 f \n';
  for (let id = 1; id <= maxId; id += 1) {
    xref += String(offsets[id] || 0).padStart(10, '0') + ' 00000 n \n';
  }
  push(xref);
  push('trailer\n<< /Size ' + (maxId + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF\n');

  return new Blob(chunks, { type: 'application/pdf' });
}

export async function printSheets(opts) {
  const options = opts || {};
  const pages = options.pages || [];
  if (!pages.length) return false;
  let frame = null;
  try {
    const images = [];
    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await renderSheetCanvas(Object.assign({}, pages[i], {
        paper: options.paper, orientation: options.orientation, customWidth: options.customWidth, customHeight: options.customHeight,
        dpi: options.dpi, cropmark: options.cropmark,
        transparent: false,
      }));
      images.push(canvas.toDataURL('image/png'));
    }
    frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) {
      frame.remove();
      return false;
    }
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Pin Print Studio</title>'
      + '<style>@page{margin:0}body{margin:0}img{display:block;width:100%;page-break-after:always}'
      + 'img:last-child{page-break-after:auto}</style></head><body>'
      + images.map(function (src) { return '<img src="' + src + '" alt="">'; }).join('')
      + '</body></html>');
    doc.close();
    /* Wait until every sheet image is decoded so preview never opens blank. */
    const imgs = Array.from(doc.images || []);
    await Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        const timer = window.setTimeout(done, 4000);
        img.addEventListener('load', () => { window.clearTimeout(timer); done(); }, { once: true });
        img.addEventListener('error', () => { window.clearTimeout(timer); done(); }, { once: true });
      });
    }));
    await new Promise((r) => window.setTimeout(r, 60));
    const win = frame.contentWindow;
    if (!win) return false;
    const cleanup = () => { try { frame.remove(); } catch { /* noop */ } };
    try {
      win.addEventListener('afterprint', cleanup, { once: true });
    } catch { /* noop */ }
    win.focus();
    win.print();
    window.setTimeout(cleanup, 60000);
    return true;
  } catch {
    try { if (frame) frame.remove(); } catch { /* noop */ }
    return false;
  }
}
