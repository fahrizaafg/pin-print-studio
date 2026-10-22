import { useState } from 'react';
import { useStudio } from '../state/StudioContext.jsx';

const NAV = [
  { group: 'Studio', items: [
    { id: 'home', label: 'Beranda', icon: 'home' },
    { id: 'editor', label: 'Editor', icon: 'grid', badge: 'editor' },
    { id: 'gallery', label: 'Galeri Desain', icon: 'image', badge: 'gallery' },
    { id: 'templates', label: 'Template & Preset', icon: 'gridRounded', badge: 'templates' },
  ] },
  { group: 'Kelola', items: [
    { id: 'history', label: 'Riwayat Proyek', icon: 'history', badge: 'history' },
    { id: 'settings', label: 'Pengaturan', icon: 'settings' },
    { id: 'help', label: 'Bantuan', icon: 'help' },
  ] },
];

export default function Rail() {
  const studio = useStudio();
  const { page, goPage, save, openDialog, railOpen } = studio;
  const [saveLabel, setSaveLabel] = useState(null);

  /*
   * Prototype restores "Tersimpan N menit lalu" on boot. The clock read is
   * impure, so it happens once in the state initialiser — not during render.
   */
  const [initialLabel] = useState(() => (
    studio.lastSavedAt
      ? `Tersimpan ${Math.max(1, Math.round((Date.now() - studio.lastSavedAt) / 60000))} menit lalu`
      : 'Tersimpan 2 menit lalu'
  ));
  const shown = saveLabel ?? initialLabel;

  const badgeCounts = {
    editor: 6,
    gallery: 6,
    templates: 4,
    history: 5,
  };

  return (
    <aside className={`rail${railOpen ? ' is-open' : ''}`} id="rail" data-od-id="app-rail">
      <div className="rail-brand">
      <div className="rail-mark" aria-hidden="true">P</div>
      <div className="rail-brand-text">
        <div className="rail-title">Pin Print Studio</div>
        <div className="rail-sub" id="rail-project-name">Proyek Tanpa Judul</div>
      </div>
    </div>

      <nav className="rail-nav" data-od-id="rail-nav" aria-label="Navigasi utama">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="rail-group-label">{group.group}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rail-item${page === item.id ? ' is-active' : ''}`}
                data-nav={item.id}
                data-od-id={`nav-${item.id}`}
                onClick={() => goPage(item.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <IconShape name={item.icon} />
                </svg>
                {' '}{item.label}
                {item.badge ? (
                  <span className="rail-badge" id={`badge-${item.badge}`}>{' '}{badgeCounts[item.badge]}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="rail-foot">
        <div className="save-state" data-od-id="save-indicator">
          <span className={`save-dot${studio.saveState === 'saving' ? ' is-saving' : ''}`} id="save-dot" />
          <span id="save-label">
            {studio.saveState === 'saving' ? 'Menyimpan…' : studio.saveState === 'done' ? 'Tersimpan baru saja' : shown}
          </span>
        </div>
        <div className="row2">
          <button
            className="btn btn-secondary btn-sm"
            id="rail-save"
            data-od-id="btn-rail-save"
            onClick={() => { setSaveLabel(null); save(); }}
          >Simpan</button>
          <button
            className="btn btn-secondary btn-sm"
            id="rail-preview"
            data-od-id="btn-rail-preview"
            onClick={() => openDialog('dlg-export')}
          >Pratinjau</button>
        </div>
      </div>
    </aside>
  );
}

function IconShape({ name }) {
  const paths = {
    home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 15l4.5-4 4 3.5 3-2.5L21 16" />
        <circle cx="8.5" cy="9" r="1.4" />
      </>
    ),
    gridRounded: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
    history: (
      <>
        <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
        <path d="M3 4v4.5h4.5M12 7.5V12l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4" />
        <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
      </>
    ),
  };
  return paths[name];
}