import { useState } from 'react';
import Dialog from './Dialog.jsx';
import { useStudio } from '../../state/StudioContext.jsx';
import { EXPORT_NOTES, OPEN_PROJECTS, RESTORE_VERSIONS } from '../../data/studioData.js';
import { Progress } from '../ui/primitives.jsx';
import { Icon } from '../ui/icons.jsx';

export default function Dialogs() {
  const studio = useStudio();
  const { dialog, closeDialog, openDialog } = studio;
  const isOpen = (id) => dialog === id;

  return (
    <>
      <NewProjectDialog open={isOpen('dlg-new-project')} />
      <OpenProjectDialog open={isOpen('dlg-open-project')} />
      <DuplicateProjectDialog open={isOpen('dlg-duplicate-project')} />
      <ResetProjectDialog open={isOpen('dlg-reset-project')} />
      <UploadDialog open={isOpen('dlg-upload')} />
      <ReplaceDialog open={isOpen('dlg-replace')} />
      <EditImageDialog open={isOpen('dlg-edit-image')} />
      <PaperDialog open={isOpen('dlg-paper')} />
      <AutoArrangeDialog open={isOpen('dlg-auto')} />
      <RowsDialog open={isOpen('dlg-rows')} />
      <ColsDialog open={isOpen('dlg-cols')} />
      <NewPresetDialog open={isOpen('dlg-new-preset')} />
      <EditPresetDialog open={isOpen('dlg-edit-preset')} />
      <RestoreDialog open={isOpen('dlg-restore')} />
      <ImportDialog open={isOpen('dlg-import')} />
      <BackupDialog open={isOpen('dlg-backup')} />
      <ExportDialog open={isOpen('dlg-export')} />
      <ConfirmDialog open={isOpen('dlg-confirm')} />

      <button type="button" hidden onClick={() => openDialog('dlg-export')}>.</button>
      <span hidden>{closeDialog ? '' : ''}</span>
    </>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────── */
function Foot({ children }) {
  return <div className="dialog-foot">{children}</div>;
}

function CancelButton() {
  const { closeDialog } = useStudio();
  return <button type="button" className="btn btn-secondary" onClick={closeDialog}>Batal</button>;
}

/* ─── 1. proyek baru ──────────────────────────────────────────────── */
function NewProjectDialog({ open }) {
  const studio = useStudio();
  const [name, setName] = useState('');
  return (
    <Dialog
      id="dlg-new-project" open={open} onClose={studio.closeDialog}
      title="Proyek Baru" subtitle="Mulai lembar kerja kosong dengan preset yang diinginkan."
      footer={(
        <>
          <CancelButton />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { studio.createProject(name.trim() || 'Proyek Tanpa Judul'); setName(''); }}
          >Buat Proyek</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="np-name">Nama proyek</label>
          <input className="input" type="text" id="np-name" placeholder="Contoh: Pin Wisuda 2026" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="np-preset">Mulai dari</label>
          <select className="select" id="np-preset" defaultValue="Preset Grid Rapat A3">
            <option>Kanvas kosong</option>
            <option>Preset Grid Rapat A3</option>
            <option>Preset Hemat A4 38mm</option>
            <option>Duplikat proyek terakhir</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-paper">Ukuran kertas</label>
          <select className="select" id="np-paper" defaultValue="A3">
            <option>A4</option><option>A3</option><option>A3+</option><option>Custom…</option>
          </select>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 2. buka proyek ──────────────────────────────────────────────── */
function OpenProjectDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-open-project" open={open} onClose={studio.closeDialog} size="lg"
      title="Buka Proyek" subtitle="Pilih dari 5 proyek tersimpan di perangkat ini."
      bodyStyle={{ padding: 0 }}
      footer={(
        <>
          <button type="button" className="btn btn-secondary foot-left" onClick={() => studio.openDialog('dlg-import')}>Impor Proyek…</button>
          <button type="button" className="btn btn-secondary" onClick={studio.closeDialog}>Tutup</button>
        </>
      )}
    >
      {' '}
      <table className="ds-table">
        {' '}
        <tbody>
          {' '}
          {OPEN_PROJECTS.map((p) => [
            <tr className="is-pickable" key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <div className="meta">{p.meta}</div>
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => studio.openProject(p.name)}>Buka</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => studio.duplicatePreset(p.name)}>Duplikat</button>
              </td>
            </tr>,
            ' ',
          ])}
        </tbody>
      </table>
    </Dialog>
  );
}

/* ─── 3. duplikat proyek ──────────────────────────────────────────── */
function DuplicateProjectDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-duplicate-project" open={open} onClose={studio.closeDialog}
      title="Duplikat Proyek" subtitle="Buat salinan tanpa mengubah proyek asli."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Proyek diduplikat.', 'ok'); studio.closeDialog(); }}>Duplikat</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="dp-name">Nama salinan</label>
        <input className="input" type="text" id="dp-name" defaultValue="Layout Pin A3 — Kopi Kenangan (salinan)" />
      </div>
      <div className="switch-row mt-4">
        <div>
          <div className="switch-label">Sertakan gambar</div>
          <div className="switch-sub">Salin juga berkas gambar yang digunakan</div>
        </div>
        <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Sertakan gambar" />
      </div>
    </Dialog>
  );
}

