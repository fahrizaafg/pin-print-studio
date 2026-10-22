import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import {
  DEFAULT_INSPECTOR, DEFAULT_SETTINGS, DEFAULT_TOGGLES, INITIAL_ASSETS, INITIAL_PINS, PAGE_TITLES,
} from '../data/studioData.js';
import { store } from '../lib/storage.js';
import { useToast } from './ToastContext.jsx';

const StudioContext = createContext(null);

const TOGGLE_LABEL = {
  cut: 'Garis potong',
  bleed: 'Bleed',
  grid: 'Grid',
  margin: 'Margin',
  safe: 'Safe area',
  filename: 'Nama file',
  number: 'Nomor desain',
  marks: 'Tanda potong',
};

/* ─── persisted bits (identical keys to the prototype) ────────────── */
const initialPage = (() => {
  const page = store.get('page', 'home');
  return page === 'preview' ? 'editor' : page;
})();
const initialToggles = { ...DEFAULT_TOGGLES, ...(store.get('toggles') || {}) };
const initialZoom = store.get('zoom', 78);

function normalizeZoom(value) {
  return Math.max(25, Math.min(200, Math.round(value)));
}

const initialState = {
  page: PAGE_TITLES[initialPage] ? initialPage : 'home',
  dialog: null,
  confirm: null,
  railOpen: false,
  panelRightOpen: false,
  projectName: 'Layout Pin A3 — Kopi Kenangan',
  pins: INITIAL_PINS,
  /* Prototype ships pin 1 pre-selected (`.pin.is-selected`). */
  selectedPinId: 'p1',
  layoutMode: 'grid',
  toggles: initialToggles,
  zoom: normalizeZoom(initialZoom),
  sheetPage: 1,
  sheetTotal: 3,
  assetQuery: '',
  assets: INITIAL_ASSETS,
  inspector: DEFAULT_INSPECTOR,
  settings: DEFAULT_SETTINGS,
  settingsTab: 'tampilan',
  previewDpi: '300',
  previewPage: 1,
  saveState: 'idle',
  lastSavedAt: store.get('savedAt', null),
  undoStack: [],
  redoStack: [],
};

/* Only the editable slices are snapshotted. */
function snapshot(state) {
  return {
    pins: state.pins,
    toggles: state.toggles,
    zoom: state.zoom,
    inspector: state.inspector,
    layoutMode: state.layoutMode,
    selectedPinId: state.selectedPinId,
  };
}

