import { useStudio } from '../state/StudioContext.jsx';
import { Icon } from './ui/icons.jsx';

export default function Toolbar() {
  const studio = useStudio();
  const {
    projectName, renameProject, openDialog, save, undo, redo, undoStack, redoStack,
    toggleRail, togglePanelRight, toggles, toggleLayer,
  } = studio;

  const handleRename = () => {
    const name = window.prompt('Nama proyek baru:', projectName);
    if (name && name.trim()) renameProject(name.trim());
  };

  const quickToggles = [
    { key: 'cut', label: 'Garis Potong', id: 'btn-quick-cut', tip: 'Garis potong' },
    { key: 'bleed', label: 'Bleed', id: 'btn-quick-bleed', tip: 'Area bleed' },
    { key: 'grid', label: 'Grid', id: 'btn-quick-grid', tip: 'Garis bantu' },
  ];

  return (
    <>
      {/* ─── TOOLBAR BARIS 1: PROYEK ─────────────────────────────── */}
      <header className="toolbar editor-toolbar" data-od-id="editor-toolbar-project">
        <button
          className="btn btn-ghost btn-icon only-mobile"
          id="menu-toggle"
          data-od-id="btn-menu-toggle"
          aria-label="Buka menu"
          onClick={toggleRail}
        >
          <Icon name="menu" />
        </button>

        <button
          className="tb-title"
          id="btn-rename-project"
          data-od-id="btn-rename-project"
          data-tip="Ganti nama proyek"
          onClick={handleRename}
        >
          {projectName}
        </button>
        <span className="pill" data-od-id="editor-draft-badge">Draf</span>

        <div className="tb-sep" />

        <div className="tb-group" role="group" aria-label="Proyek">
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-new-project"
            data-tip="Proyek Baru"
            onClick={() => openDialog('dlg-new-project')}
          >
            <Icon name="plus" />
            Baru
          </button>
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-open-project"
            data-tip="Buka Proyek"
            onClick={() => openDialog('dlg-open-project')}
          >
            <Icon name="folder" />
            Buka
          </button>
          <button
            className="btn btn-secondary btn-sm"
            id="btn-save"
            data-od-id="btn-save"
            data-tip="Simpan (Ctrl+S)"
            onClick={save}
          >
            <Icon name="save" />
            Simpan
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group" role="group" aria-label="Riwayat tindakan">
          <button
            className="btn btn-secondary btn-icon"
            id="btn-undo"
            data-od-id="btn-undo"
            data-tip="Undo (Ctrl+Z)"
            disabled={undoStack.length === 0}
            onClick={undo}
          >
            <Icon name="undo" />
          </button>
          <button
            className="btn btn-secondary btn-icon"
            id="btn-redo"
            data-od-id="btn-redo"
            data-tip="Redo (Ctrl+Y)"
            disabled={redoStack.length === 0}
            onClick={redo}
          >
            <Icon name="redo" />
          </button>
        </div>

        <div className="tb-spacer" />

        <button
          className="btn btn-secondary btn-sm only-mobile"
          id="btn-panel-r"
          data-od-id="btn-panel-r"
          data-tip="Pengaturan"
          onClick={togglePanelRight}
        >
          <Icon name="settings" />
        </button>
        <button
          className="btn btn-secondary btn-sm"
          data-od-id="btn-export"
          data-tip="Ekspor desain"
          onClick={() => openDialog('dlg-export')}
        >
          <Icon name="exportArrow" />
            Ekspor
        </button>
        <button
          className="btn btn-primary btn-sm"
          data-od-id="btn-export-cta"
          onClick={() => openDialog('dlg-export')}
        >Ekspor PDF</button>
      </header>

      {/* ─── TOOLBAR BARIS 2: PRODUKSI ───────────────────────────── */}
      <header className="toolbar editor-toolbar-2" data-od-id="editor-toolbar-production">
        <div className="tb-group" role="group" aria-label="Produksi">
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-upload"
            data-tip="Unggah gambar baru"
            onClick={() => openDialog('dlg-upload')}
          >
            <Icon name="upload" />
            Upload Gambar
          </button>
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-paper-setup"
            data-tip="Ukuran, margin, serta orientasi kertas"
            onClick={() => openDialog('dlg-paper')}
          >
            <Icon name="paper" />
            Pengaturan Kertas
          </button>
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-auto-arrange"
            data-tip="Susun otomatis seluruh desain"
            onClick={() => openDialog('dlg-auto')}
          >
            <Icon name="gridTiles" />
            Susun Otomatis
          </button>
          <button
            className="btn btn-secondary btn-sm"
            id="btn-optimize"
            data-od-id="btn-optimize"
            data-tip="Kurangi sisa kertas dengan mengemas lebih rapat"
            onClick={() => studio.optimizePaper()}
          >
            <Icon name="bolt" />
            Optimalkan Kertas
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group" role="group" aria-label="Kontrol tampilan cepat">
          {quickToggles.map((t) => (
            <button
              key={t.key}
              className={`btn btn-secondary btn-sm${toggles[t.key] ? ' is-on' : ''}`}
              data-od-id={t.id}
              data-tip={t.tip}
              onClick={() => toggleLayer(t.key)}
            >{t.label}</button>
          ))}
        </div>

        <div className="tb-spacer" />

        <button
          className="btn btn-secondary btn-sm"
          id="btn-preview-print"
          data-od-id="btn-preview-print"
          data-tip="Buka pratinjau cetak"
          onClick={() => studio.goPage('preview')}
        >
          <Icon name="eye" />
          Pratinjau Cetak
        </button>
        <button
          className="btn btn-secondary btn-sm"
          id="btn-export-png"
          data-od-id="btn-export-png"
          data-tip="Ekspor sebagai gambar PNG"
          onClick={() => studio.exportPng()}
        >
          <Icon name="png" />
            Ekspor PNG
        </button>
        <button
          className="btn btn-dark btn-sm"
          id="btn-print"
          data-od-id="btn-print"
          data-tip="Kirim ke printer"
          onClick={() => studio.print()}
        >
          <Icon name="print" />
          Cetak
        </button>
      </header>
    </>
  );
}