/* ─── 4. reset proyek ─────────────────────────────────────────────── */
function ResetProjectDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-reset-project" open={open} onClose={studio.closeDialog}
      title="Reset Proyek" subtitle="Kembalikan proyek ke kondisi awal. Tindakan ini tidak dapat dibatalkan."
      footer={(
        <>
          <CancelButton />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { studio.resetLayout(); studio.closeDialog(); }}
          >Reset Proyek</button>
        </>
      )}
    >
      <div className="switch-row">
        <div><div className="switch-label">Kosongkan layout</div><div className="switch-sub">Hapus semua desain dari lembar</div></div>
        <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Kosongkan layout" />
      </div>
      <div className="switch-row">
        <div><div className="switch-label">Kembalikan pengaturan kertas</div><div className="switch-sub">Kembali ke default A3 Portrait</div></div>
        <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Kembalikan pengaturan kertas" />
      </div>
    </Dialog>
  );
}

/* ─── 5. upload gambar ────────────────────────────────────────────── */
function UploadDialog({ open }) {
  const studio = useStudio();
  const [over, setOver] = useState(false);
  const [files, setFiles] = useState([]);

  return (
    <Dialog
      id="dlg-upload" open={open} onClose={studio.closeDialog}
      title="Upload Gambar" subtitle="PNG, JPG, atau SVG hingga 20 MB per berkas."
      footer={(
        <>
          <CancelButton />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              studio.toastInline(files.length ? `${files.length} gambar berhasil diunggah.` : '2 gambar berhasil diunggah.', 'ok');
              studio.closeDialog();
              setFiles([]);
            }}
          >Unggah</button>
        </>
      )}
    >
      <div
        className={`dropzone${over ? ' is-over' : ''}`}
        id="upload-drop"
        data-od-id="upload-dropzone"
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); setFiles(Array.from(e.dataTransfer.files)); }}
      >
        <span className="empty-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20V9M7.5 13 12 8.5 16.5 13" /><path d="M5 4h14" /></svg>
        </span>
        <strong>Tarik berkas ke sini</strong>
        <span className="body-muted body-sm">atau pilih berkas dari perangkat</span>
        <button type="button" className="btn btn-secondary btn-sm" id="upload-pick" data-od-id="upload-pick" onClick={() => document.getElementById('upload-input')?.click()}>Pilih File</button>
        <input
          type="file" id="upload-input" multiple accept="image/*" hidden
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </div>
      <div className="stack-xs mt-4">
        <label className="check-row is-checked">
          <span className="box"><Icon name="check" stroke={2.4} /></span>
          <span><span className="check-label">Hapus latar otomatis</span><span className="check-sub">Ganti latar putih dengan transparan</span></span>
        </label>
        <label className="check-row">
          <span className="box"><Icon name="check" stroke={2.4} /></span>
          <span><span className="check-label">Tambahkan langsung ke layout</span><span className="check-sub">Tempatkan otomatis setelah diunggah</span></span>
        </label>
      </div>
    </Dialog>
  );
}

