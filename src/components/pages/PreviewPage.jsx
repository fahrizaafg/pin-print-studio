import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';

const PAGE_CHECKS = [
  { id: 'pv-page-1', label: 'Halaman 1', sub: '6 desain · A3 Portrait', page: 1 },
  { id: 'pv-page-2', label: 'Halaman 2', sub: '6 desain · A3 Portrait', page: 2 },
  { id: 'pv-page-3', label: 'Halaman 3', sub: '4 desain · A3 Portrait', page: 3 },
];

export default function PreviewPage({ active }) {
  const studio = useStudio();
  const { pins, toggles, sheetPage, sheetTotal, gotoSheetPage, previewDpi, setPreviewDpi, openDialog, setSettings, settings } = studio;

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
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-prev" data-tip="Halaman sebelumnya" onClick={() => gotoSheetPage(Math.max(1, sheetPage - 1))}>
            <Icon name="chevronLeft" />
          </button>
          <span className="page-indicator" id="pv-indicator">{`Hal. ${sheetPage} / ${sheetTotal}`}</span>
          <button type="button" className="btn btn-secondary btn-icon" data-od-id="pv-next" data-tip="Halaman berikutnya" onClick={() => gotoSheetPage(Math.min(sheetTotal, sheetPage + 1))}>
            <Icon name="chevronRight" />
          </button>
        </div>
        <div className="tb-spacer" />
        <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-settings" onClick={() => openDialog('dlg-export')}>
          <Icon name="settings" />
          Pengaturan Ekspor
        </button>
      </header>

      <div className="editor-body" style={{ gridTemplateColumns: '1fr var(--panel-r)' }}>
        <div className="preview-body">
          <div className="sheet" id="pv-sheet" style={{ transform: 'scale(.9)' }}>
            <div className="sheet-layer">
              <div className="bleed-box" style={{ left: -9, top: -9, right: -9, bottom: -9 }} />
              <div className="margin-box" style={{ left: 34, top: 34, right: 34, bottom: 34 }} />
            </div>
            {pins.map((pin, i) => (
              <div
                className="pin"
                key={pin.id}
                style={{ left: pin.x, top: pin.y, width: pin.size, height: pin.size }}
              >
                <span className={`pin-art ${pin.art}`}><Icon name={pin.icon} /></span>
                {toggles.number ? <span className="pin-num">{i + 1}</span> : null}
              </div>
            ))}
          </div>
          <div className="preview-note" data-od-id="preview-note">
            <strong>Pratinjau Cetak — A3 Portrait</strong><br />
            6 desain · diameter 58 mm · bleed 3 mm · {previewDpi} DPI. Sisa area kertas 18%.
          </div>
        </div>

        <aside className="panel panel-r" data-od-id="preview-panel">
          <div className="panel-head"><span className="panel-title">Pengaturan Ekspor</span></div>
          <div className="panel-body">
            <div className="section-block">
              <div className="block-title">Halaman</div>
              <div className="stack-sm">
                {PAGE_CHECKS.map((p) => (
                  <label
                    key={p.id}
                    className={`check-row${sheetPage === p.page ? ' is-checked' : ''}`}
                    data-od-id={p.id}
                    onClick={() => gotoSheetPage(p.page)}
                  >
                    <span className="box"><Icon name="check" stroke={2.4} /></span>
                    <span>
                      <span className="check-label">{p.label}</span>
                      <span className="check-sub">{p.sub}</span>
                    </span>
                  </label>
                ))}
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
              <div className="switch-row">
                <div className="switch-label">Garis bleed</div>
                <button
                  type="button"
                  className={`switch${toggles.bleed ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={toggles.bleed}
                  aria-label="Garis bleed"
                  data-od-id="pv-bleedline"
                  onClick={() => studio.toggleLayer('bleed')}
                />
              </div>
              <div className="switch-row">
                <div className="switch-label">Nomor desain</div>
                <button
                  type="button"
                  className={`switch${toggles.number ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={toggles.number}
                  aria-label="Nomor desain"
                  data-od-id="pv-numbers"
                  onClick={() => studio.toggleLayer('number')}
                />
              </div>
            </div>
          </div>
          <div className="panel-foot">
            <div className="row2">
              <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-export-pdf" onClick={() => openDialog('dlg-export')}>Ekspor PDF</button>
              <button type="button" className="btn btn-secondary btn-sm" data-od-id="pv-export-png" onClick={() => openDialog('dlg-export')}>Ekspor PNG</button>
            </div>
            <button type="button" className="btn btn-primary btn-sm" data-od-id="pv-print" onClick={studio.print}>Cetak</button>
            <button type="button" className="btn btn-ghost btn-sm" data-od-id="pv-cancel" onClick={() => studio.goPage('editor')}>Batal Ekspor</button>
          </div>
        </aside>
      </div>
    </section>
  );
}