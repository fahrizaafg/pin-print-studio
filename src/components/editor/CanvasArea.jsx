import { useRef } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import Sheet from './Sheet.jsx';

const CHIPS = [
  { key: 'cut', id: 'toggle-cut', label: 'Garis Potong' },
  { key: 'bleed', id: 'toggle-bleed', label: 'Bleed' },
  { key: 'grid', id: 'toggle-grid', label: 'Grid' },
  { key: 'margin', id: 'toggle-margin', label: 'Margin' },
  { key: 'safe', id: 'toggle-safe', label: 'Safe Area' },
  { key: 'filename', id: 'toggle-filename', label: 'Nama File' },
  { key: 'number', id: 'toggle-number', label: 'Nomor Desain' },
  { key: 'marks', id: 'toggle-marks', label: 'Tanda Potong' },
];

export default function CanvasArea() {
  const studio = useStudio();
  const { toggles, toggleLayer, zoom, setZoom, zoomBy, sheetPage, sheetTotal, addSheetPage, removeSheetPage, gotoSheetPage, openDialog, layoutMode, setLayoutMode } = studio;
  const sheetRef = useRef(null);

  return (
    <div className="canvas-col" data-od-id="canvas-area">
      <div className="canvas-scroll" id="canvas-scroll">
        <div className="sheet-wrap">
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
          <button type="button" className="btn btn-secondary btn-sm" id="zoom-fit" data-od-id="btn-fit-screen" onClick={() => { setZoom(78); studio.notify('Tampilan disesuaikan ke layar.', 'info'); }}>Fit to Screen</button>
          <button type="button" className="btn btn-secondary btn-sm" id="zoom-100" data-od-id="btn-zoom-100" onClick={() => setZoom(100)}>100%</button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button type="button" className="btn btn-secondary btn-icon" id="page-prev" data-od-id="btn-page-prev" data-tip="Halaman sebelumnya" onClick={() => gotoSheetPage(Math.max(1, sheetPage - 1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 6l-6 6 6 6" /></svg>
          </button>
          <span className="page-indicator" id="page-indicator">{`Hal. ${sheetPage} / ${sheetTotal}`}</span>
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
            onClick={() => studio.requestConfirm({ message: 'Hapus halaman aktif beserta desainnya?', toast: 'Halaman dihapus.', nav: null, onConfirm: removeSheetPage })}
          >Hapus Halaman</button>
        </div>
      </div>

      {/* layout toolbar */}
      <div className="layout-toolbar" data-od-id="layout-toolbar">
        <span className="lbl">Layout</span>
        <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-layout-rearrange" onClick={() => openDialog('dlg-auto')}>Susun Ulang</button>
        <button type="button" className="btn btn-secondary btn-sm" id="btn-align-grid" data-od-id="btn-align-grid" onClick={studio.alignGrid}>Ratakan ke Grid</button>
        <button type="button" className="btn btn-secondary btn-sm" id="btn-center-layout" data-od-id="btn-center-layout" onClick={studio.centerLayout}>Pusatkan Layout</button>
        <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-set-rows" onClick={() => openDialog('dlg-rows')}>Atur Baris</button>
        <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-set-cols" onClick={() => openDialog('dlg-cols')}>Atur Kolom</button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="btn-reset-layout"
          data-od-id="btn-reset-layout"
          onClick={() => studio.requestConfirm({ message: 'Reset layout ke susunan awal?', toast: 'Layout direset.', nav: null })}
        >Reset Layout</button>

        <div className="tb-sep" />

        <div className="seg" id="layout-mode" data-od-id="layout-mode">
          <button type="button" className={layoutMode === 'grid' ? 'is-active' : undefined} onClick={() => setLayoutMode('grid')}>Mode Grid</button>
          <button type="button" className={layoutMode === 'hemat' ? 'is-active' : undefined} onClick={() => setLayoutMode('hemat')}>Hemat Kertas</button>
        </div>
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