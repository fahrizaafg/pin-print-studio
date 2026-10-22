import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';

const PAPER_OPTIONS = [
  { value: 'a4', label: 'A4 — 210 × 297 mm' },
  { value: 'a3', label: 'A3 — 297 × 420 mm' },
  { value: 'a3p', label: 'A3+ — 329 × 483 mm' },
  { value: 'custom', label: 'Custom…' },
];

export default function InspectorPanel() {
  const studio = useStudio();
  const {
    inspector, setInspector, applyInspector, applySelected, openDialog, requestConfirm,
    panelRightOpen, togglePanelRight, setLock, selectedPinId,
  } = studio;

  const set = (patch) => setInspector(patch);
  const selected = Boolean(selectedPinId);

  return (
    <aside className={`panel panel-r${panelRightOpen ? ' is-open' : ''}`} id="panel-r" data-od-id="panel-inspector" aria-label="Pengaturan desain">
      <div className="panel-head">
        <span className="panel-title">Pengaturan Desain</span>
        <button type="button" className="btn-close" id="panel-r-close" aria-label="Tutup panel" onClick={togglePanelRight}>
          <Icon name="close" />
        </button>
      </div>

      <div className="panel-body">
        {/* geometri */}
        <div className="section-block">
          <div className="block-title">Geometri Pin</div>
          <div className="stack-sm">
            <div className="field">
              <label htmlFor="in-diameter">Diameter potong</label>
              <div className="input-unit">
                <input
                  className="input" type="number" id="in-diameter" min="25" max="150"
                  data-od-id="in-diameter" value={inspector.diameter}
                  onChange={(e) => set({ diameter: Number(e.target.value) })}
                />
                <span className="unit">mm</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="in-bleed">Bleed (lebih cetak)</label>
              <div className="input-unit">
                <input
                  className="input" type="number" id="in-bleed" min="0" max="10" step="0.5"
                  data-od-id="in-bleed" value={inspector.bleed}
                  onChange={(e) => set({ bleed: Number(e.target.value) })}
                />
                <span className="unit">mm</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="in-bleed-color">Warna bleed</label>
              <div className="color-row">
                <input
                  className="input" type="color" id="in-bleed-color" data-od-id="in-bleed-color"
                  value={inspector.bleedColor}
                  onChange={(e) => set({ bleedColor: e.target.value })}
                />
                <span className="num">{inspector.bleedColor.toUpperCase()}</span>
                <button type="button" className="btn btn-secondary btn-sm" id="btn-bleed-white" data-od-id="btn-bleed-white" onClick={() => set({ bleedColor: '#ffffff' })}>Putih</button>
              </div>
            </div>
          </div>
        </div>

        {/* gambar terpilih */}
        <div className="section-block">
          <div className="block-title">
            Gambar Terpilih{' '}
            <span className="status is-placed"><span className="dot" />{selected ? '1 dipilih' : '0 dipilih'}</span>
          </div>
          <div className="stack-sm">
            <div className="field">
              <label htmlFor="in-zoom">Zoom gambar</label>
              <div className="range-row">
                <input
                  type="range" id="in-zoom" min="50" max="200" data-od-id="in-zoom"
                  value={inspector.imgZoom} onChange={(e) => set({ imgZoom: Number(e.target.value) })}
                />
                <span className="num" id="zoom-img-val">{inspector.imgZoom}%</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="in-rotate">Rotasi</label>
              <div className="range-row">
                <input
                  type="range" id="in-rotate" min="-180" max="180" data-od-id="in-rotate"
                  value={inspector.rotate} onChange={(e) => set({ rotate: Number(e.target.value) })}
                />
                <span className="num" id="rotate-val">{inspector.rotate}°</span>
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="in-pos-x">Posisi X</label>
                <div className="input-unit">
                  <input
                    className="input" type="number" id="in-pos-x" data-od-id="in-pos-x"
                    value={inspector.posX ?? 60} onChange={(e) => set({ posX: Number(e.target.value) })}
                  />
                  <span className="unit">px</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="in-pos-y">Posisi Y</label>
                <div className="input-unit">
                  <input
                    className="input" type="number" id="in-pos-y" data-od-id="in-pos-y"
                    value={inspector.posY ?? 60} onChange={(e) => set({ posY: Number(e.target.value) })}
                  />
                  <span className="unit">px</span>
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="in-qty">Jumlah pesanan</label>
              <div className="input-unit">
                <input
                  className="input" type="number" id="in-qty" min="1" data-od-id="in-qty"
                  value={inspector.qty} onChange={(e) => set({ qty: Number(e.target.value) })}
                />
                <span className="unit">pcs</span>
              </div>
            </div>
          </div>

          <div className="row2 mt-4">
            <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-edit-image" onClick={() => openDialog('dlg-edit-image')}>Edit Gambar</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-crop" data-od-id="btn-crop" onClick={() => studio.toastInline('Mode crop aktif pada desain terpilih.', 'info')}>Crop</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-rot-left" data-od-id="btn-rot-left" onClick={() => set({ rotate: Math.max(-180, inspector.rotate - 90) })}>Putar Kiri</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-rot-right" data-od-id="btn-rot-right" onClick={() => set({ rotate: Math.min(180, inspector.rotate + 90) })}>Putar Kanan</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-center-img" data-od-id="btn-center-img" onClick={() => set({ imgZoom: 100 })}>Pusatkan Gambar</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-reset-pos" data-od-id="btn-reset-pos" onClick={() => set({ posX: 60, posY: 60, imgZoom: 100, rotate: 0 })}>Reset Posisi</button>
          </div>
        </div>

        {/* kertas */}
        <div className="section-block">
          <div className="block-title">Kertas &amp; Susunan</div>
          <div className="stack-sm">
            <div className="field">
              <label htmlFor="in-paper">Ukuran kertas</label>
              <select className="select" id="in-paper" data-od-id="in-paper" value={inspector.paper} onChange={(e) => set({ paper: e.target.value })}>
                {PAPER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="row2" id="custom-size" hidden={inspector.paper !== 'custom'}>
              <div className="field">
                <label htmlFor="in-cw">Lebar</label>
                <div className="input-unit">
                  <input className="input" type="number" id="in-cw" data-od-id="in-cw" value={inspector.customWidth} onChange={(e) => set({ customWidth: Number(e.target.value) })} />
                  <span className="unit">mm</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="in-ch">Tinggi</label>
                <div className="input-unit">
                  <input className="input" type="number" id="in-ch" data-od-id="in-ch" value={inspector.customHeight} onChange={(e) => set({ customHeight: Number(e.target.value) })} />
                  <span className="unit">mm</span>
                </div>
              </div>
            </div>
            <div className="field">
              <span className="field-label">Orientasi</span>
              <div className="seg" id="orientation" data-od-id="orientation">
                <button type="button" className={inspector.orientation === 'portrait' ? 'is-active' : undefined} onClick={() => set({ orientation: 'portrait' })}>Portrait</button>
                <button type="button" className={inspector.orientation === 'landscape' ? 'is-active' : undefined} onClick={() => set({ orientation: 'landscape' })}>Landscape</button>
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="in-margin">Margin</label>
                <div className="input-unit">
                  <input className="input" type="number" id="in-margin" data-od-id="in-margin" value={inspector.margin} onChange={(e) => set({ margin: Number(e.target.value) })} />
                  <span className="unit">mm</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="in-gap">Jarak antardesain</label>
                <div className="input-unit">
                  <input className="input" type="number" id="in-gap" data-od-id="in-gap" value={inspector.gap} onChange={(e) => set({ gap: Number(e.target.value) })} />
                  <span className="unit">mm</span>
                </div>
              </div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="in-rows">Jumlah baris</label><input className="input" type="number" id="in-rows" min="1" max="12" data-od-id="in-rows" value={inspector.rows} onChange={(e) => set({ rows: Number(e.target.value) })} /></div>
              <div className="field"><label htmlFor="in-cols">Jumlah kolom</label><input className="input" type="number" id="in-cols" min="1" max="12" data-od-id="in-cols" value={inspector.cols} onChange={(e) => set({ cols: Number(e.target.value) })} /></div>
            </div>
          </div>
        </div>

        {/* kunci */}
        <div className="section-block">
          <div className="block-title">Status &amp; Aksi</div>
          <div className="switch-row">
            <div>
              <div className="switch-label">Kunci posisi desain</div>
              <div className="switch-sub">Cegah desain bergeser tak sengaja</div>
            </div>
            <button
              type="button"
              className={`switch${inspector.lock ? ' is-on' : ''}`}
              id="sw-lock"
              data-od-id="sw-lock"
              role="switch"
              aria-checked={Boolean(inspector.lock)}
              onClick={() => setLock(!inspector.lock)}
            />
          </div>
          <div className="row2 mt-3">
            <button type="button" className="btn btn-secondary btn-sm" id="btn-lock-pos" data-od-id="btn-lock-pos" onClick={() => setLock(true)}>Kunci Posisi</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-unlock-pos" data-od-id="btn-unlock-pos" onClick={() => setLock(false)}>Buka Kunci</button>
          </div>
        </div>
      </div>

      <div className="panel-foot" data-od-id="inspector-actions">
        <button type="button" className="btn btn-secondary btn-sm" id="btn-apply-selected" data-od-id="btn-apply-selected" onClick={applySelected}>Terapkan ke Desain Terpilih</button>
        <div className="row2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="btn-remove-layout"
            data-od-id="btn-remove-layout"
            onClick={() => requestConfirm({ message: 'Hapus desain terpilih dari layout?', toast: 'Desain dihapus dari layout.' })}
          >Hapus dari Layout</button>
          <button type="button" className="btn btn-primary btn-sm" id="btn-apply-settings" data-od-id="btn-apply-settings" onClick={applyInspector}>Terapkan</button>
        </div>
      </div>
    </aside>
  );
}