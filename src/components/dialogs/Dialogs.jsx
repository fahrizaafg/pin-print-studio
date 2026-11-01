import { useRef, useState } from 'react';
import Dialog from './Dialog.jsx';
import { useStudio } from '../../state/StudioContext.jsx';
import { PAPER_LABEL } from '../../data/studioData.js';
import { readFileText } from '../../lib/format.js';
import { store } from '../../lib/storage.js';
import { Progress } from '../ui/primitives.jsx';
import { Icon } from '../ui/icons.jsx';

/* Nilai select "Mulai dari" pada dialog proyek baru. */
const PRESET_OPTIONS = [
  { value: 'empty', label: 'Kanvas kosong' },
  { value: 'preset-1', label: 'Preset Grid Rapat A3' },
  { value: 'preset-2', label: 'Preset Hemat A4 38mm' },
  { value: 'last', label: 'Duplikat proyek terakhir' },
];

const PAPER_OPTIONS = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'a3p', label: 'A3+' },
];

/*
 * Form lokal yang selalu segar tiap dialog dibuka: null berarti "pakai nilai
 * awal", sehingga tidak perlu effect reset dan tidak ada state basi.
 */
function useDraft(initial, closeDialog) {
  const [draft, setDraft] = useState(null);
  const value = draft === null ? initial() : draft;
  /* Pembaruan fungsional: dua perubahan dalam satu tick tidak saling menimpa. */
  const set = (patch) => setDraft((prev) => ({ ...(prev === null ? initial() : prev), ...patch }));
  const close = () => { setDraft(null); closeDialog(); };
  return [value, set, close];
}

export default function Dialogs() {
  const studio = useStudio();
  const isOpen = (id) => studio.dialog === id;

  return (
    <>
      <NewProjectDialog open={isOpen('dlg-new-project')} />
      <OpenProjectDialog open={isOpen('dlg-open-project')} />
      <DuplicateProjectDialog open={isOpen('dlg-duplicate-project')} />
      <UploadDialog open={isOpen('dlg-upload')} />
      <ReplaceDialog open={isOpen('dlg-replace')} />
      <EditImageDialog open={isOpen('dlg-edit-image')} />
      <PaperDialog open={isOpen('dlg-paper')} />
      <DuplicateBulkDialog open={isOpen('dlg-duplicate-bulk')} />
      <Crop11Dialog open={isOpen('dlg-crop11')} />
      <NewPresetDialog open={isOpen('dlg-new-preset')} />
      <EditPresetDialog open={isOpen('dlg-edit-preset')} />
      <RestoreDialog open={isOpen('dlg-restore')} />
      <ImportDialog open={isOpen('dlg-import')} />
      <BackupDialog open={isOpen('dlg-backup')} />
      <ExportDialog open={isOpen('dlg-export')} />
      <ConfirmDialog open={isOpen('dlg-confirm')} />
      <RenameDialog open={isOpen('dlg-rename')} />
    </>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────── */
function CancelButton({ onClick }) {
  const { closeDialog } = useStudio();
  return <button type="button" className="btn btn-secondary" onClick={onClick || closeDialog}>Batal</button>;
}

function RenameDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ name: studio.projectName || '' }),
    studio.closeDialog,
  );

  const save = () => {
    const clean = String(form.name || '').trim();
    if (!clean) {
      studio.notify('Nama proyek tidak boleh kosong.', 'err');
      return;
    }
    studio.renameProject(clean);
    close();
  };

  return (
    <Dialog
      id="dlg-rename" open={open} onClose={close}
      title="Ganti Nama Proyek" subtitle="Beri nama yang mudah dikenali di riwayat."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" data-od-id="btn-rename-save" onClick={save}>Simpan Nama</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="rn-name">Nama proyek</label>
        <input
          className="input" type="text" id="rn-name" data-od-id="rename-input"
          placeholder="Contoh: Pin Wisuda 2026" value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        />
      </div>
    </Dialog>
  );
}

