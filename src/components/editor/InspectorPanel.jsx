import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';

export default function InspectorPanel() {
  const studio = useStudio();
  const {
    inspector, setInspector, applyInspector, applySelected, openDialog, requestConfirm,
    panelRightOpen, togglePanelRight, setLock, selectedPinId, selectedPinIds, pins,
  } = studio;

  const set = (patch) => setInspector(patch);
  const ids = selectedPinIds && selectedPinIds.length ? selectedPinIds : (selectedPinId ? [selectedPinId] : []);
  const multi = ids.length > 1;
  const selected = ids.length > 0;
  const cropActive = !multi && Boolean(pins.find((p) => p.id === selectedPinId)?.crop);

  return (
    <aside className={`panel panel-r${panelRightOpen ? ' is-open' : ''}`} id="panel-r" data-od-id="panel-inspector" aria-label="Pengaturan desain">
      <div className="panel-head">
        <span className="panel-title">Pengaturan Desain</span>
        <button type="button" className="btn-close only-mobile" id="panel-r-close" aria-label="Tutup panel" onClick={togglePanelRight}>
          <Icon name="close" />
        </button>
      </div>

      <div className="panel-body">
        {/* geometri */}
        <details className="section-block" open>
          <summary className="block-title">Geometri Pin</summary>
          <div className="stack-sm">
            <div className="field">
              <span className="field-label">Satuan</span>
              <div className="seg" data-od-id="unit-switch">
                <button type="button" className={inspector.unit !== 'cm' ? 'is-active' : undefined} onClick={() => set({ unit: 'mm' })}>mm</button>
                <button type="button" className={inspector.unit === 'cm' ? 'is-active' : undefined} onClick={() => set({ unit: 'cm' })}>cm</button>
              </div>
            </div>
            {(() => {
              const isCm = inspector.unit === 'cm';
              const toDisp = (mm) => isCm ? (Math.round((Number(mm) / 10) * 100) / 100) : Math.round(Number(mm) * 10) / 10;
              const toMm = (v) => {
                const num = Number(v);
                if (!Number.isFinite(num) || num <= 0) return 10;
                return isCm ? num * 10 : num;
              };
              const step = isCm ? 0.1 : 0.5;
              return (
                <>
                  <div className="field">
                    <label htmlFor="in-photo">Ukuran foto (dalam)</label>
                    <div className="input-unit">
                      <input
                        className="input" type="number" id="in-photo" min={isCm ? 1 : 10} step={step}
                        data-od-id="in-photo" value={toDisp(inspector.photoSizeMm ?? 47)}
                        onChange={(e) => set({ photoSizeMm: toMm(e.target.value) })}
                      />
                      <span className="unit">{isCm ? 'cm' : 'mm'}</span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="in-cut">Ukuran garis potong (luar)</label>
                    <div className="input-unit">
                      <input
                        className="input" type="number" id="in-cut" min={isCm ? 1 : 10} step={step}
                        data-od-id="in-cut" value={toDisp(inspector.cutSizeMm ?? 57)}
                        onChange={(e) => set({ cutSizeMm: toMm(e.target.value) })}
                      />
                      <span className="unit">{isCm ? 'cm' : 'mm'}</span>
                    </div>
                  </div>
                  <div className="field">
                    <span className="field-label">Gaya garis potong</span>
                    <div className="seg" data-od-id="cutstyle-switch">
                      <button type="button" className={inspector.cutStyle !== 'dashed' ? 'is-active' : undefined} onClick={() => set({ cutStyle: 'solid' })}>Full</button>
                      <button type="button" className={inspector.cutStyle === 'dashed' ? 'is-active' : undefined} onClick={() => set({ cutStyle: 'dashed' })}>Putus-putus</button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </details>

        {/* gambar terpilih */}
        <details className="section-block" open>
          <summary className="block-title">
            Gambar Terpilih{' '}
            <span className="status is-placed"><span className="dot" />{multi ? ids.length + ' dipilih' : selected ? '1 dipilih' : '0 dipilih'}</span>
          </summary>
          {multi ? (
            <div className="stack-sm">
              <p className="field-help" data-od-id="multi-hint">{ids.length} desain dipilih (box-select / Ctrl+klik). Posisi & rotasi per-desain dikunci agar tidak menumpuk.</p>
              <div className="row2">
                <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-multi-duplicate" onClick={() => studio.duplicateSelectedPin()}>Duplikat {ids.length}</button>
                <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-multi-clear" onClick={() => studio.clearSelection()}>Batalkan Pilihan</button>
              </div>
            </div>
          ) : (
          <>
          <div className="stack-sm">
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
          </div>
          <div className="row2 mt-4">
            <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-edit-image" onClick={() => openDialog('dlg-edit-image')}>Edit Gambar</button>
            <button type="button" className={`btn btn-secondary btn-sm${cropActive ? ' is-on' : ''}`} id="btn-crop" data-od-id="btn-crop" aria-pressed={cropActive} title="ON: gambar memenuhi lingkaran (cover). OFF: gambar muat penuh (contain)." onClick={studio.toggleCrop}>Crop</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-rot-left" data-od-id="btn-rot-left" onClick={() => studio.rotateSelected(-15)}>Putar Kiri</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-rot-right" data-od-id="btn-rot-right" onClick={() => studio.rotateSelected(15)}>Putar Kanan</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-center-img" data-od-id="btn-center-img" onClick={() => studio.centerSelectedImage()}>Pusatkan Gambar</button>
            <button type="button" className="btn btn-secondary btn-sm" id="btn-reset-pos" data-od-id="btn-reset-pos" onClick={() => studio.resetSelectedImage()}>Reset Posisi</button>
          </div>
          </>
          )}
        </details>

        {/* kunci */}
        <details className="section-block" open>
          <summary className="block-title">Status &amp; Aksi</summary>
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
        </details>
      </div>

      <div className="panel-foot" data-od-id="inspector-actions">
        <button type="button" className="btn btn-secondary btn-sm" id="btn-apply-selected" data-od-id="btn-apply-selected" onClick={applySelected} disabled={multi} title={multi ? 'Nonaktif saat multi-seleksi' : undefined}>{multi ? 'Terapkan (' + ids.length + ' dipilih)' : 'Terapkan ke 1 Desain'}</button>
        <div className="row2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="btn-remove-layout"
            data-od-id="btn-remove-layout"
            onClick={() => requestConfirm({ message: multi ? 'Hapus ' + ids.length + ' desain terpilih dari layout?' : 'Hapus desain terpilih dari layout?', note: 'Desain hanya dihapus dari layout, tetap tersimpan di panel gambar.', toast: 'Desain dihapus dari layout.', onConfirm: () => studio.removeSelectedPin() })}
          >{multi ? 'Hapus ' + ids.length + ' Desain' : 'Hapus Desain Terpilih'}</button>
          <button type="button" className="btn btn-primary btn-sm" id="btn-apply-settings" data-od-id="btn-apply-settings" onClick={applyInspector}>Ratakan Semua ke Grid</button>
        </div>
      </div>
    </aside>
  );
}