function reducer(state, action) {
  switch (action.type) {
    /* ── navigation / chrome ── */
    case 'nav':
      return { ...state, page: action.page, railOpen: false, dialog: null };
    case 'setRailOpen':
      return { ...state, railOpen: action.open };
    case 'setPanelRight':
      return { ...state, panelRightOpen: action.open };
    case 'openDialog':
      return { ...state, dialog: action.id };
    case 'closeDialog':
      return { ...state, dialog: null };
    case 'setConfirm':
      /* Opening a confirm also opens dlg-confirm, like the prototype's [data-confirm] handler. */
      return { ...state, confirm: action.value, dialog: action.value ? 'dlg-confirm' : null };
    case 'renameProject':
      return { ...state, projectName: action.name || state.projectName };

    /* ── editor ── */
    case 'toggleLayer':
      return { ...state, toggles: { ...state.toggles, [action.key]: !state.toggles[action.key] } };
    case 'setZoom':
      return { ...state, zoom: normalizeZoom(action.zoom) };
    case 'setSheetPage':
      return { ...state, sheetPage: action.page };
    case 'addSheetPage':
      return { ...state, sheetTotal: state.sheetTotal + 1, sheetPage: state.sheetTotal + 1 };
    case 'removeSheetPage':
      return state.sheetTotal <= 1
        ? state
        : { ...state, sheetTotal: state.sheetTotal - 1, sheetPage: Math.min(state.sheetPage, state.sheetTotal - 1) };
    case 'setLayoutMode':
      return { ...state, layoutMode: action.mode };
    case 'selectPin':
      return {
        ...state,
        selectedPinId: action.id,
        inspector: action.id
          ? { ...state.inspector, posX: action.x ?? state.inspector.posX, posY: action.y ?? state.inspector.posY }
          : state.inspector,
      };
    case 'movePin':
      return {
        ...state,
        pins: state.pins.map((pin) => (pin.id === action.id ? { ...pin, x: action.x, y: action.y } : pin)),
      };
    case 'removeSelectedPin':
      return {
        ...state,
        pins: state.pins.filter((p) => p.id !== state.selectedPinId),
        selectedPinId: null,
      };
    case 'duplicateSelectedPin': {
      const selected = state.pins.find((p) => p.id === state.selectedPinId);
      if (!selected) return state;
      const copy = { ...selected, id: `p${Date.now()}`, x: selected.x + 18, y: selected.y + 18, locked: false };
      return { ...state, pins: [...state.pins, copy], selectedPinId: copy.id };
    }
    case 'setInspector':
      return { ...state, inspector: { ...state.inspector, ...action.patch } };
    case 'setLockAll':
      return {
        ...state,
        inspector: { ...state.inspector, lock: action.on },
        pins: state.pins.map((p) => (p.id === state.selectedPinId ? { ...p, locked: action.on } : p)),
      };
    case 'applyInspector': {
      /* Re-grid every pin with the current rows/cols/gap/margin. */
      const { cols, gap, margin, diameter } = state.inspector;
      const cell = diameter + gap;
      const origin = Math.max(12, margin * 2);
      return {
        ...state,
        pins: state.pins.map((pin, index) => ({
          ...pin,
          x: origin + (index % cols) * cell,
          y: origin + Math.floor(index / cols) * cell,
        })),
      };
    }
    case 'alignGrid':
      return {
        ...state,
        pins: state.pins.map((pin) => ({ ...pin, x: Math.round(pin.x / 25) * 25, y: Math.round(pin.y / 25) * 25 })),
      };
    case 'centerLayout': {
      const { cols, rows, diameter, gap } = state.inspector;
      const cell = diameter + gap;
      const totalW = cols * cell - gap;
      const totalH = rows * cell - gap;
      const startX = Math.max(12, Math.round((620 - totalW) / 2));
      const startY = Math.max(12, Math.round((877 - totalH) / 2));
      return {
        ...state,
        pins: state.pins.map((pin, index) => ({
          ...pin,
          x: startX + (index % cols) * cell,
          y: startY + Math.floor(index / cols) * cell,
        })),
      };
    }
    case 'resetLayout':
      return {
        ...state,
        pins: INITIAL_PINS,
        selectedPinId: null,
        inspector: DEFAULT_INSPECTOR,
      };

    /* ── assets ── */
    case 'setAssetQuery':
      return { ...state, assetQuery: action.query };
    case 'toggleAsset':
      return {
        ...state,
        assets: state.assets.map((a) => (a.id === action.id ? { ...a, selected: !a.selected } : a)),
      };
    case 'selectAllAssets':
      return { ...state, assets: state.assets.map((a) => ({ ...a, selected: true })) };
    case 'deselectAssets':
      return { ...state, assets: state.assets.map((a) => ({ ...a, selected: false })) };

    /* ── settings / preview ── */
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'resetSettings':
      return { ...state, settings: DEFAULT_SETTINGS };
    case 'setSettingsTab':
      return { ...state, settingsTab: action.tab };
    case 'setPreviewDpi':
      return { ...state, previewDpi: action.dpi };
    case 'setPreviewPage':
      return { ...state, previewPage: Math.max(1, Math.min(state.sheetTotal, action.page)) };

    /* ── save indicator ── */
    case 'saving':
      return { ...state, saveState: 'saving' };
    case 'saved':
      return { ...state, saveState: 'done', lastSavedAt: action.at };

    /* ── undo / redo ── */
    case 'pushHistory':
      return { ...state, undoStack: [...state.undoStack, action.snapshot].slice(-50), redoStack: [] };
    case 'undo': {
      if (!state.undoStack.length) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        ...prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, snapshot(state)],
      };
    }
    case 'redo': {
      if (!state.redoStack.length) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        ...next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, snapshot(state)],
      };
    }
    default:
      return state;
  }
}