/* ─── 1. proyek baru ──────────────────────────────────────────────── */
function NewProjectDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ name: '', preset: 'preset-1', paper: 'a3' }),
    studio.closeDialog,
  );

  const create = () => {
    studio.createProject(form.name.trim() || 'Proyek Tanpa Judul', { paper: form.paper, preset: form.preset });
    close();
  };

  return (
    <Dialog
      id="dlg-new-project" open={open} onClose={close}
      title="Proyek Baru" subtitle="Mulai lembar kerja kosong dengan preset yang diinginkan."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={create}>Buat Proyek</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="np-name">Nama proyek</label>
          <input className="input" type="text" id="np-name" placeholder="Contoh: Pin Wisuda 2026" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="np-preset">Mulai dari</label>
          <select className="select" id="np-preset" value={form.preset} onChange={(e) => set({ preset: e.target.value })}>
            {PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-paper">Ukuran kertas</label>
          <select className="select" id="np-paper" value={form.paper} onChange={(e) => set({ paper: e.target.value })}>
            {PAPER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 2. buka proyek ──────────────────────────────────────────────── */
function OpenProjectDialog({ open }) {
  const studio = useStudio();
  const projects = studio.projects;

  return (
    <Dialog
      id="dlg-open-project" open={open} onClose={studio.closeDialog} size="lg"
      title="Buka Proyek" subtitle={'Pilih dari ' + projects.length + ' proyek tersimpan di perangkat ini.'}
      bodyStyle={{ padding: 0 }}
      footer={(
        <>
          <button type="button" className="btn btn-secondary foot-left" onClick={() => studio.openDialog('dlg-import')}>Impor Proyek…</button>
          <button type="button" className="btn btn-secondary" onClick={studio.closeDialog}>Tutup</button>
        </>
      )}
    >
      <table className="ds-table">
        <tbody>
          {projects.map((p) => (
            <tr className="is-pickable" key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <div className="meta">{p.paper + ' · ' + p.designs + ' desain · ' + p.changed + ' · ' + p.size}</div>
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => studio.openProject(p.name)}>Buka</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => studio.duplicateProject(p.id)}>Duplikat</button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => studio.requestConfirm({
                    message: 'Hapus proyek ' + p.name + '?',
                    note: 'Proyek akan dihapus dari riwayat perangkat ini.',
                    toast: 'Proyek dihapus dari riwayat.',
                    onConfirm: () => studio.removeProject(p.id),
                  })}
                >Hapus</button>
              </td>
            </tr>
          ))}
          {projects.length === 0 ? (
            <tr>
              <td colSpan={2}><div className="meta">Belum ada proyek tersimpan.</div></td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </Dialog>
  );
}

/* ─── 3. duplikat proyek ──────────────────────────────────────────── */
function DuplicateProjectDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ name: studio.projectName + ' (salinan)', withImages: true }),
    studio.closeDialog,
  );

  const duplicate = () => {
    const title = form.name.trim() || studio.projectName + ' (salinan)';
    const source = studio.projects.find((p) => p.name === studio.projectName);
    if (source) studio.duplicateProject(source.id, title);
    else studio.createProject(title, { paper: studio.inspector.paper, preset: 'empty' });
    close();
  };

  return (
    <Dialog
      id="dlg-duplicate-project" open={open} onClose={close}
      title="Duplikat Proyek" subtitle="Buat salinan tanpa mengubah proyek asli."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={duplicate}>Duplikat</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="dp-name">Nama salinan</label>
        <input className="input" type="text" id="dp-name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="switch-row mt-4">
        <div>
          <div className="switch-label">Sertakan gambar</div>
          <div className="switch-sub">Salin juga berkas gambar yang digunakan</div>
        </div>
        <button
          type="button"
          className={'switch' + (form.withImages ? ' is-on' : '')}
          role="switch"
          aria-checked={form.withImages}
          aria-label="Sertakan gambar"
          onClick={() => set({ withImages: !form.withImages })}
        />
      </div>
    </Dialog>
  );
}

