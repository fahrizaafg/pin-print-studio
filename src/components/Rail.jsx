import { useEffect, useState } from 'react';
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

function relativeSaveLabel(lastSavedAt, now) {
  if (!lastSavedAt) return 'Tersimpan 2 menit lalu';
  const minutes = Math.floor((now - lastSavedAt) / 60000);
  if (minutes < 1) return 'Tersimpan baru saja';
  if (minutes < 60) return 'Tersimpan ' + minutes + ' menit lalu';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return 'Tersimpan ' + hours + ' jam lalu';
  return 'Tersimpan ' + Math.floor(hours / 24) + ' hari lalu';
}

export default function Rail() {
  const studio = useStudio();
  const {
    page, goPage, save, railOpen, projectName, pins, galleryCards, presets, projects,
    saveState, lastSavedAt,
  } = studio;
  const [now, setNow] = useState(() => Date.now());

  /* Keep "Tersimpan N menit lalu" honest while the app stays open. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const badgeCounts = {
    editor: pins.length,
    gallery: galleryCards.length,
    templates: presets.length,
    history: projects.length,
  };

  const shown = relativeSaveLabel(lastSavedAt, now);

  return (
    <aside className={'rail' + (railOpen ? ' is-open' : '')} id="rail" data-od-id="app-rail">
      <div className="rail-brand">
        <div className="rail-mark" aria-hidden="true">P</div>
        <div className="rail-brand-text">
          <div className="rail-title">Pin Print Studio</div>
          <div className="rail-sub" id="rail-project-name">{projectName}</div>
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
                className={'rail-item' + (page === item.id ? ' is-active' : '')}
                data-nav={item.id}
                data-od-id={'nav-' + item.id}
                onClick={() => goPage(item.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <IconShape name={item.icon} />
                </svg>
                {' '}{item.label}
                {item.badge ? (
                  <span className="rail-badge" id={'badge-' + item.badge}>{' '}{badgeCounts[item.badge]}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="rail-foot">
        <div className="save-state" data-od-id="save-indicator">
          <span className={'save-dot' + (saveState === 'saving' ? ' is-saving' : '')} id="save-dot" />
          <span id="save-label">
            {saveState === 'saving' ? 'Menyimpan…' : shown}
          </span>
        </div>
        <div className="row2">
          <button
            className="btn btn-secondary btn-sm"
            id="rail-save"
            data-od-id="btn-rail-save"
            onClick={() => save()}
          >Simpan</button>
          <button
            className="btn btn-secondary btn-sm"
            id="rail-preview"
            data-od-id="btn-rail-preview"
            onClick={() => goPage('preview')}
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
        <path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1.1 1.6v.4" />
        <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
      </>
    ),
  };
  return paths[name];
}
