/* Small formatting + download helpers shared by the UI and the exporters. */

export function formatNumber(value, settings) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  const text = String(rounded);
  if (settings && settings.dec === 'Titik (1.5 mm)') return text;
  return text.replace('.', ',');
}

export function formatLength(mm, settings) {
  if (settings && settings.unit === false) {
    return `${formatNumber((Number(mm) || 0) / 25.4, settings)} in`;
  }
  return `${formatNumber(mm, settings)} mm`;
}

export function formatClock(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatVersionTime(date = new Date()) {
  return `Hari ini, ${formatClock(date)}`;
}

export function formatStamp(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

export function sanitizeFileName(name) {
  return String(name || 'berkas')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'berkas';
}

export function resolveFileName(pattern, { project, pages, ext, page } = {}) {
  const base = String(pattern || '{proyek}-{tanggal}-hal{pages}')
    .replace(/\{proyek\}/g, project || 'proyek')
    .replace(/\{tanggal\}/g, formatStamp())
    .replace(/\{halaman\}/g, String(page ?? 1))
    .replace(/\{pages\}/g, String(pages ?? 1));
  return `${sanitizeFileName(base)}.${ext || 'bin'}`;
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text, fileName, type = 'application/json') {
  downloadBlob(new Blob([text], { type }), fileName);
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Berkas tidak dapat dibaca.'));
    reader.readAsText(file);
  });
}

export function imageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}
