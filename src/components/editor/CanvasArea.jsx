import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import Sheet from './Sheet.jsx';
import { clampZoom } from '../../lib/pinGeometry.js';

const CHIPS = [
  { key: 'bleed', id: 'toggle-bleed', label: 'Bleed' },
  { key: 'grid', id: 'toggle-grid', label: 'Grid' },
  { key: 'margin', id: 'toggle-margin', label: 'Margin' },
  { key: 'safe', id: 'toggle-safe', label: 'Safe Area' },
  { key: 'marks', id: 'toggle-marks', label: 'Tanda Potong' },
];

export default function CanvasArea() {
  const studio = useStudio();
  const { toggles, toggleLayer, zoom, setZoom, zoomBy, sheetPage, sheetTotal, addSheetPage, removeSheetPage, gotoSheetPage, sheetSize, inspector, settings } = studio;
  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const pan = useRef(null);

  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    const w = sheetSize?.w || 620;
    const h = sheetSize?.h || 877;
    if (!el || el.clientWidth === 0) {
      return null;
    }
    const availW = el.clientWidth - 48;
    const availH = el.clientHeight - 48;
    if (availW <= 0 || availH <= 0) {
      return null;
    }
    const scale = Math.min(availW / w, availH / h);
    const next = clampZoom(scale * 78);
    setZoom(next);
    setCam({ x: 0, y: 0 });
    studio.notify?.('Tampilan disesuaikan ke layar (' + next + '%).', 'info');
    return next;
  }, [sheetSize, setZoom, studio]);

  useEffect(() => {
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetSize?.w, sheetSize?.h, studio.page]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -8 : 8;
      zoomBy(delta);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const onScrollPointerDown = (e) => {
    if (!e.target.closest?.('#sheet')) studio.selectPin(null);
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target.closest?.('#sheet')) return;
    pan.current = { startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y, moved: false };
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
  };
  const onScrollPointerMove = (e) => {
    const p = pan.current;
    if (!p) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (!p.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    p.moved = true;
    setCam({ x: p.camX + dx, y: p.camY + dy });
  };
  const onScrollPointerUp = () => { pan.current = null; };

  return (
    <div className="canvas-col" data-od-id="canvas-area">
      <div
        className={'canvas-scroll is-no-scroll' + (settings?.dark ? ' is-dark-canvas' : '')}
        id="canvas-scroll"
        ref={scrollRef}
        onPointerDown={onScrollPointerDown}
        onPointerMove={onScrollPointerMove}
        onPointerUp={onScrollPointerUp}
      >
        <div className="sheet-wrap" style={{ transform: `translate(${cam.x}px, ${cam.y}px)` }}>
          <Sheet sheetRef={sheetRef} />
        </div>
      </div>

      {/* zoom / page dock */}
      <div className="zoombar" id="zoom-bar" data-od-id="zoom-bar">
        <div className="tb-group">
          <button type="button" className="btn btn-secondary btn-icon" id="zoom-out" data-od-id="btn-zoom-out" data-tip="Zoom keluar" onClick={() => zoomBy(-10)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6.5" /><path d="M8 11h6M16 16l4 4" /></svg>
          </button>
          <span className="zoom-val" id="zoom-val">{zoom}%</span>
          <button type="button" className="btn btn-secondary btn-icon" id="zoom-in" data-od-id="btn-zoom-in" data-tip="Zoom masuk" onClick={() => zoomBy(10)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6.5" /><path d="M8 11h6M11 8v6M16 16l4 4" /></svg>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" id="zoom-fit" data-od-id="btn-fit-screen" data-tip="Sesuaikan kertas ke layar tanpa potong" onClick={fitToScreen}>Sesuaikan ke Layar</button>
          <button type="button" className="btn btn-secondary btn-sm" id="zoom-100" data-od-id="btn-zoom-100" onClick={() => { setZoom(100); setCam({ x: 0, y: 0 }); }}>100%</button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button type="button" className="btn btn-secondary btn-icon" id="page-prev" data-od-id="btn-page-prev" data-tip="Halaman sebelumnya" onClick={() => gotoSheetPage(Math.max(1, sheetPage - 1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 6l-6 6 6 6" /></svg>
          </button>
          <span className="page-indicator" id="page-indicator">{`Halaman ${sheetPage} / ${sheetTotal}`}</span>
          <button type="button" className="btn btn-secondary btn-icon" id="page-next" data-od-id="btn-page-next" data-tip="Halaman berikutnya" onClick={() => gotoSheetPage(Math.min(sheetTotal, sheetPage + 1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m10 6 6 6-6 6" /></svg>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" id="page-add" data-od-id="btn-page-add" onClick={addSheetPage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
            {' '}Tambah Halaman
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="page-del"
            data-od-id="btn-page-del"
            disabled={sheetTotal <= 1}
            onClick={() => studio.requestConfirm({ message: 'Hapus halaman aktif beserta desainnya?', note: 'Desain pada halaman ini ikut terhapus.', toast: 'Halaman dihapus.', onConfirm: removeSheetPage })}
          >Hapus Halaman</button>
        </div>
      </div>

      {/* layout toolbar */}
      <div className="layout-toolbar" data-od-id="layout-toolbar">
        <span className="lbl">Layout</span>
        <label className="check-row" data-od-id="snap-toggle" title="Tempel ke grid 25px saat drag">
          <span className={`box${inspector?.snap ? ' is-checked' : ''}`} aria-hidden="true" />
          <span><span className="check-label">Tempel ke Grid</span></span>
          <input
            type="checkbox"
            hidden
            checked={!!inspector?.snap}
            onChange={(e) => studio.setInspector({ snap: e.target.checked })}
          />
        </label>
        <button type="button" className="btn btn-secondary btn-sm" id="btn-center-layout" data-od-id="btn-center-layout" onClick={studio.centerLayout}>Pusatkan Halaman</button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="btn-reset-layout"
          data-od-id="btn-reset-layout"
          onClick={() => studio.requestConfirm({ message: 'Kosongkan layout halaman ini?', note: 'Semua desain pada halaman aktif dihapus.', toast: 'Layout dikosongkan.', onConfirm: studio.resetLayout })}
        >Kosongkan Halaman</button>


      </div>

      {/* preview controls */}
      <div className="preview-controls" data-od-id="preview-controls">
        <span className="lbl">Tampilkan</span>
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`chip${toggles[chip.key] ? ' is-on' : ''}`}
            data-toggle={chip.key}
            data-od-id={chip.id}
            onClick={() => toggleLayer(chip.key)}
          >{chip.label}</button>
        ))}
      </div>
    </div>
  );
}