/* ─── 5. upload gambar ────────────────────────────────────────────── */
function UploadDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ over: false, files: [], toLayout: false }),
    studio.closeDialog,
  );

  const upload = async () => {
    if (!form.files.length) {
      studio.notify('Pilih berkas gambar terlebih dahulu.', 'err');
      return;
    }
    await studio.addAssets(form.files, { toLayout: form.toLayout });
    close();
  };

  return (
    <Dialog
      id="dlg-upload" open={open} onClose={close}
      title="Upload Gambar" subtitle="PNG, JPG, atau SVG hingga 20 MB per berkas."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button
            type="button"
            className="btn btn-primary"
            disabled={form.files.length === 0}
            onClick={upload}
          >Unggah</button>
        </>
      )}
    >
      <div
        className={'dropzone' + (form.over ? ' is-over' : '')}
        id="upload-drop"
        data-od-id="upload-dropzone"
        onDragOver={(e) => { e.preventDefault(); set({ over: true }); }}
        onDragEnter={(e) => { e.preventDefault(); set({ over: true }); }}
        onDragLeave={(e) => { e.preventDefault(); set({ over: false }); }}
        onDrop={(e) => { e.preventDefault(); set({ over: false, files: Array.from(e.dataTransfer.files) }); }}
      >
        <span className="empty-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20V9M7.5 13 12 8.5 16.5 13" /><path d="M5 4h14" /></svg>
        </span>
        <strong>Tarik berkas ke sini</strong>
        <span className="body-muted body-sm">
          {form.files.length ? form.files.length + ' berkas siap diunggah' : 'atau pilih berkas dari perangkat'}
        </span>
        <button type="button" className="btn btn-secondary btn-sm" id="upload-pick" data-od-id="upload-pick" onClick={() => document.getElementById('upload-input')?.click()}>Pilih File</button>
        <input
          type="file" id="upload-input" multiple accept="image/*" hidden
          onChange={(e) => set({ files: Array.from(e.target.files || []) })}
        />
      </div>
      <div className="stack-xs mt-4">
        <label className={'check-row' + (form.toLayout ? ' is-checked' : '')} onClick={() => set({ toLayout: !form.toLayout })}>
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
  const cards = studio.galleryCards.slice(0, 6);
  const [form, set, close] = useDraft(
    () => ({ assetId: cards.length ? cards[0].id : null }),
    studio.closeDialog,
  );

  const replace = () => {
    if (!form.assetId) {
      studio.notify('Pilih gambar pengganti terlebih dahulu.', 'err');
      return;
    }
    if (studio.replaceSelectedWithAsset(form.assetId)) close();
  };

  return (
    <Dialog
      id="dlg-replace" open={open} onClose={close}
      title="Ganti Gambar" subtitle="Pilih berkas pengganti. Posisi dan skala di layout dipertahankan."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={replace}>Ganti Gambar</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="rp-source">Ambil dari</label>
        <select className="select" id="rp-source" value="Galeri Desain" disabled title="Sumber gambar saat ini hanya Galeri Desain">
          <option>Galeri Desain</option>
        </select>
        <p className="field-help">Sumber “Perangkat ini” belum tersedia — gunakan Upload Gambar untuk menambah berkas baru.</p>
      </div>
      <div className="gallery-grid mt-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={'gcard' + (card.id === form.assetId ? ' is-selected' : '')}
            style={card.id === form.assetId ? { padding: 0, border: '1px solid var(--accent)' } : { padding: 0 }}
            aria-pressed={card.id === form.assetId}
            aria-label={card.name}
            onClick={() => set({ assetId: card.id })}
          >
            <span className="gcard-art">
              <span className={'pin-art ' + card.art}>
                {card.url ? <img src={card.url} alt={card.name} /> : <Icon name={card.icon} />}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}

