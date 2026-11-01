/* Geometri & filter pin yang dipakai bersama oleh sheet editor, preview, dan ekspor.
   Satu sumber supaya tampilan dan hasil ekspor tidak pernah beda. */

/* Filter CSS/canvas dari pengaturan foto; contrast 10 = netral. */
export function filterOf(pin) {
  const b = Number(pin.brightness) || 0;
  const c = Number(pin.contrast ?? 10);
  const s = Number(pin.saturation) || 0;
  const parts = [];
  if (b) parts.push(`brightness(${100 + b}%)`);
  if (c !== 10) parts.push(`contrast(${100 + (c - 10)}%)`);
  if (s) parts.push(`saturate(${100 + s}%)`);
  return parts.length ? parts.join(' ') : 'none';
}

export const clampZoom = (v) => Math.max(25, Math.min(200, Math.round(v)));

/* Lebar area foto dalam persen garis potong. */
export function artPctOf(inspector) {
  const cutMm = Number(inspector?.cutSizeMm ?? inspector?.diameter) || 57;
  const photoMm = Number(inspector?.photoSizeMm) || 47;
  return Math.max(30, Math.min(100, (photoMm / Math.max(1, cutMm)) * 100));
}