import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';
import { PAPER_LABEL, PAPER_MM } from '../../data/studioData.js';
import { formatLength } from '../../lib/format.js';
import { artPctOf, clampZoom, filterOf } from '../../lib/pinGeometry.js';

function paperName(inspector) {
  if (inspector.paper === 'custom') {
    const width = Math.round(Number(inspector.customWidth) || 297);
    const height = Math.round(Number(inspector.customHeight) || 420);
    return `Custom ${width} × ${height} mm`;
  }
  return PAPER_LABEL[inspector.paper] || 'A3';
}

export default function PreviewPage({ active }) {
  const studio = useStudio();
  const {
    pages, pins, previewPage, setPreviewPage, previewDpi, setPreviewDpi,
    openDialog, setSettings, settings, inspector, sheetSize,
  } = studio;

  const total = pages.length;
  const pageNumber = Math.min(Math.max(previewPage, 1), total);
  const pagePins = (pages[pageNumber - 1] && pages[pageNumber - 1].pins) || pins || [];

  const paperLabel = paperName(inspector);
  const orientationLabel = inspector.orientation === 'landscape' ? 'Landscape' : 'Portrait';
  const diameter = Number(inspector.cutSizeMm ?? inspector.diameter) || 57;
  const bleed = Number(inspector.bleed) || 0;

  const pinArea = pagePins.length * Math.PI * (diameter / 2) ** 2;
  const sheetMm = (() => {
    const pair = inspector.paper === 'custom'
      ? [Number(inspector.customWidth) || 297, Number(inspector.customHeight) || 420]
      : (PAPER_MM[inspector.paper] || PAPER_MM.a3);
    return inspector.orientation === 'landscape' ? { w: pair[1], h: pair[0] } : { w: pair[0], h: pair[1] };
  })();
  const sheetArea = sheetMm.w * sheetMm.h;
  const efficiency = sheetArea > 0 ? Math.min(100, Math.max(0, (pinArea / sheetArea) * 100)) : 0;
  const remaining = Math.round(100 - efficiency);

  /* Same geometry as the editor sheet. */
  const artPct = artPctOf(inspector);
  const cutCls = inspector?.cutStyle === 'dashed' ? 'cut-dashed' : 'cut-solid';
  const sheetW = sheetSize?.w || 620;
  const sheetH = sheetSize?.h || 877;

  /* Local zoom + pan: preview never scrolls, the sheet scales instead. */
  const [zoom, setZoomLocal] = useState(78);
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const bodyRef = useRef(null);
  const pan = useRef(null);

  const fitToView = useCallback(() => {
    const el = bodyRef.current;
    if (!el || el.clientWidth === 0) return null;
    const availW = el.clientWidth - 48;
    const availH = el.clientHeight - 48;
    if (availW <= 0 || availH <= 0) return null;
    const scale = Math.min(availW / sheetW, availH / sheetH);
    const next = clampZoom(scale * 78);
    setZoomLocal(next);
    setCam({ x: 0, y: 0 });
    return next;
  }, [sheetW, sheetH]);

  useEffect(() => {
    fitToView();
  }, [fitToView, pageNumber]);

  /* Re-fit when the page becomes visible (sizes are 0 while hidden) + on resize. */
  useEffect(() => {
    if (!active) return undefined;
    const raf = requestAnimationFrame(() => fitToView());
    const onResize = () => fitToView();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [active, fitToView]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -8 : 8;
      setZoomLocal((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onBodyPointerDown = (e) => {
    if (e.target.closest?.('#pv-sheet')) return;
    if (e.button !== 0 && e.button !== 1) return;
    pan.current = { startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y, moved: false };
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onBodyPointerMove = (e) => {
    const p = pan.current;
    if (!p) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (!p.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    p.moved = true;
    setCam({ x: p.camX + dx, y: p.camY + dy });
  };
  const onBodyPointerUp = () => { pan.current = null; };

  const sheetClass = 'sheet';

  const exportSheet = (format) => studio.startExport({
    format,
    dpi: previewDpi,
    cropmark: settings.cropmark,
  });

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-preview" data-page="preview" data-od-id="page-preview">
      <header className="toolbar" data-od-id="preview-toolbar">
        <button type="button" className="btn btn-secondary btn-sm" id="btn-back-editor" data-od-id="btn-back-editor" onClick={() => studio.goPage('editor')}>
          <Icon name="chevronLeft" />
          Kembali ke Editor
        </button>
        <span className="pill">Pratinjau Cetak</span>
        <div className="tb-sep" />
        <div className="tb-group">
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-prev" data-tip="Halaman sebelumnya" onClick={() => setPreviewPage(Math.max(1, pageNumber - 1))}>
            <Icon name="chevronLeft" />
          </button>
          <span className="page-indicator" id="pv-indicator">{`Hal. ${pageNumber} / ${total}`}</span>
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-next" data-tip="Halaman berikutnya" onClick={() => setPreviewPage(Math.min(total, pageNumber + 1))}>
            <Icon name="chevronRight" />
          </button>
        </div>
        <div className="tb-sep" />
        <div className="tb-group">
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-zoom-out" data-tip="Perkecil" onClick={() => setZoomLocal((z) => clampZoom(z - 10))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6.5" /><path d="M8 11h6M16 16l4 4" /></svg>
          </button>
          <span className="zoom-val" data-od-id="pv-zoom-val">{zoom}%</span>
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-zoom-in" data-tip="Perbesar" onClick={() => setZoomLocal((z) => clampZoom(z + 10))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6.5" /><path d="M8 11h6M11 8v6M16 16l4 4" /></svg>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-fit" onClick={() => { fitToView(); }}>Fit</button>
        </div>
        <div className="tb-spacer" />
        <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-settings" onClick={() => openDialog('dlg-export')}>
          <Icon name="settings" />
          Pengaturan Ekspor
        </button>
      </header>

      <div className="editor-body" style={{ gridTemplateColumns: '1fr var(--panel-r)' }}>
        <div
          className="preview-body"
          ref={bodyRef}
          style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', padding: 24, minHeight: 0 }}
          onPointerDown={onBodyPointerDown}
          onPointerMove={onBodyPointerMove}
          onPointerUp={onBodyPointerUp}
        >
          <div className="sheet-wrap" style={{ transform: `translate(${cam.x}px, ${cam.y}px)` }}>
            <div
              className={sheetClass}
              id="pv-sheet"
              style={{ width: sheetW, height: sheetH, transform: `scale(${zoom / 78})`, transformOrigin: 'center center', flex: 'none' }}
            >
              <div className="sheet-layer" />
              {pagePins.map((pin) => (
                <div
                  className={`pin ${cutCls}`}
                  key={pin.id}
                  style={{ left: pin.x, top: pin.y, width: pin.size, height: pin.size, cursor: 'default' }}
                >
                  <span
                    className={`pin-art ${pin.art}${pin.crop ? ' is-cropped' : ''}`}
                    style={{
                      width: `${artPct}%`,
                      height: `${artPct}%`,
                      transform: `rotate(${pin.rotate || 0}deg)`,
                    }}
                  >
                    {pin.url
                      ? (
                        <img
                          src={pin.url}
                          alt={pin.label}
                          draggable={false}
                          style={{
                            filter: filterOf(pin),
                            objectPosition: `${pin.cropX ?? 50}% ${pin.cropY ?? 50}%`,
                            transform: `scale(${(pin.cropZoom ?? 100) / 100})`,
                          }}
                        />
                      )
                      : <span style={{ filter: filterOf(pin), display: 'contents' }}><Icon name={pin.icon} /></span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel panel-r" data-od-id="preview-panel">
          <div className="panel-head"><span className="panel-title">Pengaturan Ekspor</span></div>
          <div className="panel-body">
            <div className="section-block">
              <div className="block-title">Ringkasan</div>
              <p className="field-help" data-od-id="preview-note">
                <strong>{`${paperLabel} ${orientationLabel}`}</strong><br />
                {`${pagePins.length} desain · diameter ${formatLength(diameter, settings)} · bleed ${formatLength(bleed, settings)} · ${previewDpi} DPI. Sisa area kertas ${remaining}%.`}
              </p>
              <p className="field-help">Pratinjau selalu bersih tanpa garis bantu. Geser area kosong untuk pan, scroll untuk zoom.</p>
            </div>
            <div className="section-block">
              <div className="block-title">Halaman</div>
              <div className="stack-sm">
                {pages.map((page, index) => {
                  const number = index + 1;
                  const count = page.pins ? page.pins.length : 0;
                  return (
                    <label
                      key={page.id}
                      className={`check-row${pageNumber === number ? ' is-checked' : ''}`}
                      data-od-id={`pv-page-${number}`}
                      onClick={() => setPreviewPage(number)}
                    >
                      <span className="box"><Icon name="check" stroke={2.4} /></span>
                      <span>
                        <span className="check-label">{`Halaman ${number}`}</span>
                        <span className="check-sub">{`${count} desain · ${count ? 'Siap' : 'Kosong'}`}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="section-block">
              <div className="block-title">Resolusi</div>
              <div className="seg" data-od-id="pv-dpi" style={{ width: '100%' }}>
                {['150', '300', '600'].map((dpi) => (
                  <button
                    key={dpi}
                    type="button"
                    className={previewDpi === dpi ? 'is-active' : undefined}
                    onClick={() => setPreviewDpi(dpi)}
                  >{dpi}</button>
                ))}
              </div>
              <p className="field-help mt-2">DPI lebih tinggi memperbesar ukuran berkas.</p>
            </div>
            <div className="section-block">
              <div className="block-title">Tampilkan saat ekspor</div>
              <div className="switch-row">
                <div className="switch-label">Tanda potong</div>
                <button
                  type="button"
                  className={`switch${settings.cropmark ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={settings.cropmark}
                  aria-label="Tanda potong"
                  data-od-id="pv-cropmark"
                  onClick={() => setSettings({ cropmark: !settings.cropmark })}
                />
              </div>
              <p className="field-help">Pratinjau selalu bersih tanpa garis bantu.</p>
            </div>
          </div>
          <div className="panel-foot">
            <div className="row2">
              <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-export-pdf" onClick={() => exportSheet('PDF')}>Ekspor PDF</button>
              <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-export-png" onClick={() => exportSheet('PNG')}>Ekspor PNG</button>
            </div>
            <button type="button" className="btn btn-primary btn-sm" data-od-id="pv-print" onClick={() => studio.print()}>Cetak</button>
            <button type="button" className="btn btn-ghost btn-sm" data-od-id="pv-cancel" onClick={() => studio.goPage('editor')}>Kembali ke Editor</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