/* ─── 7. edit gambar ──────────────────────────────────────────────── */
function EditImageDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ bright: 0, contrast: 10, sat: 0, thresh: 0 }),
    studio.closeDialog,
  );

  const apply = () => {
    if (!studio.selectedPinId) {
      studio.notify('Pilih desain pada lembar terlebih dahulu.', 'err');
      return;
    }
    studio.applySelectedImage({
      brightness: Number(form.bright),
      contrast: Number(form.contrast),
      saturation: Number(form.sat),
      threshold: Number(form.thresh),
    });
    studio.notify('Penyesuaian gambar diterapkan.', 'ok');
    close();
  };

  return (
    <Dialog
      id="dlg-edit-image" open={open} onClose={close} size="lg"
      title="Edit Gambar" subtitle="Penyesuaian diterapkan pada semua salinan desain ini."
      footer={(
        <>
          <button
            type="button"
            className="btn btn-ghost foot-left"
            onClick={() => { set({ bright: 0, contrast: 10, sat: 0, thresh: 0 }); studio.notify('Penyesuaian direset.', 'info'); }}
          >Reset</button>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={apply}>Terapkan</button>
        </>
      )}
    >
      <div className="grid-1-2">
        <div className="preview-thumb">
          {(() => {
            const pin = studio.pins.find((p) => p.id === studio.selectedPinId);
            const filter = [
              form.bright ? `brightness(${100 + Number(form.bright)}%)` : '',
              form.contrast !== 10 ? `contrast(${100 + (Number(form.contrast) - 10)}%)` : '',
              form.sat ? `saturate(${100 + Number(form.sat)}%)` : '',
            ].filter(Boolean).join(' ') || undefined;
            if (!pin) {
              return <p className="body-sm muted">Pilih desain pada lembar terlebih dahulu untuk melihat pratinjau.</p>;
            }
            return (
              <span className={`pin-art ${pin.art || 'art-ink'}`} style={{ width: 120, height: 120 }}>
                {pin.url ? <img src={pin.url} alt={pin.label} style={{ filter }} /> : <span style={{ filter, display: 'contents' }}><Icon name={pin.icon} /></span>}
              </span>
            );
          })()}
        </div>
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="ei-bright">Kecerahan</label>
            <div className="range-row">
              <input type="range" id="ei-bright" min="-100" max="100" value={form.bright} onChange={(e) => set({ bright: Number(e.target.value) })} />
              <span className="num">{form.bright}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-contrast">Kontras</label>
            <div className="range-row">
              <input type="range" id="ei-contrast" min="-100" max="100" value={form.contrast} onChange={(e) => set({ contrast: Number(e.target.value) })} />
              <span className="num">{form.contrast}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-sat">Saturasi</label>
            <div className="range-row">
              <input type="range" id="ei-sat" min="-100" max="100" value={form.sat} onChange={(e) => set({ sat: Number(e.target.value) })} />
              <span className="num">{form.sat}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ei-thresh">Buang latar (ambang)</label>
            <div className="range-row">
              <input type="range" id="ei-thresh" min="0" max="100" value={form.thresh} onChange={(e) => set({ thresh: Number(e.target.value) })} />
              <span className="num">{form.thresh}</span>
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
          <button type="button" className="btn btn-primary" onClick={() => { studio.applyInspector(); studio.closeDialog(); }}>Terapkan</button>
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
          <label htmlFor="pp-margin">Margin</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-margin" min="0" value={inspector.margin} onChange={(e) => set({ margin: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-gap">Jarak antardesain</label>
          <div className="input-unit">
            <input className="input" type="number" id="pp-gap" min="0" value={inspector.gap} onChange={(e) => set({ gap: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="unit">mm</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pp-rows">Jumlah baris</label>
          <input className="input" type="number" id="pp-rows" min="1" value={inspector.rows} onChange={(e) => set({ rows: Math.max(1, Number(e.target.value) || 1) })} />
        </div>
        <div className="field">
          <label htmlFor="pp-cols">Jumlah kolom</label>
          <input className="input" type="number" id="pp-cols" min="1" value={inspector.cols} onChange={(e) => set({ cols: Math.max(1, Number(e.target.value) || 1) })} />
        </div>
      </div>
    </Dialog>
  );
}

function DuplicateBulkDialog({ open }) {
  const studio = useStudio();
  const pack = studio.packingInfo || { colsFit: 0, rowsFit: 0, total: 0, used: 0, free: 0 };
  const capacity = Math.max(0, Math.min(200, pack.free));
  const [form, set, close] = useDraft(
    () => ({ mode: 'count', count: 12 }),
    studio.closeDialog,
  );

  const apply = () => {
    const raw = form.mode === 'max' ? capacity : Number(form.count);
    if (!raw || raw <= 0) {
      studio.notify(
        pack.total === 0
          ? 'Tidak ada yang muat — pin terlalu besar untuk margin/jarak saat ini.'
          : 'Tidak ada slot kosong / jumlah tidak valid.',
        'err',
      );
      return;
    }
    studio.duplicateSelectedPinCount(Math.min(raw, capacity || raw));
    close();
  };

  return (
    <Dialog
      id="dlg-duplicate-bulk" open={open} onClose={close}
      title="Duplikat Banyak" subtitle="Gandakan desain terpilih sekaligus untuk pesanan banyak."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={apply}>Tambahkan</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="seg" style={{ width: '100%' }}>
          <button type="button" className={form.mode === 'count' ? 'is-active' : undefined} onClick={() => set({ mode: 'count' })}>Pilih jumlah</button>
          <button type="button" className={form.mode === 'max' ? 'is-active' : undefined} onClick={() => set({ mode: 'max' })}>Maksimal 1 kertas</button>
        </div>
        {form.mode === 'count' ? (
          <div className="field">
            <label htmlFor="dup-count">Jumlah salinan</label>
            <div className="input-unit">
              <input className="input" type="number" id="dup-count" min="1" max={Math.max(1, capacity)} value={form.count} onChange={(e) => set({ count: Number(e.target.value) })} />
              <span className="unit">pcs</span>
            </div>
            <p className="field-help">Ruang tersisa: <strong>{pack.free}</strong> slot (grid {pack.colsFit}×{pack.rowsFit} muat {pack.total}, terisi {pack.used}).</p>
          </div>
        ) : (
          <p className="field-help">Akan menambah <strong>{capacity}</strong> salinan (grid {pack.colsFit}×{pack.rowsFit} muat {pack.total} − terisi {pack.used}, sisa {pack.free}).</p>
        )}
      </div>
    </Dialog>
  );
}

function Crop11Content({ current, queueLength, close, skip, skipAll }) {
  const studio = useStudio();
  const [form, setForm] = useState({ zoom: 100, x: 50, y: 50 });
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const drag = useRef(null);

  const isSquare = dims.w > 0 && dims.h > 0 && Math.abs(dims.w - dims.h) / Math.max(dims.w, dims.h) < 0.02;

  const apply = () => {
    studio.addCroppedPin(current, { x: form.x, y: form.y, zoom: form.zoom, locked: isSquare });
  };

  const onPanStart = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drag.current = { sx: e.clientX, sy: e.clientY, x: form.x, y: form.y, id: e.pointerId };
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onPanMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (e.cancelable) e.preventDefault();
    const dx = ((e.clientX - d.sx) / 240) * 100;
    const dy = ((e.clientY - d.sy) / 240) * 100;
    setForm((f) => ({ ...f, x: Math.max(0, Math.min(100, d.x - dx)), y: Math.max(0, Math.min(100, d.y - dy)) }));
  };
  const onPanEnd = (e) => {
    drag.current = null;
    try {
      const id = e?.pointerId;
      if (id !== undefined) e?.currentTarget?.releasePointerCapture?.(id);
    } catch { /* noop */ }
  };

  return (
    <Dialog
      id="dlg-crop11" open={true} onClose={close} size="lg"
      title="Crop 1:1" subtitle={`Atur posisi foto dalam lingkaran (${queueLength} tersisa: ${current.name}).`}
      footer={(
        <>
          <button type="button" className="btn btn-ghost foot-left" onClick={skip}>Lewati</button>
          <CancelButton onClick={skipAll} />
          <button type="button" className="btn btn-primary" data-od-id="btn-crop11-apply" onClick={apply}>
            {isSquare ? 'Masukkan Terkunci' : 'Terapkan & Lanjut'}
          </button>
        </>
      )}
    >
      <div className="grid-1-2">
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div
            data-od-id="crop11-mask"
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
            onPointerCancel={onPanEnd}
            onLostPointerCapture={onPanEnd}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', cursor: 'grab', touchAction: 'none', background: 'var(--surface)', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          >
            {current.url ? (
              <img
                src={current.url} alt={current.name} draggable={false}
                onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onDragStart={(e) => e.preventDefault()}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${form.x}% ${form.y}%`, transform: `scale(${form.zoom / 100})`, pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              />
            ) : (
              <span className={`pin-art ${current.art}`} style={{ width: '100%', height: '100%', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }} />
            )}
          </div>
          {isSquare
            ? <p className="field-help mt-2">Sudah 1:1 — akan masuk dalam keadaan terkunci (tidak bisa digeser).</p>
            : <p className="field-help mt-2">Geser foto di lingkaran, atur zoom sampai pas.</p>}
        </div>
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="crop11-zoom">Zoom crop</label>
            <div className="range-row">
              <input type="range" id="crop11-zoom" min="100" max="300" value={form.zoom} onChange={(e) => setForm((f) => ({ ...f, zoom: Number(e.target.value) }))} />
              <span className="num">{form.zoom}%</span>
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ zoom: 100, x: 50, y: 50 })}>Reset Crop</button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── crop 1:1 sebelum masuk layout ───────────────────────────────── */
function Crop11Dialog({ open }) {
  const studio = useStudio();
  const queue = studio.cropQueue || [];
  const current = queue[0];

  const close = () => {
    studio.closeDialog();
  };
  const skip = () => {
    studio.shiftCropQueue();
  };
  const skipAll = () => {
    const n = (studio.cropQueue || []).length;
    for (let i = 0; i < n; i += 1) studio.shiftCropQueue();
    studio.closeDialog();
  };

  if (!open) return null;
  if (!current) {
    return (
      <Dialog id="dlg-crop11" open={open} onClose={close} title="Crop 1:1" subtitle="Semua desain sudah diproses.">
        <p className="field-help">Tidak ada antrean crop.</p>
      </Dialog>
    );
  }

  return (
    <Crop11Content
      key={current.id}
      current={current}
      queueLength={queue.length}
      close={close}
      skip={skip}
      skipAll={skipAll}
    />
  );
}

/* ─── 12/13. preset ───────────────────────────────────────────────── */
function NewPresetDialog({ open }) {
  const studio = useStudio();
  const [form, set, close] = useDraft(
    () => ({ title: '', paper: 'a3', diameter: 58, rows: 4, cols: 3, gap: 4, margin: 8, makeActive: true }),
    studio.closeDialog,
  );

  const save = () => {
    const geometry = {
      paper: form.paper,
      diameter: Number(form.diameter),
      rows: Number(form.rows),
      cols: Number(form.cols),
      gap: Number(form.gap),
      margin: Number(form.margin),
    };
    studio.addPreset({ title: form.title.trim() || 'Preset Baru', ...geometry });
    if (form.makeActive) {
      studio.setInspector(geometry);
      studio.applyInspector();
    }
    close();
  };

  return (
    <Dialog
      id="dlg-new-preset" open={open} onClose={close} size="lg"
      title="Buat Preset" subtitle="Simpan kombinasi kertas, geometri, dan susunan sebagai resep layout."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={save}>Simpan Preset</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="pre-name">Nama preset</label>
          <input className="input" type="text" id="pre-name" placeholder="Contoh: Grid Rapat A3 58mm" value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="pre-paper">Ukuran kertas</label>
            <select className="select" id="pre-paper" value={form.paper} onChange={(e) => set({ paper: e.target.value })}>
              {PAPER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pre-dia">Diameter</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-dia" value={form.diameter} onChange={(e) => set({ diameter: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field"><label htmlFor="pre-rows">Baris</label><input className="input" type="number" id="pre-rows" value={form.rows} onChange={(e) => set({ rows: e.target.value })} /></div>
          <div className="field"><label htmlFor="pre-cols">Kolom</label><input className="input" type="number" id="pre-cols" value={form.cols} onChange={(e) => set({ cols: e.target.value })} /></div>
          <div className="field">
            <label htmlFor="pre-gap">Jarak antardesain</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-gap" value={form.gap} onChange={(e) => set({ gap: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="pre-margin">Margin</label>
            <div className="input-unit">
              <input className="input" type="number" id="pre-margin" value={form.margin} onChange={(e) => set({ margin: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
        </div>
        <label className={'check-row' + (form.makeActive ? ' is-checked' : '')} onClick={() => set({ makeActive: !form.makeActive })}>
          <span className="box"><Icon name="check" stroke={2.4} /></span>
          <span><span className="check-label">Jadikan preset aktif</span></span>
        </label>
      </div>
    </Dialog>
  );
}

function EditPresetDialog({ open }) {
  const studio = useStudio();
  /* TemplatesPage menyimpan id preset ke store('editPreset') sebelum membuka dialog. */
  const activeId = store.get('editPreset', null);
  const active = studio.presets.find((p) => p.id === activeId);
  const geometry = (active && active.geometry) || {};
  const [form, set, close] = useDraft(
    () => ({
      title: active ? active.title : 'Preset Baru',
      paper: geometry.paper || 'a3',
      diameter: geometry.diameter ?? 58,
      rows: geometry.rows ?? 4,
      cols: geometry.cols ?? 3,
      gap: geometry.gap ?? 4,
      margin: geometry.margin ?? 8,
    }),
    studio.closeDialog,
  );

  const save = () => {
    if (!activeId || !active) {
      studio.notify('Preset tidak ditemukan.', 'err');
      return;
    }
    studio.updatePreset(activeId, {
      title: form.title.trim() || 'Preset Baru',
      meta: (PAPER_LABEL[form.paper] || 'A3') + ' · ' + Number(form.diameter) + 'mm',
      body: Number(form.rows) + ' baris × ' + Number(form.cols) + ' kolom, jarak '
        + Number(form.gap) + ' mm, margin ' + Number(form.margin) + ' mm.',
      geometry: {
        ...geometry,
        paper: form.paper,
        diameter: Number(form.diameter),
        rows: Number(form.rows),
        cols: Number(form.cols),
        gap: Number(form.gap),
        margin: Number(form.margin),
      },
    });
    close();
  };

  const remove = () => {
    if (!activeId) {
      studio.notify('Preset tidak ditemukan.', 'err');
      return;
    }
    studio.requestConfirm({
      message: 'Hapus preset ini?',
      note: 'Preset akan dihapus dari daftar resep layout.',
      toast: 'Preset dihapus.',
      onConfirm: () => { studio.removePreset(activeId); studio.closeDialog(); },
    });
  };

  return (
    <Dialog
      id="dlg-edit-preset" open={open} onClose={close} size="lg"
      title="Edit Preset" subtitle="Ubah resep layout yang sudah tersimpan."
      footer={(
        <>
          <button type="button" className="btn btn-danger foot-left" onClick={remove}>Hapus Preset</button>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={save}>Simpan Perubahan</button>
        </>
      )}
    >
      <div className="stack-sm">
        <div className="field">
          <label htmlFor="ep-name">Nama preset</label>
          <input className="input" type="text" id="ep-name" value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ep-paper">Ukuran kertas</label>
            <select className="select" id="ep-paper" value={form.paper} onChange={(e) => set({ paper: e.target.value })}>
              {PAPER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ep-dia">Diameter</label>
            <div className="input-unit">
              <input className="input" type="number" id="ep-dia" value={form.diameter} onChange={(e) => set({ diameter: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ep-gap">Jarak antardesain</label>
            <div className="input-unit">
              <input className="input" type="number" id="ep-gap" value={form.gap} onChange={(e) => set({ gap: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="ep-margin">Margin</label>
            <div className="input-unit">
              <input className="input" type="number" id="ep-margin" value={form.margin} onChange={(e) => set({ margin: e.target.value })} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field"><label htmlFor="ep-rows">Baris</label><input className="input" type="number" id="ep-rows" value={form.rows} onChange={(e) => set({ rows: e.target.value })} /></div>
          <div className="field"><label htmlFor="ep-cols">Kolom</label><input className="input" type="number" id="ep-cols" value={form.cols} onChange={(e) => set({ cols: e.target.value })} /></div>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── 14. pulihkan versi ──────────────────────────────────────────── */
function RestoreDialog({ open }) {
  const studio = useStudio();
  const versions = studio.versions;

  return (
    <Dialog
      id="dlg-restore" open={open} onClose={studio.closeDialog} size="lg"
      title="Pulihkan Versi" subtitle="Pilih titik simpan otomatis untuk dikembalikan."
      bodyStyle={{ padding: 0 }}
      footer={<button type="button" className="btn btn-secondary" onClick={studio.closeDialog}>Tutup</button>}
    >
      <table className="ds-table">
        <tbody>
          {versions.map((v) => (
            <tr key={v.id}>
              <td>
                <strong>{v.time}</strong>
                <div className="meta">{v.meta}</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { studio.restoreVersion(v.id); studio.closeDialog(); }}
                >Pulihkan</button>
              </td>
            </tr>
          ))}
          {versions.length === 0 ? (
            <tr>
              <td colSpan={2}><div className="meta">Belum ada versi tersimpan.</div></td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </Dialog>
  );
}

/* ─── 15. impor ───────────────────────────────────────────────────── */
function ImportDialog({ open }) {
  const studio = useStudio();
  const inputRef = useRef(null);
  const [form, set, close] = useDraft(() => ({ file: null }), studio.closeDialog);

  const openPicker = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const runImport = async () => {
    if (!form.file) {
      openPicker();
      return;
    }
    try {
      const text = await readFileText(form.file);
      if (studio.importBackup(text)) close();
      else studio.notify('Berkas cadangan tidak valid.', 'err');
    } catch {
      studio.notify('Berkas cadangan tidak dapat dibaca.', 'err');
    }
  };

  return (
    <Dialog
      id="dlg-import" open={open} onClose={close}
      title="Impor Proyek" subtitle="Pulihkan proyek dari berkas cadangan .pinzip."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" onClick={runImport}>Impor</button>
        </>
      )}
    >
      <div
        className="dropzone"
        id="import-drop"
        data-od-id="import-dropzone"
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files && e.dataTransfer.files[0];
          if (dropped) set({ file: dropped });
        }}
      >
        <span className="empty-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v10M8.5 10.5 12 14l3.5-3.5" /><path d="M5 18h14" /></svg>
        </span>
        <strong>{form.file ? form.file.name : 'Pilih berkas .pinzip'}</strong>
        <span className="body-muted body-sm">
          {form.file ? 'Siap diimpor — tekan Impor untuk melanjutkan' : 'Ukuran maksimum 200 MB'}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); openPicker(); }}
        >Pilih File</button>
        <input
          ref={inputRef}
          type="file"
          id="import-input"
          accept=".pinzip,.json"
          hidden
          onChange={(e) => {
            const picked = e.target.files && e.target.files[0];
            if (picked) set({ file: picked });
            e.target.value = '';
          }}
        />
      </div>
    </Dialog>
  );
}

/* ─── 16. cadangan ────────────────────────────────────────────────── */
function BackupDialog({ open }) {
  const studio = useStudio();
  const { backupProgress, startBackup } = studio;
  const [form, set, close] = useDraft(
    () => ({ withImages: true, withVersions: false }),
    studio.closeDialog,
  );

  return (
    <Dialog
      id="dlg-backup" open={open} onClose={close}
      title="Ekspor Cadangan" subtitle="Simpan seluruh proyek ke satu berkas untuk dipindahkan."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" data-od-id="btn-start-backup" onClick={startBackup}>Ekspor Cadangan</button>
        </>
      )}
    >
      <div className="switch-row">
        <div className="switch-label">Sertakan berkas gambar</div>
        <button
          type="button"
          className={'switch' + (form.withImages ? ' is-on' : '')}
          role="switch"
          aria-checked={form.withImages}
          aria-label="Sertakan berkas gambar"
          onClick={() => set({ withImages: !form.withImages })}
        />
      </div>
      <div className="switch-row">
        <div className="switch-label">Sertakan riwayat versi</div>
        <button
          type="button"
          className={'switch' + (form.withVersions ? ' is-on' : '')}
          role="switch"
          aria-checked={form.withVersions}
          aria-label="Sertakan riwayat versi"
          onClick={() => set({ withVersions: !form.withVersions })}
        />
      </div>
      <Progress className="mt-4" progress={backupProgress || { pct: 0, note: 'Menyiapkan…' }} />
    </Dialog>
  );
}

/* ─── 17. ekspor ──────────────────────────────────────────────────── */
function ExportDialog({ open }) {
  const studio = useStudio();
  const { exportProgress, startExport, sheetTotal } = studio;
  const [form, set, close] = useDraft(
    () => ({
      format: 'PDF (siap cetak)',
      dpi: '300 DPI',
      pages: 'all',
      cropmark: true,
      bleed: true,
      number: false,
      transparent: false,
    }),
    studio.closeDialog,
  );

  const label = form.format === 'PNG' ? 'PNG' : form.format === 'PDF + PNG' ? 'PDF + PNG' : 'PDF';
  const mapped = form.format === 'PNG' ? 'PNG' : form.format === 'PDF + PNG' ? 'BOTH' : 'PDF';

  const run = () => {
    /* Ekspor tidak mengubah layer kanvas; bleed/nomor hanya untuk berkas ini. */
    startExport({
      format: mapped,
      dpi: form.dpi.replace(/[^0-9]/g, ''),
      cropmark: form.cropmark,
      pages: form.pages === 'current' ? 'current' : 'all',
      bleed: form.bleed,
      number: form.number,
      transparent: form.transparent,
    });
  };

  return (
    <Dialog
      id="dlg-export" open={open} onClose={close} size="lg"
      title="Pengaturan Ekspor" subtitle="Pilih format, halaman, dan resolusi keluaran."
      footer={(
        <>
          <CancelButton onClick={close} />
          <button type="button" className="btn btn-primary" data-od-id="btn-start-export" onClick={() => run()}>{'Ekspor ' + label}</button>
        </>
      )}
    >
      <div className="grid-2">
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="ex-format">Format</label>
            <select className="select" id="ex-format" value={form.format} onChange={(e) => set({ format: e.target.value })}>
              <option>PDF (siap cetak)</option><option>PNG</option><option>PDF + PNG</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ex-dpi">Resolusi</label>
            <select className="select" id="ex-dpi" value={form.dpi} onChange={(e) => set({ dpi: e.target.value })}>
              <option>150 DPI</option><option>300 DPI</option><option>600 DPI</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ex-pages">Halaman</label>
            <select className="select" id="ex-pages" value={form.pages} onChange={(e) => set({ pages: e.target.value })}>
              <option value="all">{'Semua halaman (' + sheetTotal + ')'}</option>
              <option value="current">Halaman aktif saja</option>
              <option value="manual">Pilih manual…</option>
            </select>
          </div>
        </div>
        <div className="stack-sm">
          <div className="switch-row">
            <div className="switch-label">Tanda potong</div>
            <button
              type="button"
              className={'switch' + (form.cropmark ? ' is-on' : '')}
              role="switch"
              aria-checked={form.cropmark}
              aria-label="Tanda potong"
              onClick={() => set({ cropmark: !form.cropmark })}
            />
          </div>
          <div className="switch-row">
            <div className="switch-label">Garis bleed</div>
            <button
              type="button"
              className={'switch' + (form.bleed ? ' is-on' : '')}
              role="switch"
              aria-checked={form.bleed}
              aria-label="Garis bleed"
              onClick={() => set({ bleed: !form.bleed })}
            />
          </div>
          <div className="switch-row">
            <div>
              <div className="switch-label">Nomor desain (proofing)</div>
              <div className="switch-sub">Mati = hasil cetak bersih tanpa angka</div>
            </div>
            <button
              type="button"
              className={'switch' + (form.number ? ' is-on' : '')}
              role="switch"
              aria-checked={form.number}
              aria-label="Nomor desain"
              onClick={() => set({ number: !form.number })}
            />
          </div>
          <div className="switch-row">
            <div className="switch-label">Latar transparan (PNG)</div>
            <button
              type="button"
              className={'switch' + (form.transparent ? ' is-on' : '')}
              role="switch"
              aria-checked={form.transparent}
              aria-label="Latar transparan"
              onClick={() => set({ transparent: !form.transparent })}
            />
          </div>
        </div>
      </div>

      <Progress className="mt-5" progress={exportProgress || { pct: 0, note: 'Menyiapkan…' }} />
      <p className="field-help mt-3" id="export-estimate">{'Perkiraan ukuran berkas: 4,2 MB · ' + sheetTotal + ' halaman'}</p>
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
