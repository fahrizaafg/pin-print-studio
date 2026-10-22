import { useStudio } from '../../state/StudioContext.jsx';

const TABS = [
  { id: 'tampilan', label: 'Tampilan' },
  { id: 'produksi', label: 'Default Produksi' },
  { id: 'ekspor', label: 'Ekspor' },
  { id: 'penyimpanan', label: 'Penyimpanan' },
];

function SwitchRow({ label, sub, on, onToggle, odId }) {
  return (
    <div className="switch-row">
      <div>
        <div className="switch-label">{label}</div>
        <div className="switch-sub">{sub}</div>
      </div>
      <button
        type="button"
        className={`switch${on ? ' is-on' : ''}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
        data-od-id={odId}
        onClick={onToggle}
      />
    </div>
  );
}

export default function SettingsPage({ active }) {
  const studio = useStudio();
  const { settings, settingsTab, setSettingsTab, setSettings } = studio;
  const set = (patch) => setSettings(patch);

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-settings" data-page="settings" data-od-id="page-settings">
      <div className="page-head">
        <div className="head-row">
          <div className="head-copy">
            <p className="eyebrow">Preferensi</p>
            <h1>Pengaturan</h1>
            <p className="lead">Atur tampilan, nilai default produksi, opsi ekspor, dan penyimpanan proyek.</p>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-od-id="btn-settings-reset"
              onClick={() => studio.requestConfirm({ message: 'Kembalikan semua pengaturan ke nilai default?', toast: 'Pengaturan direset.' })}
            >Reset</button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              id="btn-settings-save"
              data-od-id="btn-settings-save"
              onClick={() => { studio.save(); studio.toastInline('Pengaturan tersimpan.', 'ok'); }}
            >Simpan</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="page-inner">
          <div className="seg mb-5" id="settings-tabs" data-od-id="settings-tabs" style={{ padding: 3 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={settingsTab === tab.id ? 'is-active' : undefined}
                data-tab={tab.id}
                onClick={() => setSettingsTab(tab.id)}
              >{tab.label}</button>
            ))}
          </div>

          <div data-tab-panel="tampilan" data-od-id="panel-tampilan" hidden={settingsTab !== 'tampilan'}>
            <div className="grid-2-1">
              <div className="card">
                <h3 className="mb-4">Tampilan antarmuka</h3>
                <SwitchRow label="Tema gelap editor" sub="Warna gelap pada area kanvas" on={settings.dark} onToggle={() => set({ dark: !settings.dark })} odId="set-dark" />
                <SwitchRow label="Tampilkan kisi bantu" sub="Munculkan grid pada lembar kertas" on={settings.grid} onToggle={() => set({ grid: !settings.grid })} odId="set-grid" />
                <SwitchRow label="Satuan milimeter" sub="Matikan untuk memakai inci" on={settings.unit} onToggle={() => set({ unit: !settings.unit })} odId="set-unit" />
                <SwitchRow label="Tooltip tombol" sub="Tampilkan keterangan saat kursor berhenti" on={settings.tooltip} onToggle={() => set({ tooltip: !settings.tooltip })} odId="set-tooltip" />
              </div>
              <div className="card card-rule">
                <h3>Bahasa &amp; satuan</h3>
                <div className="stack-sm mt-4">
                  <div className="field">
                    <label htmlFor="set-lang">Bahasa antarmuka</label>
                    <select className="select" id="set-lang" data-od-id="set-lang" value={settings.lang} onChange={(e) => set({ lang: e.target.value })}>
                      <option>Bahasa Indonesia</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="set-dec">Desimal angka</label>
                    <select className="select" id="set-dec" data-od-id="set-dec" value={settings.dec} onChange={(e) => set({ dec: e.target.value })}>
                      <option>Koma (1,5 mm)</option>
                      <option>Titik (1.5 mm)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-tab-panel="produksi" data-od-id="panel-produksi" hidden={settingsTab !== 'produksi'}>
            <div className="card">
              <h3 className="mb-4">Nilai default produksi</h3>
              <div className="grid-3">
                <div className="field">
                  <label htmlFor="set-dia">Diameter potong</label>
                  <div className="input-unit">
                    <input className="input" type="number" id="set-dia" data-od-id="set-dia" value={settings.dia} onChange={(e) => set({ dia: Number(e.target.value) })} />
                    <span className="unit">mm</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="set-bleed">Bleed</label>
                  <div className="input-unit">
                    <input className="input" type="number" id="set-bleed" data-od-id="set-bleed" value={settings.bleed} onChange={(e) => set({ bleed: Number(e.target.value) })} />
                    <span className="unit">mm</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="set-gap2">Jarak antardesain</label>
                  <div className="input-unit">
                    <input className="input" type="number" id="set-gap2" data-od-id="set-gap2" value={settings.gap2} onChange={(e) => set({ gap2: Number(e.target.value) })} />
                    <span className="unit">mm</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="set-paper2">Ukuran kertas</label>
                  <select className="select" id="set-paper2" data-od-id="set-paper2" value={settings.paper2} onChange={(e) => set({ paper2: e.target.value })}>
                    <option>A4</option><option>A3</option><option>A3+</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="set-safe">Safe area</label>
                  <div className="input-unit">
                    <input className="input" type="number" id="set-safe" data-od-id="set-safe" value={settings.safe} onChange={(e) => set({ safe: Number(e.target.value) })} />
                    <span className="unit">mm</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="set-margin2">Margin</label>
                  <div className="input-unit">
                    <input className="input" type="number" id="set-margin2" data-od-id="set-margin2" value={settings.margin2} onChange={(e) => set({ margin2: Number(e.target.value) })} />
                    <span className="unit">mm</span>
                  </div>
                </div>
              </div>
              <SwitchRow
                label="Mode hemat kertas default"
                sub="Kemas desain serapat mungkin"
                on={settings.eco}
                onToggle={() => set({ eco: !settings.eco })}
                odId="set-eco"
              />
              <div className="mt-5" />
            </div>
          </div>

          <div data-tab-panel="ekspor" data-od-id="panel-ekspor" hidden={settingsTab !== 'ekspor'}>
            <div className="grid-2">
              <div className="card">
                <h3 className="mb-4">Opsi ekspor</h3>
                <div className="field">
                  <label htmlFor="set-dpi">Resolusi default</label>
                  <select className="select" id="set-dpi" data-od-id="set-dpi" value={settings.dpi} onChange={(e) => set({ dpi: e.target.value })}>
                    <option>150 DPI</option><option>300 DPI</option><option>600 DPI</option>
                  </select>
                </div>
                <div className="field mt-4">
                  <label htmlFor="set-fmt">Format utama</label>
                  <select className="select" id="set-fmt" data-od-id="set-fmt" value={settings.fmt} onChange={(e) => set({ fmt: e.target.value })}>
                    <option>PDF (siap cetak)</option><option>PNG</option><option>PDF + PNG</option>
                  </select>
                </div>
                <SwitchRow
                  label="Sertakan tanda potong"
                  sub="Tambahkan crop mark di tepi lembar"
                  on={settings.cropmark}
                  onToggle={() => set({ cropmark: !settings.cropmark })}
                  odId="set-cropmark"
                />
                <SwitchRow
                  label="Sematkan profil warna"
                  sub="Lampirkan CMYK untuk percetakan"
                  on={settings.cmyk}
                  onToggle={() => set({ cmyk: !settings.cmyk })}
                  odId="set-cmyk"
                />
              </div>
              <div className="card card-rule">
                <h3>Nama berkas ekspor</h3>
                <div className="stack-sm mt-4">
                  <div className="field">
                    <label htmlFor="set-name">Pola nama</label>
                    <input className="input" type="text" id="set-name" data-od-id="set-name" value={settings.name} onChange={(e) => set({ name: e.target.value })} />
                  </div>
                  <p className="field-help">
                    Token yang tersedia: <span className="kbd">{'{proyek}'}</span> <span className="kbd">{'{tanggal}'}</span> <span className="kbd">{'{halaman}'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div data-tab-panel="penyimpanan" data-od-id="panel-penyimpanan" hidden={settingsTab !== 'penyimpanan'}>
            <div className="grid-2">
              <div className="card">
                <h3 className="mb-4">Penyimpanan lokal</h3>
                <SwitchRow
                  label="Simpan otomatis"
                  sub="Simpan setiap 2 menit saat ada perubahan"
                  on={settings.autosave}
                  onToggle={() => set({ autosave: !settings.autosave })}
                  odId="set-autosave"
                />
                <SwitchRow
                  label="Cache pratinjau"
                  sub="Percepat pembukaan proyek besar"
                  on={settings.cache}
                  onToggle={() => set({ cache: !settings.cache })}
                  odId="set-cache"
                />
                <div className="row2 mt-4">
                  <button type="button" className="btn btn-secondary btn-sm" id="btn-clear-cache" data-od-id="btn-clear-cache" onClick={studio.clearCache}>Bersihkan Cache</button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    id="btn-clear-all"
                    data-od-id="btn-clear-all"
                    onClick={() => studio.requestConfirm({ message: 'Hapus semua data proyek dari perangkat ini?', toast: 'Data lokal dihapus.' })}
                  >Hapus Semua Data</button>
                </div>
              </div>
              <div className="card card-rule">
                <h3>Impor &amp; cadangan</h3>
                <p className="body-sm muted mt-2 mb-4">Pindahkan proyek antar perangkat dengan berkas cadangan <span className="kbd">.pinzip</span>.</p>
                <div className="stack-xs">
                  <button type="button" className="btn btn-secondary btn-sm" data-od-id="set-import" onClick={() => studio.openDialog('dlg-import')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4v10M8.5 10.5 12 14l3.5-3.5" /><path d="M5 18h14" /></svg>
                    Impor Proyek
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" id="btn-backup-2" data-od-id="set-backup" onClick={() => studio.openDialog('dlg-backup')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16v4H4z" /><path d="M6 10v8h12v-8M10 14h4" /></svg>
                    Ekspor Cadangan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}