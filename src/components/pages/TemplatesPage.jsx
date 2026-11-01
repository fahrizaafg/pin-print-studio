import { useStudio } from '../../state/StudioContext.jsx';
import { BUILTIN_TEMPLATES } from '../../data/studioData.js';
import { store } from '../../lib/storage.js';

const BUILTIN_GEOMETRY = { paper: 'a3', diameter: 58, rows: 4, cols: 3, gap: 4, margin: 8 };

export default function TemplatesPage({ active }) {
  const studio = useStudio();
  const presets = studio.presets;
  const customPresets = presets.filter((preset) => !preset.builtin);

  const editPreset = (id) => {
    store.set('editPreset', id);
    studio.openDialog('dlg-edit-preset');
  };

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-templates" data-page="templates" data-od-id="page-templates">
      <div className="page-head">
        <div className="head-row">
          <div className="head-copy">
            <p className="eyebrow">Resep Layout</p>
            <h1>Template &amp; Preset</h1>
            <p className="lead">Simpan kombinasi kertas, diameter, dan susunan grid agar tak perlu mengatur ulang setiap kali.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" data-od-id="btn-create-preset" onClick={() => studio.openDialog('dlg-new-preset')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
            Buat Preset
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="page-inner">
          <div className="grid-3" data-od-id="preset-grid">
            {presets.map((preset) => (
              <div className="card" key={preset.id} data-od-id={preset.id}>
                <div className="row-between mb-4">
                  {preset.badge.kind === 'pill'
                    ? <span className="pill">{preset.badge.text}</span>
                    : <span className="tag">{preset.badge.text}</span>}
                  <span className="meta">{preset.meta}</span>
                </div>
                <h3>{preset.title}</h3>
                <p className="body-sm muted mt-2">{preset.body}</p>
                <div className="row mt-4" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm" data-od-id={`${preset.id}-use`} onClick={() => studio.usePreset(preset.id)}>Gunakan</button>
                  <button type="button" className="btn btn-secondary btn-sm" data-od-id={`${preset.id}-edit`} onClick={() => editPreset(preset.id)}>Edit</button>
                  <button type="button" className="btn btn-secondary btn-sm" data-od-id={`${preset.id}-dup`} onClick={() => studio.duplicatePreset(preset.id)}>Duplikat</button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    data-od-id={`${preset.id}-del`}
                    data-tip={preset.builtin ? 'Preset bawaan tidak dapat dihapus' : undefined}
                    disabled={preset.builtin === true}
                    onClick={() => studio.requestConfirm({
                      message: preset.confirm || `Hapus preset ${preset.title}?`,
                      note: 'Preset akan dihapus dari daftar resep layout.',
                      toast: 'Preset dihapus.',
                      onConfirm: () => studio.removePreset(preset.id),
                    })}
                  >Hapus</button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2 mt-6">
            <div className="card card-rule">
              <h3>Template bawaan</h3>
              <p className="body-sm muted mt-2 mb-4">Preset siap pakai dari Pin Print Studio. Tidak dapat dihapus, tetapi bisa diduplikat.</p>
              <div className="stack-xs">
                {BUILTIN_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="row-between"
                    style={{ padding: '10px 0', borderBottom: tpl.last ? undefined : '1px solid var(--border-soft)' }}
                  >
                    <span className="body-sm">{tpl.name}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      data-od-id={`${tpl.id}-dup`}
                      onClick={() => studio.addPreset({ title: tpl.name, ...BUILTIN_GEOMETRY })}
                    >Duplikat</button>
                  </div>
                ))}
              </div>
            </div>
            {customPresets.length === 0 ? (
              <div className="empty" data-od-id="preset-empty">
                <span className="empty-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
                    <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
                  </svg>
                </span>
                <h3>Belum ada preset buatan sendiri</h3>
                <p>Atur kertas dan grid di Editor, lalu simpan sebagai preset agar bisa dipakai ulang kapan saja.</p>
                <button type="button" className="btn btn-primary btn-sm" data-od-id="preset-empty-create" onClick={() => studio.openDialog('dlg-new-preset')}>Buat Preset</button>
              </div>
            ) : (
              <div className="card card-rule" data-od-id="preset-custom-list">
                <h3>Preset buatan sendiri</h3>
                <p className="body-sm muted mt-2 mb-4">{customPresets.length} preset tersimpan di perangkat ini.</p>
                <div className="stack-xs">
                  {customPresets.map((preset, index) => (
                    <div
                      key={preset.id}
                      className="row-between"
                      style={{ padding: '10px 0', borderBottom: index === customPresets.length - 1 ? undefined : '1px solid var(--border-soft)' }}
                    >
                      <span className="body-sm">{preset.title}</span>
                      <button type="button" className="btn btn-secondary btn-sm" data-od-id={`${preset.id}-list-use`} onClick={() => studio.usePreset(preset.id)}>Gunakan</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
