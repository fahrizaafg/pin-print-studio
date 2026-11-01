import { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import { useSheetDrag } from '../../hooks/useSheetDrag.js';
import { Icon } from '../ui/icons.jsx';
import { artPctOf, filterOf } from '../../lib/pinGeometry.js';

const CUT_MARKS = [
  { left: 14, top: 14 },
  { right: 14, top: 14 },
  { left: 14, bottom: 14 },
  { right: 14, bottom: 14 },
  { left: '50%', top: 14, marginLeft: -6 },
  { left: '50%', bottom: 14, marginLeft: -6 },
  { top: '50%', left: 14, marginTop: -6 },
  { top: '50%', right: 14, marginTop: -6 },
];

export default function Sheet({ sheetRef }) {
  const studio = useStudio();
  const { pins, toggles, zoom, selectedPinId, selectedPinIds, selectPin, togglePinSelection, setSelection, movePin, sheetSize, inspector } = studio;
  const localRef = useRef(null);
  const ref = sheetRef ?? localRef;
  const [menu, setMenu] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const marqueeRef = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('wheel', close, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('wheel', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const openMenu = (e, pin) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIds = selectedPinIds || [];
    const isAlreadySelected = currentIds.includes(pin.id) || selectedPinId === pin.id;
    if (!isAlreadySelected) {
      selectPin(pin.id);
    }
    const sheet = ref.current;
    const rect = sheet ? sheet.getBoundingClientRect() : { left: 0, top: 0, width: 1 };
    const scale = rect.width / (sheet?.offsetWidth || rect.width || 1) || 1;
    const lx = (e.clientX - rect.left) / scale;
    const ly = (e.clientY - rect.top) / scale;
    const w = sheet?.offsetWidth || 620;
    const h = sheet?.offsetHeight || 877;
    setMenu({ x: Math.max(4, Math.min(w - 200, lx)), y: Math.max(4, Math.min(h - 160, ly)), pinId: pin.id, locked: pin.locked });
  };

  /* Prototype anchored the scroll back to the sheet wrapper after zooming. */
  const handleDragStart = ({ pin, event }) => {
    if (event && (event.ctrlKey || event.metaKey)) {
      togglePinSelection(pin.id);
      return false;
    }
    /* Dragging a pin inside an existing multi-selection keeps the group. */
    if ((selectedPinIds || []).includes(pin.id)) return !pin.locked;
    selectPin(pin.id);
    if (pin.locked) {
      return false;
    }
    return true;
  };

  const handleMove = (id, x, y) => {
    movePin(id, x, y);
  };

  const handleDragEnd = () => studio.markDirty();

  const onPointerDown = useSheetDrag(ref, handleMove, handleDragStart, handleDragEnd);

  const sheetPoint = (e) => {
    const sheet = ref.current;
    const rect = sheet ? sheet.getBoundingClientRect() : { left: 0, top: 0, width: 1 };
    const scale = rect.width / (sheet?.offsetWidth || rect.width || 1) || 1;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const isSelected = (id) => (selectedPinIds || []).includes(id) || id === selectedPinId;

  /* Box select on empty sheet background (pan stays on the canvas scroll area). */
  const onSheetPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest?.('.pin')) return;
    if (e.target.closest?.('.pin-context-menu')) return;
    const p = sheetPoint(e);
    marqueeRef.current = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, additive: Boolean(e.ctrlKey || e.metaKey) };
    setMarquee({ ...marqueeRef.current });
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onSheetPointerMove = (e) => {
    const m = marqueeRef.current;
    if (!m) return;
    const p = sheetPoint(e);
    marqueeRef.current = { ...m, x1: p.x, y1: p.y };
    setMarquee({ ...marqueeRef.current });
  };
  const endMarquee = (e) => {
    const m = marqueeRef.current;
    marqueeRef.current = null;
    setMarquee(null);
    if (!m) return;
    const p = e && e.clientX !== undefined ? sheetPoint(e) : { x: m.x1, y: m.y1 };
    const rx0 = Math.min(m.x0, p.x);
    const ry0 = Math.min(m.y0, p.y);
    const rx1 = Math.max(m.x0, p.x);
    const ry1 = Math.max(m.y0, p.y);
    if (Math.abs(rx1 - rx0) < 4 && Math.abs(ry1 - ry0) < 4) {
      if (!m.additive) selectPin(null);
      return;
    }
    const hit = pins
      .filter((pin) => !pin.locked
        && pin.x < rx1 && pin.x + (pin.size || 150) > rx0
        && pin.y < ry1 && pin.y + (pin.size || 150) > ry0)
      .map((pin) => pin.id);
    if (m.additive) {
      const prev = new Set([...(selectedPinIds || []), ...hit]);
      setSelection([...prev]);
    } else {
      setSelection(hit);
    }
  };

  const onPinPointerDown = (e, pin) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      e.preventDefault();
      togglePinSelection(pin.id);
      return;
    }
    onPointerDown(e, pin);
  };

  const sheetClass = [
    'sheet',
    toggles.marks ? 'show-marks' : '',
  ].filter(Boolean).join(' ');

  const sheetW = sheetSize?.w || 620;
  const sheetH = sheetSize?.h || 877;
  const marginPx = Math.max(0, Math.round((Number(inspector?.margin) || 0) * (620 / 297)));
  const bleedPx = Math.max(0, Math.round((Number(inspector?.bleed) || 0) * (620 / 297)));
  const artPct = artPctOf(inspector);
  const cutCls = inspector?.cutStyle === 'dashed' ? 'cut-dashed' : 'cut-solid';

  return (
    <div
      className={sheetClass}
      id="sheet"
      data-od-id="sheet-preview"
      ref={ref}
      style={{ transform: `scale(${zoom / 78})`, transformOrigin: 'center center', width: sheetW, height: sheetH }}
      onPointerDown={onSheetPointerDown}
      onPointerMove={onSheetPointerMove}
      onPointerUp={endMarquee}
      onPointerCancel={() => { marqueeRef.current = null; setMarquee(null); }}
    >
      {/* Overlay order mirrors the prototype: margin, bleed, safe, grid, cut marks. */}
      <div className="sheet-layer">
        {toggles.margin ? <div className="margin-box" id="layer-margin" style={{ left: marginPx, top: marginPx, right: marginPx, bottom: marginPx }} /> : null}
        {toggles.bleed ? <div className="bleed-box" id="layer-bleed" style={{ left: -bleedPx, top: -bleedPx, right: -bleedPx, bottom: -bleedPx }} /> : null}
        {toggles.safe ? <div className="safe-box" id="layer-safe" style={{ left: marginPx + 18, top: marginPx + 18, right: marginPx + 18, bottom: marginPx + 18 }} /> : null}
        {toggles.grid ? <div className="grid-lines" id="layer-grid" /> : null}

        {CUT_MARKS.map((style, i) => (
          <div className="cut-mark" key={i} style={style} />
        ))}
      </div>

      {pins.length === 0 ? (
        <div className="sheet-empty" data-od-id="sheet-empty">
          <p>Kanvas kosong — klik <strong>Tambah Desain</strong> lalu <strong>Tambah ke Layout</strong>.</p>
        </div>
      ) : null}
      {pins.map((pin) => (
        <div
          key={pin.id}
          className={`pin ${cutCls}${isSelected(pin.id) ? ' is-selected' : ''}${pin.locked ? ' is-locked' : ''}`}
          data-pin-id={pin.id}
          title={pin.locked ? 'Terkunci — klik gembok untuk membuka' : pin.label}
          style={{ left: pin.x, top: pin.y, width: pin.size, height: pin.size, cursor: pin.locked ? 'not-allowed' : 'grab' }}
          onPointerDown={(e) => onPinPointerDown(e, pin)}
          onContextMenu={(e) => openMenu(e, pin)}
        >
          {pin.locked ? (
            <span className="pin-lock"><Icon name="lock" stroke={1.8} /></span>
          ) : null}
          <span
            className={`pin-art ${pin.art}${pin.crop ? ' is-cropped' : ''}`}
            style={{
              width: `${artPct}%`,
              height: `${artPct}%`,
              transform: `rotate(${pin.rotate || 0}deg)`,
              transition: 'transform 120ms',
            }}
          >
            {pin.url ? <img src={pin.url} alt={pin.label} draggable={false} style={{ filter: filterOf(pin), objectPosition: `${pin.cropX ?? 50}% ${pin.cropY ?? 50}%`, transform: `scale(${(pin.cropZoom ?? 100) / 100})` }} /> : <span style={{ filter: filterOf(pin), display: 'contents' }}><Icon name={pin.icon} /></span>}
          </span>
        </div>
      ))}

      <svg className="sheet-cutlines" viewBox="0 0 620 877" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="cutgrid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" fill="none" stroke="currentColor" strokeWidth="0.4" />
          </pattern>
        </defs>
      </svg>
      {marquee ? (() => {
        const rx = Math.min(marquee.x0, marquee.x1);
        const ry = Math.min(marquee.y0, marquee.y1);
        const rw = Math.abs(marquee.x1 - marquee.x0);
        const rh = Math.abs(marquee.y1 - marquee.y0);
        if (rw < 4 && rh < 4) return null;
        return (
          <div
            data-od-id="marquee-box"
            style={{
              position: 'absolute', left: rx, top: ry, width: rw, height: rh,
              border: '1.5px dashed var(--accent)', background: 'var(--accent-tint)',
              borderRadius: 4, pointerEvents: 'none', zIndex: 150,
            }}
          />
        );
      })() : null}
      {menu ? (() => {
        const currentIds = selectedPinIds && selectedPinIds.length
          ? selectedPinIds
          : (selectedPinId ? [selectedPinId] : (menu.pinId ? [menu.pinId] : []));
        const multi = currentIds.length > 1;
        return (
          <div
            className="pin-context-menu"
            data-od-id="pin-context-menu"
            style={{ left: menu.x, top: menu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button type="button" data-od-id="ctx-duplicate" onClick={() => { setMenu(null); studio.duplicateSelectedPin(); }}>
              {multi ? `Duplikat ${currentIds.length} desain` : 'Duplikat desain'}
            </button>
            <button type="button" data-od-id="ctx-duplicate-bulk" onClick={() => { setMenu(null); studio.openDialog('dlg-duplicate-bulk'); }}>Duplikat banyak…</button>
            <button type="button" data-od-id="ctx-center" onClick={() => { setMenu(null); studio.centerSelectedImage(); }}>Pusatkan gambar</button>
            <button type="button" data-od-id="ctx-lock" onClick={() => { setMenu(null); studio.setLock(!menu.locked); }}>{menu.locked ? 'Buka kunci' : 'Kunci posisi'}</button>
            <button
              type="button"
              className="is-danger"
              data-od-id="ctx-delete"
              onClick={() => {
                setMenu(null);
                studio.requestConfirm({
                  message: multi ? `Hapus ${currentIds.length} desain terpilih dari layout?` : 'Hapus desain ini dari layout?',
                  note: 'Desain hanya dihapus dari layout, tetap tersimpan di panel gambar.',
                  toast: multi ? `${currentIds.length} desain dihapus dari layout.` : 'Desain dihapus dari layout.',
                  onConfirm: () => studio.removeSelectedPin(),
                });
              }}
            >
              {multi ? `Hapus ${currentIds.length} desain` : 'Hapus desain'}
            </button>
          </div>
        );
      })() : null}
    </div>
  );
}