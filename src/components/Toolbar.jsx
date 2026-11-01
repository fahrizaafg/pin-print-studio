import { useStudio } from '../state/StudioContext.jsx';
import { Icon } from './ui/icons.jsx';
import { PAPER_LABEL } from '../data/studioData.js';

export default function Toolbar() {
  const studio = useStudio();
  const {
    projectName, openDialog, save, undo, redo, undoStack, redoStack,
    toggleRail, togglePanelRight,
  } = studio;

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
          onClick={() => openDialog('dlg-rename')}
        >
          {projectName}
        </button>
        <span className="pill" data-od-id="editor-draft-badge">Draf</span>
        <span className="pill" data-od-id="paper-indicator-top" title="Kertas aktif (preview)">Kertas {(PAPER_LABEL[studio.inspector?.paper] || studio.inspector?.paper || 'A3') + (studio.inspector?.orientation === 'landscape' ? ' • Landscape' : ' • Portrait')}</span>

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
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-reset-default"
            data-tip="Kosongkan semua data di perangkat ini"
            onClick={() => studio.requestConfirm({
              message: 'Reset dan kosongkan semua? Proyek, galeri, dan layout dihapus.',
              note: 'Preset tetap tersimpan. Tindakan ini tidak dapat dibatalkan.',
              toast: 'Semua data dikosongkan.',
              onConfirm: () => studio.resetToDefault(),
            })}
          >
            Reset Default
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
          className="btn btn-primary btn-sm"
          data-od-id="btn-export"
          data-tip="Ekspor desain (PDF/PNG)"
          onClick={() => openDialog('dlg-export')}
        >
          <Icon name="exportArrow" />
            Ekspor
        </button>
      </header>

      {/* ─── TOOLBAR BARIS 2: PRODUKSI ───────────────────────────── */}
      <header className="toolbar editor-toolbar-2" data-od-id="editor-toolbar-production">
        <div className="tb-group" role="group" aria-label="Produksi">
          <button
            className="btn btn-secondary btn-sm"
            data-od-id="btn-paper-setup"
            data-tip="Ukuran, margin, serta orientasi kertas"
            onClick={() => openDialog('dlg-paper')}
          >
            <Icon name="paper" />
            Pengaturan Kertas
          </button>

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