/* ─── 6. ganti gambar ─────────────────────────────────────────────── */
function ReplaceDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-replace" open={open} onClose={studio.closeDialog}
      title="Ganti Gambar" subtitle="Pilih berkas pengganti. Posisi dan skala di layout dipertahankan."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Gambar berhasil diganti.', 'ok'); studio.closeDialog(); }}>Ganti Gambar</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="rp-source">Ambil dari</label>
        <select className="select" id="rp-source" defaultValue="Galeri Desain">
          <option>Galeri Desain</option><option>Perangkat ini</option>
        </select>
      </div>
      <div className="gallery-grid mt-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button type="button" className="gcard is-selected" style={{ padding: 0, border: '1px solid var(--accent)' }}>
          <span className="gcard-art"><span className="pin-art art-blue"><Icon name="cross" /></span></span>
        </button>
        <button type="button" className="gcard" style={{ padding: 0 }}>
          <span className="gcard-art"><span className="pin-art art-green"><Icon name="halfmoon" /></span></span>
        </button>
        <button type="button" className="gcard" style={{ padding: 0 }}>
          <span className="gcard-art"><span className="pin-art art-yellow"><Icon name="star" /></span></span>
        </button>
      </div>
    </Dialog>
  );
}

/* ─── 7. edit gambar ──────────────────────────────────────────────── */
function EditImageDialog({ open }) {
  const studio = useStudio();
  const [bright, setBright] = useState(0);
  const [contrast, setContrast] = useState(10);
  const [sat, setSat] = useState(0);
  const [thresh, setThresh] = useState(0);

  return (
    <Dialog
      id="dlg-edit-image" open={open} onClose={studio.closeDialog} size="lg"
      title="Edit Gambar" subtitle="Penyesuaian diterapkan pada semua salinan desain ini."
      footer={(
        <>
          <button type="button" className="btn btn-ghost foot-left" onClick={() => { setBright(0); setContrast(10); setSat(0); setThresh(0); studio.toastInline('Penyesuaian direset.', 'info'); }}>Reset</button>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Penyesuaian gambar diterapkan.', 'ok'); studio.closeDialog(); }}>Terapkan</button>
        </>
      )}
    >
      <div className="grid-1-2">
        <div className="preview-thumb">
          <span className="pin-art art-ink" style={{ width: 120, height: 120 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 9.5 12 5l6 4.5V19H6z" /></svg>
          </span>
        </div>
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="ei-bright">Kecerahan</label>
            <div className="range-row">
              <input type="range" id="ei-bright" min="-100" max="100" value={bright} onChange={(e) => setBright(Number(e.target.value))} />
              <span className="num">{bright}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-contrast">Kontras</label>
            <div className="range-row">
              <input type="range" id="ei-contrast" min="-100" max="100" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
              <span className="num">{contrast}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-sat">Saturasi</label>
            <div className="range-row">
              <input type="range" id="ei-sat" min="-100" max="100" value={sat} onChange={(e) => setSat(Number(e.target.value))} />
              <span className="num">{sat}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-thresh">Buang latar (ambang)</label>
            <div className="range-row">
              <input type="range" id="ei-thresh" min="0" max="100" value={thresh} onChange={(e) => setThresh(Number(e.target.value))} />
              <span className="num">{thresh}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 8. pengaturan kertas ────────────────────────────────────────── */
function PaperDialog({ open }) {
  const studio = useStudio();
  const { inspector, setInspector } = studio;
  const set = (patch) => setInspector(patch);

  return (
    <Dialog
      id="dlg-paper" open={open} onClose={studio.closeDialog} size="lg"
      title="Pengaturan Kertas" subtitle="Atur ukuran, orientasi, margin, dan jarak susunan."
      footer={(
        <>
          <button type="button" className="btn btn-ghost foot-left" onClick={() => set({ paper: 'a3', orientation: 'portrait', margin: 8, gap: 4, rows: 4, cols: 3 })}>Reset</button>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Pengaturan kertas diterapkan.', 'ok'); studio.closeDialog(); }}>Terapkan</button>
        </>
      )}
    >
      <div className="grid-2">
        <div className="field">
          <label htmlFor="pp-paper">Ukuran kertas</label>
          <select className="select" id="pp-paper" value={inspector.paper} onChange={(e) => set({ paper: e.target.value })}>
            <option value="a4">A4 — 210 × 297 mm</option>
            <option value="a3">A3 — 297 × 420 mm</option>
            <option value="a3p">A3+ — 329 × 483 mm</option>
            <option value="custom">Custom…</option>
          </select>
        </div>
        <div className="field">
          <span className="field-label">Orientasi</span>
          <div className="seg" style={{ width: '100%' }}>
            <button type="button" className={inspector.orientation === 'portrait' ? 'is-active' : undefined} onClick={() => set({ orientation: 'portrait' })}>Portrait</button>
            <button type="button" className={inspector.orientation === 'landscape' ? 'is-active' : undefined} onClick={() => set({ orientation: 'landscape' })}>Landscape</button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-dia">Diameter potong</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-dia" value={inspector.diameter} onChange={(e) => set({ diameter: Number(e.target.value) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-bleed">Bleed</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-bleed" value={inspector.bleed} onChange={(e) => set({ bleed: Number(e.target.value) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-margin">Margin</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-margin" value={inspector.margin} onChange={(e) => set({ margin: Number(e.target.value) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-gap">Jarak antardesain</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-gap" value={inspector.gap} onChange={(e) => set({ gap: Number(e.target.value) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-rows">Jumlah baris</label>
          <input className="input" type="number" id="pp-rows" value={inspector.rows} onChange={(e) => set({ rows: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label htmlFor="pp-cols">Jumlah kolom</label>
          <input className="input" type="number" id="pp-cols" value={inspector.cols} onChange={(e) => set({ cols: Number(e.target.value) })} />
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 9. susun otomatis ───────────────────────────────────────────── */
function AutoArrangeDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-auto" open={open} onClose={studio.closeDialog} size="lg"
      title="Susun Otomatis" subtitle="Sistem menghitung susunan paling efisien untuk semua desain."
      footer={(
        <>
          <button type="button" className="btn btn-ghost foot-left" onClick={() => studio.toastInline('Pratinjau susunan diatur ulang.', 'info')}>Reset</button>
          <button type="button" className="btn btn-secondary" onClick={() => studio.toastInline('Pratinjau layout diperbarui.', 'info')}>Pratinjau Layout</button>
          <CancelButton />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { studio.applyInspector(); studio.toastInline('Layout otomatis diterapkan.', 'ok'); studio.closeDialog(); }}
          >Terapkan Layout</button>
        </>
      )}
    >
      <div className="grid-1-2">
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="au-mode">Mode susun</label>
            <select className="select" id="au-mode" defaultValue="Hemat kertas">
              <option>Hemat kertas</option><option>Grid rapi</option><option>Isi lembar penuh</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="au-pages">Jumlah halaman</label>
            <select className="select" id="au-pages" defaultValue="Otomatis">
              <option>Otomatis</option><option>1 halaman</option><option>2 halaman</option><option>3 halaman</option>
            </select>
          </div>
          <div className="switch-row">
            <div className="switch-label">Izinkan rotasi desain</div>
            <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Izinkan rotasi desain" />
          </div>
          <div className="switch-row">
            <div className="switch-label">Pertahankan posisi terkunci</div>
            <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Pertahankan posisi terkunci" />
          </div>
        </div>
        <div>
          <div className="block-title">Pratinjau Layout</div>
          <div className="auto-preview" id="auto-preview" data-od-id="auto-preview">
            {[8, 38, 68].map((top) => [8, 38, 68].map((left) => (
              <span className="ap-dot" key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }} />
            )))}
          </div>
          <p className="field-help mt-2">9 desain per halaman · efisiensi 94%.</p>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 10/11. atur baris & kolom ───────────────────────────────────── */
function RowsDialog({ open }) {
  const studio = useStudio();
  const { inspector, setInspector } = studio;
  return (
    <Dialog
      id="dlg-rows" open={open} onClose={studio.closeDialog}
      title="Atur Baris" subtitle="Jumlah baris menentukan berapa banyak pin tersusun ke bawah."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Jumlah baris diperbarui.', 'ok'); studio.closeDialog(); }}>Terapkan</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="row-count">Jumlah baris</label>
        <input className="input" type="number" id="row-count" min="1" max="12" value={inspector.rows} onChange={(e) => setInspector({ rows: Number(e.target.value) })} />
      </div>
      <div className="range-row mt-4">
        <input type="range" min="1" max="12" value={inspector.rows} onChange={(e) => setInspector({ rows: Number(e.target.value) })} />
        <span className="num">{inspector.rows}</span>
      </div>
    </Dialog>
  );
}

function ColsDialog({ open }) {
  const studio = useStudio();
  const { inspector, setInspector } = studio;
  return (
    <Dialog
      id="dlg-cols" open={open} onClose={studio.closeDialog}
      title="Atur Kolom" subtitle="Jumlah kolom menentukan berapa banyak pin tersusun ke samping."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Jumlah kolom diperbarui.', 'ok'); studio.closeDialog(); }}>Terapkan</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="col-count">Jumlah kolom</label>
        <input className="input" type="number" id="col-count" min="1" max="12" value={inspector.cols} onChange={(e) => setInspector({ cols: Number(e.target.value) })} />
      </div>
      <div className="range-row mt-4">
        <input type="range" min="1" max="12" value={inspector.cols} onChange={(e) => setInspector({ cols: Number(e.target.value) })} />
        <span className="num">{inspector.cols}</span>
      </div>
    </Dialog>
  );
}

/* ─── 12/13. preset ───────────────────────────────────────────────── */
function NewPresetDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-new-preset" open={open} onClose={studio.closeDialog} size="lg"
      title="Buat Preset" subtitle="Simpan kombinasi kertas, geometri, dan susunan sebagai resep layout."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Preset berhasil disimpan.', 'ok'); studio.closeDialog(); }}>Simpan Preset</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="pre-name">Nama preset</label>
          <input className="input" type="text" id="pre-name" placeholder="Contoh: Grid Rapat A3 58mm" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="pre-paper">Ukuran kertas</label>
            <select className="select" id="pre-paper" defaultValue="A3"><option>A4</option><option>A3</option><option>A3+</option></select>
          </div>
          <div className="field">
            <label htmlFor="pre-dia">Diameter</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-dia" defaultValue="58" />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field"><label htmlFor="pre-rows">Baris</label><input className="input" type="number" id="pre-rows" defaultValue="4" /></div>
          <div className="field"><label htmlFor="pre-cols">Kolom</label><input className="input" type="number" id="pre-cols" defaultValue="3" /></div>
          <div className="field">
            <label htmlFor="pre-gap">Jarak antardesain</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-gap" defaultValue="4" />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="pre-margin">Margin</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-margin" defaultValue="8" />
              <span className="unit">mm</span>
            </div>
          </div>
        </div>
        <label className="check-row is-checked">
          <span className="box"><Icon name="check" stroke={2.4} /></span>
          <span><span className="check-label">Jadikan preset aktif</span></span>
        </label>
      </div>
    </Dialog>
  );
}

function EditPresetDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-edit-preset" open={open} onClose={studio.closeDialog} size="lg"
      title="Edit Preset" subtitle="Ubah resep layout yang sudah tersimpan."
      footer={(
        <>
          <button type="button" className="btn btn-danger foot-left" onClick={() => { studio.toastInline('Preset dihapus.', 'ok'); studio.closeDialog(); }}>Hapus Preset</button>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Preset diperbarui.', 'ok'); studio.closeDialog(); }}>Simpan Perubahan</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="ep-name">Nama preset</label>
          <input className="input" type="text" id="ep-name" defaultValue="Grid Rapat A3" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ep-dia">Diameter</label>
            <div className="input-unit">
              <input className="input" type="number" id="ep-dia" defaultValue="58" />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ep-gap">Jarak antardesain</label>
            <div className="input-unit">
              <input className="input" type="number" id="ep-gap" defaultValue="4" />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field"><label htmlFor="ep-rows">Baris</label><input className="input" type="number" id="ep-rows" defaultValue="4" /></div>
          <div className="field"><label htmlFor="ep-cols">Kolom</label><input className="input" type="number" id="ep-cols" defaultValue="3" /></div>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 14. pulihkan versi ──────────────────────────────────────────── */
function RestoreDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-restore" open={open} onClose={studio.closeDialog} size="lg"
      title="Pulihkan Versi" subtitle="Pilih titik simpan otomatis untuk dikembalikan."
      bodyStyle={{ padding: 0 }}
      footer={<button type="button" className="btn btn-secondary" onClick={studio.closeDialog}>Tutup</button>}
    >
      <table className="ds-table">
        <tbody>
          {RESTORE_VERSIONS.map((v) => (
            <tr key={v.id}>
              <td>
                <strong>{v.time}</strong>
                <div className="meta">{v.meta}</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { studio.toastInline(`Versi ${v.time.replace('Hari ini, ', '')} dipulihkan.`, 'ok'); studio.closeDialog(); }}
                >Pulihkan</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

/* ─── 15. impor ───────────────────────────────────────────────────── */
function ImportDialog({ open }) {
  const studio = useStudio();
  return (
    <Dialog
      id="dlg-import" open={open} onClose={studio.closeDialog}
      title="Impor Proyek" subtitle="Pulihkan proyek dari berkas cadangan .pinzip."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" onClick={() => { studio.toastInline('Proyek berhasil diimpor.', 'ok'); studio.closeDialog(); }}>Impor</button>
        </>
      )}
    >
      <div className="dropzone">
        <span className="empty-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v10M8.5 10.5 12 14l3.5-3.5" /><path d="M5 18h14" /></svg>
        </span>
        <strong>Pilih berkas .pinzip</strong>
        <span className="body-muted body-sm">Ukuran maksimum 200 MB</span>
        <button type="button" className="btn btn-secondary btn-sm">Pilih File</button>
      </div>
    </Dialog>
  );
}

/* ─── 16. cadangan ────────────────────────────────────────────────── */
function BackupDialog({ open }) {
  const studio = useStudio();
  const { backupProgress, startBackup } = studio;
  return (
    <Dialog
      id="dlg-backup" open={open} onClose={studio.closeDialog}
      title="Ekspor Cadangan" subtitle="Simpan seluruh proyek ke satu berkas untuk dipindahkan."
      footer={(
        <>
          <CancelButton />
          <button type="button" className="btn btn-primary" data-od-id="btn-start-backup" onClick={startBackup}>Ekspor Cadangan</button>
        </>
      )}
    >
      <div className="switch-row">
        <div className="switch-label">Sertakan berkas gambar</div>
        <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Sertakan berkas gambar" />
      </div>
      <div className="switch-row">
        <div className="switch-label">Sertakan riwayat versi</div>
        <button type="button" className="switch" role="switch" aria-checked="false" aria-label="Sertakan riwayat versi" />
      </div>
      <Progress className="mt-4" progress={backupProgress || { pct: 0, note: 'Menyiapkan…' }} />
    </Dialog>
  );
}

/* ─── 17. ekspor ──────────────────────────────────────────────────── */
function ExportDialog({ open }) {
  const studio = useStudio();
  const { exportProgress, startExport, sheetTotal } = studio;
  const [format, setFormat] = useState('PDF (siap cetak)');

  const label = format === 'PNG' ? 'PNG' : 'PDF';

  return (
    <Dialog
      id="dlg-export" open={open} onClose={studio.closeDialog} size="lg"
      title="Pengaturan Ekspor" subtitle="Pilih format, halaman, dan resolusi keluaran."
      footer={(
        <>
          <button type="button" className="btn btn-ghost foot-left" id="export-cancel" hidden>Batal Ekspor</button>
          <CancelButton />
          <button type="button" className="btn btn-secondary" data-od-id="btn-export-png-2" onClick={() => startExport(EXPORT_NOTES, 'PNG')}>Ekspor PNG</button>
          <button type="button" className="btn btn-primary" data-od-id="btn-start-export" onClick={() => startExport(EXPORT_NOTES, label)}>{`Ekspor ${label}`}</button>
        </>
      )}
    >
      <div className="grid-2">
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="ex-format">Format</label>
            <select className="select" id="ex-format" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>PDF (siap cetak)</option><option>PNG</option><option>PDF + PNG</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ex-dpi">Resolusi</label>
            <select className="select" id="ex-dpi" defaultValue="300 DPI">
              <option>150 DPI</option><option>300 DPI</option><option>600 DPI</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ex-pages">Halaman</label>
            <select className="select" id="ex-pages" defaultValue={`Semua halaman (${sheetTotal})`}>
              <option>{'Semua halaman (' + sheetTotal + ')'}</option>
              <option>Halaman aktif saja</option>
              <option>Pilih manual…</option>
            </select>
          </div>
        </div>
        <div className="stack-sm">
          <div className="switch-row">
            <div className="switch-label">Tanda potong</div>
            <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Tanda potong" />
          </div>
          <div className="switch-row">
            <div className="switch-label">Garis bleed</div>
            <button type="button" className="switch is-on" role="switch" aria-checked="true" aria-label="Garis bleed" />
          </div>
          <div className="switch-row">
            <div className="switch-label">Nomor desain</div>
            <button type="button" className="switch" role="switch" aria-checked="false" aria-label="Nomor desain" />
          </div>
          <div className="switch-row">
            <div className="switch-label">Latar transparan (PNG)</div>
            <button type="button" className="switch" role="switch" aria-checked="false" aria-label="Latar transparan" />
          </div>
        </div>
      </div>

      <Progress className="mt-5" progress={exportProgress || { pct: 0, note: 'Menyiapkan…' }} />
      <p className="field-help mt-3" id="export-estimate">{`Perkiraan ukuran berkas: 4,2 MB · ${sheetTotal} halaman`}</p>
    </Dialog>
  );
}

/* ─── 18. konfirmasi ──────────────────────────────────────────────── */
function ConfirmDialog({ open }) {
  const studio = useStudio();
  const { confirm, resolveConfirm } = studio;
  return (
    <Dialog
      id="dlg-confirm" open={open} onClose={() => studio.closeDialog()} alert
      title="Konfirmasi"
      subtitle={confirm?.message || 'Anda yakin ingin melanjutkan?'}
      subtitleId="confirm-msg"
      bodyId="confirm-body"
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={studio.closeDialog}>Batal</button>
          <button type="button" className="btn btn-primary" id="confirm-ok" onClick={resolveConfirm}>Ya, Lanjutkan</button>
        </>
      )}
    >
      {confirm?.note ? <p className="body-sm muted" style={{ margin: 0 }}>{confirm.note}</p> : null}
    </Dialog>
  );
}

void Foot;