export function StudioProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [exportProgress, setExportProgress] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);
  const toast = useToast();
  const saveTimer = useRef(null);
  const exportTimer = useRef(null);
  const backupTimer = useRef(null);

  /* ── document title ── */
  useEffect(() => {
    document.title = `Pin Print Studio — ${PAGE_TITLES[state.page] || 'Studio'}`;
  }, [state.page]);

  /* ── persistence (same keys the prototype wrote) ── */
  useEffect(() => { store.set('page', state.page); }, [state.page]);
  useEffect(() => { store.set('toggles', state.toggles); }, [state.toggles]);
  useEffect(() => { store.set('zoom', state.zoom); }, [state.zoom]);
  useEffect(() => { store.set('sheetPage', state.sheetPage); }, [state.sheetPage]);
  useEffect(() => { store.set('hasUndo', state.undoStack.length > 0); }, [state.undoStack.length]);

  /* ── save indicator: "Menyimpan…" → "Tersimpan baru saja" ── */
  const commitSave = useCallback(() => {
    dispatch({ type: 'saving' });
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const at = Date.now();
      store.set('savedAt', at);
      dispatch({ type: 'saved', at });
    }, 900);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(saveTimer.current);
    window.clearInterval(exportTimer.current);
    window.clearInterval(backupTimer.current);
  }, []);

  /* ── progress runners (export + backup dialogs) ── */
  const runProgress = useCallback((setter, notes, done, timerRef) => {
    let step = 0;
    window.clearInterval(timerRef.current);
    setter({ pct: 8, note: notes[0] });
    timerRef.current = window.setInterval(() => {
      step += 1;
      const pct = Math.min(100, 8 + step * 23);
      const note = pct >= 100 ? 'Selesai.' : notes[Math.min(notes.length - 1, Math.floor(step / 2))];
      setter({ pct, note });
      if (pct >= 100) {
        window.clearInterval(timerRef.current);
        window.setTimeout(() => {
          setter(null);
          dispatch({ type: 'closeDialog' });
          done();
        }, 420);
      }
    }, 260);
  }, []);

  const pushHistory = useCallback((current) => {
    dispatch({ type: 'pushHistory', snapshot: snapshot(current) });
  }, []);

  const actions = useMemo(() => ({
    ...state,
    exportProgress,
    backupProgress,

    /* navigation */
    goPage: (page) => dispatch({ type: 'nav', page }),
    toggleRail: () => dispatch({ type: 'setRailOpen', open: !state.railOpen }),
    closeRail: () => dispatch({ type: 'setRailOpen', open: false }),
    togglePanelRight: () => dispatch({ type: 'setPanelRight', open: !state.panelRightOpen }),

    /* dialogs */
    openDialog: (id) => dispatch({ type: 'openDialog', id }),
    closeDialog: () => {
      window.clearInterval(exportTimer.current);
      window.clearInterval(backupTimer.current);
      setExportProgress(null);
      setBackupProgress(null);
      dispatch({ type: 'closeDialog' });
    },
    requestConfirm: ({ message, note, toast: toastMessage, nav, onConfirm }) =>
      dispatch({ type: 'setConfirm', value: { message, note, toast: toastMessage, nav, onConfirm } }),
    resolveConfirm: () => {
      const pending = state.confirm;
      dispatch({ type: 'setConfirm', value: null });
      if (typeof pending?.onConfirm === 'function') pending.onConfirm();
      if (!pending) return;
      toast(pending.toast || 'Tindakan selesai.', 'ok');
      if (pending.nav) dispatch({ type: 'nav', page: pending.nav });
    },

    /* editor */
    toggleLayer: (key) => {
      pushHistory(state);
      dispatch({ type: 'toggleLayer', key });
      toast(`${TOGGLE_LABEL[key]} ${state.toggles[key] ? 'disembunyikan' : 'ditampilkan'}.`, 'info');
    },
    zoomBy: (delta) => dispatch({ type: 'setZoom', zoom: state.zoom + delta }),
    setZoom: (zoom) => dispatch({ type: 'setZoom', zoom }),
    gotoSheetPage: (page) => dispatch({ type: 'setSheetPage', page }),
    addSheetPage: () => {
      pushHistory(state);
      dispatch({ type: 'addSheetPage' });
      commitSave();
      toast('Halaman baru ditambahkan.', 'ok');
    },
    removeSheetPage: () => {
      if (state.sheetTotal <= 1) {
        toast('Minimal satu halaman harus tersisa.', 'err');
        return;
      }
      pushHistory(state);
      dispatch({ type: 'removeSheetPage' });
      commitSave();
      toast('Halaman dihapus.', 'ok');
    },
    setLayoutMode: (mode) => dispatch({ type: 'setLayoutMode', mode }),
    selectPin: (id) => {
      const pin = state.pins.find((p) => p.id === id);
      dispatch({ type: 'selectPin', id, x: pin?.x, y: pin?.y });
    },
    movePin: (id, x, y) => dispatch({ type: 'movePin', id, x, y }),
    removeSelectedPin: () => {
      if (!state.selectedPinId) {
        toast('Pilih desain pada lembar terlebih dahulu.', 'err');
        return;
      }
      pushHistory(state);
      dispatch({ type: 'removeSelectedPin' });
      commitSave();
      toast('Desain terpilih dihapus dari layout.', 'ok');
    },
    duplicateSelectedPin: () => {
      if (!state.selectedPinId) {
        toast('Pilih desain pada lembar terlebih dahulu.', 'err');
        return;
      }
      pushHistory(state);
      dispatch({ type: 'duplicateSelectedPin' });
      commitSave();
      toast('Desain diduplikat.', 'ok');
    },
    setInspector: (patch) => dispatch({ type: 'setInspector', patch }),
    applyInspector: () => {
      pushHistory(state);
      dispatch({ type: 'applyInspector' });
      commitSave();
      toast('Pengaturan diterapkan ke layout.', 'ok');
    },
    applySelected: () => {
      toast('Pengaturan diterapkan ke 1 desain terpilih.', 'ok');
      commitSave();
    },
    alignGrid: () => {
      pushHistory(state);
      dispatch({ type: 'alignGrid' });
      commitSave();
      toast('Desain diratakan ke grid.', 'ok');
    },
    centerLayout: () => {
      pushHistory(state);
      dispatch({ type: 'centerLayout' });
      commitSave();
      toast('Layout dipusatkan pada kertas.', 'ok');
    },
    resetLayout: () => {
      pushHistory(state);
      dispatch({ type: 'resetLayout' });
      commitSave();
      toast('Layout dikembalikan ke susunan awal.', 'ok');
    },
    setLock: (on) => {
      if (!state.selectedPinId) {
        toast('Pilih desain pada lembar terlebih dahulu.', 'err');
        return;
      }
      pushHistory(state);
      dispatch({ type: 'setLockAll', on });
      toast(on ? 'Posisi desain dikunci.' : 'Kunci posisi dibuka.', 'info');
    },

    /* assets */
    setAssetQuery: (query) => dispatch({ type: 'setAssetQuery', query }),
    toggleAsset: (id) => {
      pushHistory(state);
      dispatch({ type: 'toggleAsset', id });
      commitSave();
    },
    selectAllAssets: () => {
      dispatch({ type: 'selectAllAssets' });
      toast('Semua desain dipilih.', 'info');
    },
    deselectAssets: () => {
      dispatch({ type: 'deselectAssets' });
      toast('Pilihan dibatalkan.', 'info');
    },

    /* settings */
    setSettings: (patch) => dispatch({ type: 'setSettings', patch }),
    resetSettings: () => {
      dispatch({ type: 'resetSettings' });
      toast('Pengaturan dikembalikan ke default.', 'ok');
    },
    setSettingsTab: (tab) => dispatch({ type: 'setSettingsTab', tab }),
    setPreviewDpi: (dpi) => dispatch({ type: 'setPreviewDpi', dpi }),
    setPreviewPage: (page) => dispatch({ type: 'setPreviewPage', page }),

    /* save / rename */
    toastInline: (message, kind = 'info') => toast(message, kind),
    notify: toast,
    save: () => {
      commitSave();
      toast('Proyek tersimpan.', 'ok');
    },
    markDirty: commitSave,
    renameProject: (name) => {
      dispatch({ type: 'renameProject', name });
      commitSave();
    },

    /* history */
    undo: () => {
      if (!state.undoStack.length) {
        toast('Tidak ada tindakan untuk dibatalkan.', 'info');
        return;
      }
      dispatch({ type: 'undo' });
      toast('Perubahan diurungkan.', 'info');
    },
    redo: () => {
      if (!state.redoStack.length) {
        toast('Tidak ada tindakan untuk dikembalikan.', 'info');
        return;
      }
      dispatch({ type: 'redo' });
      toast('Perubahan diulang.', 'info');
    },

    /* export + backup */
    startExport: (notes, label) => {
      runProgress(setExportProgress, notes, () => {
        toast(`Ekspor ${label} selesai — ${state.sheetTotal} halaman tersimpan.`, 'ok');
        commitSave();
      }, exportTimer);
    },
    optimizePaper: () => {
      pushHistory(state);
      dispatch({ type: 'toggleLayer', key: 'margin' });
      const gap = Math.max(2, state.inspector.gap - 2);
      dispatch({ type: 'setInspector', patch: { gap } });
      commitSave();
      toast('Pengemasan dirapatkan — sisa kertas berkurang 12%.', 'ok');
    },
    exportPng: () => {
      toast('Ekspor PNG: 1 halaman 300 DPI siap diunduh.', 'ok');
      commitSave();
    },
    print: () => {
      toast('Dokumen dikirim ke antrean cetak.', 'ok');
      commitSave();
    },
    clearCache: () => {
      store.remove('toggles');
      toast('Cache pratinjau dibersihkan (2,4 MB).', 'ok');
    },
    clearAll: () => {
      ['page', 'toggles', 'zoom', 'savedAt', 'hasUndo', 'sheetPage'].forEach((k) => store.remove(k));
      toast('Semua data proyek dihapus dari perangkat ini.', 'ok');
    },
    duplicatePreset: (name) => {
      toast(`Preset "${name}" diduplikat.`, 'ok');
    },
    usePreset: () => {
      dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
      toast('Preset diterapkan ke editor.', 'ok');
    },
    createProject: (name) => {
      dispatch({ type: 'resetLayout' });
      dispatch({ type: 'renameProject', name });
      dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
      toast('Proyek baru dibuat.', 'ok');
    },
    openProject: (name) => {
      dispatch({ type: 'renameProject', name });
      dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
      toast(`Proyek "${name}" dibuka.`, 'ok');
    },
    startBackup: () => {
      runProgress(
        setBackupProgress,
        ['Mengumpulkan proyek…', 'Menulis arsip .pinzip…', 'Memeriksa cadangan…', 'Menyelesaikan…'],
        () => toast('Cadangan diekspor (5 proyek).', 'ok'),
        backupTimer,
      );
    },
  }), [state, exportProgress, backupProgress, toast, commitSave, runProgress, pushHistory]);

  return <StudioContext.Provider value={actions}>{children}</StudioContext.Provider>;
}

/* Hook lives beside its provider by design; oxlint's fast-refresh rule is not applicable. */
// eslint-disable-next-line react/only-export-components
export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>');
  return ctx;
}