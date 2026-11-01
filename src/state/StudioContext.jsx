import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import {
  ART_PALETTE, BACKUP_NOTES, DEFAULT_INSPECTOR, DEFAULT_SETTINGS,
  DEFAULT_TOGGLES, EXPORT_NOTES, GALLERY_CARDS, HISTORY_ROWS, ICON_PALETTE, INITIAL_ASSETS,
  PAGE_SEED, PAGE_TITLES, PRESETS, RESTORE_VERSIONS,
} from '../data/studioData.js';
import { store } from '../lib/storage.js';
import {
  downloadBlob, formatVersionTime, imageDimensions, resolveFileName,
} from '../lib/format.js';
import { printSheets, renderPdf, renderSheetPng } from '../lib/exporters.js';
import { clampZoom } from '../lib/pinGeometry.js';
import {
  cutMmOf, freePackingCells, gridPins, makePin,
  paperLabelOf, paperSizePx, pinSizeFromCut,
} from '../lib/pins.js';
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

const VERSION_SEED_PAYLOAD = {
  v1: PAGE_SEED,
  v2: PAGE_SEED,
  v3: [
    { id: 'v3-page-1', pins: PAGE_SEED[0].pins.slice(0, 2) },
    { id: 'v3-page-2', pins: PAGE_SEED[1].pins.slice(0, 2) },
  ],
};

/* ─── persisted bits (identical keys to the prototype) ────────────── */
const initialPage = (() => {
  const page = store.get('page', 'home');
  return page === 'preview' ? 'editor' : page;
})();
const initialToggles = { ...DEFAULT_TOGGLES, ...(store.get('toggles') || {}), filename: false };
const initialInspector = (() => {
  const saved = store.get('inspector', {}) || {};
  const merged = { ...DEFAULT_INSPECTOR, ...saved };
  if (merged.cutSizeMm == null) {
    const d = Number(saved.diameter);
    merged.cutSizeMm = d > 0 ? d : 57;
  }
  if (merged.photoSizeMm == null) merged.photoSizeMm = 47;
  if (!merged.unit) merged.unit = 'mm';
  if (merged.cutStyle !== 'dashed' && merged.cutStyle !== 'solid') merged.cutStyle = 'solid';
  return merged;
})();
const initialZoom = store.get('zoom', 78);

const initialPages = (() => {
  const saved = store.get('pages', null);
  if (Array.isArray(saved) && saved.length && saved.every((p) => p && Array.isArray(p.pins))) return saved;
  return PAGE_SEED;
})();

const initialSheetPage = (() => {
  const saved = Number(store.get('sheetPage', 1));
  if (!Number.isFinite(saved)) return 1;
  return Math.max(1, Math.min(initialPages.length, Math.round(saved)));
})();

const initialState = {
  page: PAGE_TITLES[initialPage] ? initialPage : 'home',
  dialog: null,
  confirm: null,
  railOpen: false,
  panelRightOpen: false,
  projectName: store.get('projectName', 'Proyek Tanpa Judul'),
  pages: initialPages,
  selectedPinId: null,
  selectedPinIds: [],
  toggles: initialToggles,
  zoom: clampZoom(initialZoom),
  sheetPage: initialSheetPage,
  assetQuery: '',
  cropQueue: [],
  assets: store.get('assets', INITIAL_ASSETS),
  galleryCards: store.get('gallery', GALLERY_CARDS),
  presets: store.get('presets', PRESETS),
  projects: store.get('projects', HISTORY_ROWS),
  versions: store.get('versions', RESTORE_VERSIONS),
  inspector: initialInspector,
  settings: { ...DEFAULT_SETTINGS, ...(store.get('settings') || {}) },
  settingsTab: 'tampilan',
  previewDpi: '300',
  previewPage: 1,
  stats: store.get('stats', { exports: 0 }),
  saveState: 'idle',
  lastSavedAt: store.get('savedAt', null),
  undoStack: [],
  redoStack: [],
};

/* Everything the undo stack can restore. */
function snapshot(state) {
  return {
    pages: state.pages,
    assets: state.assets,
    galleryCards: state.galleryCards,
    presets: state.presets,
    projects: state.projects,
    projectName: state.projectName,
    toggles: state.toggles,
    zoom: state.zoom,
    inspector: state.inspector,
    selectedPinId: state.selectedPinId,
    selectedPinIds: state.selectedPinIds || (state.selectedPinId ? [state.selectedPinId] : []),
  };
}

function syncPrimary(state) {
  const ids = Array.isArray(state.selectedPinIds)
    ? state.selectedPinIds
    : state.selectedPinId ? [state.selectedPinId] : [];
  return { ...state, selectedPinIds: ids, selectedPinId: ids[0] || null };
}

function activePins(stateOrPages, sheetPage) {
  const pages = Array.isArray(stateOrPages) ? stateOrPages : (stateOrPages?.pages || []);
  const pageNum = sheetPage !== undefined ? sheetPage : stateOrPages?.sheetPage;
  const index = Math.min(Math.max(Number(pageNum) || 1, 1), pages.length) - 1;
  return (pages[index] && pages[index].pins) || [];
}

/* Rewrite the pins of the page that is currently open. */
function withPins(state, updater) {
  const index = Math.min(Math.max(state.sheetPage, 1), state.pages.length) - 1;
  return {
    ...state,
    pages: state.pages.map((page, i) => (i === index ? { ...page, pins: updater(page.pins) } : page)),
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
      /* Closing always drops a pending confirmation so it cannot go stale. */
      return { ...state, dialog: null, confirm: null };
    case 'setConfirm':
      return { ...state, confirm: action.value, dialog: action.value ? 'dlg-confirm' : null };
    case 'renameProject':
      return { ...state, projectName: action.name || state.projectName };

    /* ── pages ── */
    case 'setSheetPage': {
      const page = Math.max(1, Math.min(state.pages.length, action.page));
      const pins = state.pages[page - 1].pins;
      const keep = (state.selectedPinIds || []).filter((id) => pins.some((pin) => pin.id === id));
      return syncPrimary({ ...state, sheetPage: page, selectedPinIds: keep });
    }
    case 'addSheetPage': {
      const id = 'page-' + Date.now().toString(36);
      return syncPrimary({
        ...state,
        pages: [...state.pages, { id, pins: [] }],
        sheetPage: state.pages.length + 1,
        selectedPinIds: [],
      });
    }
    case 'removeSheetPage': {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter((_, i) => i !== state.sheetPage - 1);
      const sheetPage = Math.min(state.sheetPage, pages.length);
      const keep = (state.selectedPinIds || []).filter((id) => pages[sheetPage - 1].pins.some((pin) => pin.id === id));
      return syncPrimary({ ...state, pages, sheetPage, selectedPinIds: keep });
    }
    case 'replacePages':
      return syncPrimary({
        ...state,
        pages: action.pages,
        sheetPage: Math.min(Math.max(state.sheetPage, 1), action.pages.length),
        selectedPinIds: action.selectedPinId !== undefined
          ? (action.selectedPinId ? [action.selectedPinId] : [])
          : (state.selectedPinIds || []).filter((id) => action.pages.flatMap((p) => p.pins).some((p) => p.id === id)),
        inspector: action.inspector || state.inspector,
      });

    /* ── editor ── */
    case 'toggleLayer':
      return { ...state, toggles: { ...state.toggles, [action.key]: !state.toggles[action.key] } };
    case 'setToggle':
      return { ...state, toggles: { ...state.toggles, [action.key]: action.value } };
    case 'setZoom':
      return { ...state, zoom: clampZoom(action.zoom) };
    case 'selectPin': {
      const found = (state.pages.flatMap((p) => p.pins) || []).find((p) => p.id === action.id);
      return syncPrimary({
        ...state,
        selectedPinIds: action.id ? [action.id] : [],
        inspector: action.id && found
          ? {
            ...state.inspector,
            posX: action.x ?? found.x ?? state.inspector.posX,
            posY: action.y ?? found.y ?? state.inspector.posY,
            rotate: found.rotate ?? state.inspector.rotate,
          }
          : state.inspector,
      });
    }
    case 'togglePinSelection': {
      const ids = state.selectedPinIds || [];
      const exists = (state.pages.flatMap((p) => p.pins) || []).some((p) => p.id === action.id);
      if (!action.id || !exists) return state;
      const next = ids.includes(action.id) ? ids.filter((id) => id !== action.id) : [...ids, action.id];
      return syncPrimary({ ...state, selectedPinIds: next });
    }
    case 'setSelection': {
      const valid = new Set((state.pages.flatMap((p) => p.pins) || []).map((p) => p.id));
      const next = (action.ids || []).filter((id) => valid.has(id));
      return syncPrimary({ ...state, selectedPinIds: next });
    }
    case 'clearSelection':
      return syncPrimary({ ...state, selectedPinIds: [] });
    case 'movePin': {
      const ids = state.selectedPinIds || [];
      if (ids.length > 1 && ids.includes(action.id)) {
        const all = state.pages.flatMap((p) => p.pins);
        const dragged = all.find((p) => p.id === action.id);
        if (!dragged) return state;
        const dx = action.x - dragged.x;
        const dy = action.y - dragged.y;
        if (!dx && !dy) return state;
        const set = new Set(ids);
        return withPins(state, (pins) => pins.map(
          (pin) => (set.has(pin.id) && !pin.locked ? { ...pin, x: pin.x + dx, y: pin.y + dy } : pin),
        ));
      }
      return withPins(state, (pins) => pins.map(
        (pin) => (pin.id === action.id ? { ...pin, x: action.x, y: action.y } : pin),
      ));
    }
    case 'removeSelectedPin': {
      const ids = state.selectedPinIds && state.selectedPinIds.length
        ? state.selectedPinIds
        : (state.selectedPinId ? [state.selectedPinId] : []);
      if (!ids.length) return state;
      const set = new Set(ids);
      return syncPrimary({
        ...withPins(state, (pins) => pins.filter((pin) => !set.has(pin.id))),
        selectedPinIds: [],
      });
    }
    case 'duplicateSelectedPin': {
      const pins = activePins(state);
      const ids = state.selectedPinIds && state.selectedPinIds.length
        ? state.selectedPinIds
        : (state.selectedPinId ? [state.selectedPinId] : []);
      const targets = pins.filter((pin) => ids.includes(pin.id));
      if (!targets.length) return state;
      const copies = targets.map((selected, k) => ({
        ...selected,
        id: 'p' + Date.now().toString(36) + '-' + k,
        x: selected.x + 18,
        y: selected.y + 18,
        locked: false,
      }));
      return syncPrimary({
        ...withPins(state, (list) => [...list, ...copies]),
        selectedPinIds: copies.map((c) => c.id),
      });
    }
    case 'duplicateSelectedPinCount': {
      const pins = activePins(state);
      const selected = pins.find((pin) => pin.id === state.selectedPinId);
      const n = Math.max(1, Math.min(200, Math.floor(Number(action.count) || 0)));
      if (!selected || !n) return state;
      const sheetPx = paperSizePx(state.inspector);
      const { cells } = freePackingCells(pins, state.inspector, sheetPx, selected.size);
      const ranked = cells
        .map((c) => ({ ...c, d: Math.hypot(c.x - selected.x, c.y - selected.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, n);
      if (!ranked.length) return state;
      const copies = ranked.map((cell, i) => ({
        ...selected,
        id: 'p' + Date.now().toString(36) + '-' + i,
        x: cell.x,
        y: cell.y,
        locked: false,
      }));
      const last = copies[copies.length - 1];
      return { ...withPins(state, (list) => [...list, ...copies]), selectedPinId: last ? last.id : state.selectedPinId };
    }
    case 'updateSelectedPin': {
      const patch = action.patch;
      const ids = state.selectedPinIds && state.selectedPinIds.length
        ? state.selectedPinIds
        : (state.selectedPinId ? [state.selectedPinId] : []);
      const set = new Set(ids);
      return withPins(state, (pins) => pins.map(
        (pin) => (set.has(pin.id) ? { ...pin, ...patch } : pin),
      ));
    }
    case 'setCropQueue':
      return { ...state, cropQueue: action.queue || [] };
    case 'replaceSelectedPin': {
      const asset = action.asset;
      const ids = state.selectedPinIds && state.selectedPinIds.length
        ? state.selectedPinIds
        : (state.selectedPinId ? [state.selectedPinId] : []);
      const set = new Set(ids);
      return withPins(state, (pins) => pins.map((pin) => (set.has(pin.id)
        ? { ...pin, art: asset.art, icon: asset.icon, label: asset.name.replace(/\.[a-z0-9]+$/i, '') }
        : pin)));
    }
    case 'setInspector':
      return { ...state, inspector: { ...state.inspector, ...action.patch } };
    case 'setLockAll': {
      const ids = state.selectedPinIds && state.selectedPinIds.length
        ? state.selectedPinIds
        : (state.selectedPinId ? [state.selectedPinId] : []);
      const lockSet = new Set(ids);
      return {
        ...state,
        inspector: { ...state.inspector, lock: action.on },
        pages: state.pages.map((page, index) => (index !== state.sheetPage - 1 ? page : {
          ...page,
          pins: page.pins.map((pin) => (lockSet.has(pin.id) ? { ...pin, locked: action.on } : pin)),
        })),
      };
    }
    case 'applyInspector':
      return withPins(state, (pins) => gridPins(pins, state.inspector, 'origin'));
    case 'centerLayout':
      return withPins(state, (pins) => gridPins(pins, state.inspector, 'center'));
    case 'resetLayout':
      return syncPrimary({
        ...state,
        pages: state.pages.map((page, index) => (index === state.sheetPage - 1
          ? { ...page, pins: [] }
          : page)),
        selectedPinIds: [],
        inspector: DEFAULT_INSPECTOR,
      });
    case 'clearPagePins':
      return syncPrimary({ ...withPins(state, () => []), selectedPinIds: [] });

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
    case 'addAssets':
      return { ...state, assets: [...action.assets, ...state.assets] };
    case 'removeAssets':
      return {
        ...state,
        assets: state.assets.filter((a) => !action.ids.includes(a.id)),
      };
    case 'removeGalleryCards':
      return { ...state, galleryCards: state.galleryCards.filter((c) => !action.ids.includes(c.id)) };
    case 'resetCollections':
      return { ...state, assets: INITIAL_ASSETS, galleryCards: GALLERY_CARDS, presets: PRESETS, projects: HISTORY_ROWS };
    case 'resetToEmptyCollections':
      return { ...state, assets: [], galleryCards: [], projects: [], versions: [] };
    case 'resetToDefaultCollections':
      return {
        ...state, assets: INITIAL_ASSETS, galleryCards: GALLERY_CARDS, presets: PRESETS,
        projects: HISTORY_ROWS, versions: RESTORE_VERSIONS,
      };
    case 'resetPrefs':
      return {
        ...state, toggles: DEFAULT_TOGGLES, zoom: 78, inspector: DEFAULT_INSPECTOR,
        settings: DEFAULT_SETTINGS, sheetPage: 1,
      };
    case 'markAssetsPlaced':
      return {
        ...state,
        assets: state.assets.map((a) => (action.ids.includes(a.id)
          ? { ...a, status: 'placed', inLayout: a.inLayout || 1 }
          : a)),
      };

    /* ── gallery ── */
    case 'addGalleryCards':
      return { ...state, galleryCards: [...action.cards, ...state.galleryCards] };
    /* Restore memulihkan, bukan menumpuk: koleksi diganti isi backup. */
    case 'replaceCollections':
      return {
        ...state,
        assets: Array.isArray(action.assets) ? action.assets : state.assets,
        galleryCards: Array.isArray(action.galleryCards) ? action.galleryCards : state.galleryCards,
      };
    case 'removeGalleryCard':
      return { ...state, galleryCards: state.galleryCards.filter((c) => c.id !== action.id) };
    case 'duplicateGalleryCard': {
      const source = state.galleryCards.find((c) => c.id === action.id);
      if (!source) return state;
      const copy = { ...source, id: 'g' + Date.now().toString(36), name: source.name, selected: true, checked: false };
      const index = state.galleryCards.findIndex((c) => c.id === action.id);
      const galleryCards = [...state.galleryCards];
      galleryCards.splice(index + 1, 0, copy);
      return { ...state, galleryCards };
    }
    case 'toggleGalleryCheck':
      return {
        ...state,
        galleryCards: state.galleryCards.map((c) => (c.id === action.id
          ? { ...c, checked: !c.checked, selected: true }
          : c)),
      };

    /* ── presets ── */
    case 'addPreset':
      return { ...state, presets: [...state.presets, action.preset] };
    case 'updatePreset':
      return {
        ...state,
        presets: state.presets.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case 'removePreset':
      return { ...state, presets: state.presets.filter((p) => p.id !== action.id) };
    case 'duplicatePreset': {
      const source = state.presets.find((p) => p.id === action.id);
      if (!source) return state;
      const copy = {
        ...source,
        id: 'preset-' + Date.now().toString(36),
        title: source.title + ' (salinan)',
        badge: { kind: 'tag', text: 'Salinan' },
        builtin: false,
        confirm: 'Hapus preset ' + source.title + ' (salinan)?',
      };
      return { ...state, presets: [...state.presets, copy] };
    }

    /* ── projects / history ── */
    case 'upsertProject': {
      const entry = action.project;
      const exists = state.projects.some((p) => p.name === entry.name);
      const projects = exists
        ? state.projects.map((p) => (p.name === entry.name ? { ...p, ...entry } : p))
        : [entry, ...state.projects];
      return { ...state, projects };
    }
    case 'removeProject':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) };
    case 'duplicateProject': {
      const source = state.projects.find((p) => p.id === action.id);
      if (!source) return state;
      const copy = {
        ...source,
        id: 'pr' + Date.now().toString(36),
        name: action.name || (source.name + ' (salinan)'),
        changed: 'Baru saja',
      };
      return { ...state, projects: [copy, ...state.projects] };
    }
    case 'setVersions':
      return { ...state, versions: action.versions };

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
      return { ...state, previewPage: Math.max(1, Math.min(state.pages.length, action.page)) };
    case 'setStats':
      return { ...state, stats: { ...state.stats, ...action.patch } };

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
      const merged = syncPrimary({ ...state, ...prev });
      return {
        ...merged,
        sheetPage: Math.min(merged.sheetPage, merged.pages.length),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, snapshot(state)],
      };
    }
    case 'redo': {
      if (!state.redoStack.length) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const merged = syncPrimary({ ...state, ...next });
      return {
        ...merged,
        sheetPage: Math.min(merged.sheetPage, merged.pages.length),
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
  const dirtyRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  const pins = useMemo(() => activePins(state.pages, state.sheetPage), [state.pages, state.sheetPage]);
  const sheetTotal = state.pages.length;
  const currentPage = Math.min(state.sheetPage, sheetTotal);
  const sheetSize = useMemo(() => paperSizePx(state.inspector), [state.inspector]);

  /* Geometric packing info for the active page (drives bulk-duplicate capacity). */
  const packingInfo = useMemo(() => {
    const sel = pins.find((p) => p.id === state.selectedPinId);
    const size = sel?.size || pinSizeFromCut(cutMmOf(state.inspector));
    const { grid, cells } = freePackingCells(pins, state.inspector, sheetSize, size);
    return {
      size,
      colsFit: grid.colsFit,
      rowsFit: grid.rowsFit,
      total: grid.total,
      used: pins.length,
      free: cells.length,
    };
  }, [pins, state.selectedPinId, state.inspector, sheetSize]);

  /* ── document title ── */
  useEffect(() => {
    document.title = 'Pin Print Studio — ' + (PAGE_TITLES[state.page] || 'Studio');
  }, [state.page]);

  /* ── persistence ── */
  const persistCollections = state.settings.cache !== false;
  useEffect(() => { store.set('page', state.page); }, [state.page]);
  useEffect(() => { store.set('toggles', state.toggles); }, [state.toggles]);
  useEffect(() => { store.set('zoom', state.zoom); }, [state.zoom]);
  useEffect(() => { store.set('sheetPage', currentPage); }, [currentPage]);
  useEffect(() => { store.set('hasUndo', state.undoStack.length > 0); }, [state.undoStack.length]);
  useEffect(() => { store.set('projectName', state.projectName); }, [state.projectName]);
  useEffect(() => { store.set('settings', state.settings); }, [state.settings]);
  useEffect(() => { store.set('inspector', state.inspector); }, [state.inspector]);
  useEffect(() => { store.set('stats', state.stats); }, [state.stats]);
  useEffect(() => {
    if (!persistCollections) return;
    store.set('pages', state.pages);
    store.set('assets', state.assets);
    store.set('gallery', state.galleryCards);
    store.set('presets', state.presets);
    store.set('projects', state.projects);
    store.set('versions', state.versions);
  }, [persistCollections, state.pages, state.assets, state.galleryCards, state.presets, state.projects, state.versions]);

  useEffect(() => () => {
    window.clearTimeout(saveTimer.current);
    window.clearInterval(exportTimer.current);
    window.clearInterval(backupTimer.current);
  }, []);

  /* ── save: snapshot the project into the history list + version stack ── */
  const commitSave = useCallback((silent) => {
    dispatch({ type: 'saving' });
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const at = Date.now();
      const current = stateRef.current;
      const designCount = current.pages.reduce((total, page) => total + page.pins.length, 0);
      const sizeMb = Math.max(0.4, Math.round((designCount * 0.22 + current.pages.length * 0.3) * 10) / 10);
      store.set('savedAt', at);
      dispatch({
        type: 'upsertProject',
        project: {
          id: 'pr-' + String(current.projectName).replace(/\s+/g, '-').toLowerCase(),
          name: current.projectName,
          paper: paperLabelOf(current.inspector.paper),
          designs: String(designCount),
          changed: 'Baru saja',
          size: String(sizeMb).replace('.', ',') + ' MB',
          pages: current.pages,
          inspector: current.inspector,
        },
      });
      dispatch({
        type: 'setVersions',
        versions: [
          {
            id: 'v-' + at,
            time: formatVersionTime(new Date(at)),
            meta: designCount + ' desain · ' + current.pages.length + ' halaman',
            payload: current.pages,
          },
          ...current.versions.filter((v) => v.payload || VERSION_SEED_PAYLOAD[v.id]).slice(0, 9),
        ],
      });
      dispatch({ type: 'saved', at });
      dirtyRef.current = false;
      if (!silent) dispatch({ type: 'setStats', patch: { lastSaved: at } });
    }, 900);
  }, []);

  /* ── autosave every two minutes while dirty ── */
  useEffect(() => {
    if (!state.settings.autosave) return undefined;
    const id = window.setInterval(() => {
      if (dirtyRef.current) commitSave(true);
    }, 120000);
    return () => window.clearInterval(id);
  }, [state.settings.autosave, commitSave]);

  /* ── progress runners (export + backup dialogs) ── */
  const runProgress = useCallback(async (setter, notes, work, timerRef, finish) => {
    window.clearInterval(timerRef.current);
    setter({ pct: 8, note: notes[0] });
    await new Promise((resolve) => {
      let step = 0;
      timerRef.current = window.setInterval(() => {
        step += 1;
        const pct = Math.min(100, 8 + step * 23);
        const note = pct >= 100 ? 'Selesai.' : notes[Math.min(notes.length - 1, Math.floor(step / 2))];
        setter({ pct, note });
        if (pct >= 100) {
          window.clearInterval(timerRef.current);
          resolve();
        }
      }, 260);
    });
    try {
      await work();
    } finally {
      window.setTimeout(() => {
        setter(null);
        dispatch({ type: 'closeDialog' });
        if (typeof finish === 'function') finish();
      }, 420);
    }
  }, []);

  const pushHistory = useCallback((current) => {
    dispatch({ type: 'pushHistory', snapshot: snapshot(current) });
  }, []);

  const exportPagesPayload = useCallback((current, overrides) => {
    const cut = cutMmOf(current.inspector);
    const photo = Number(current.inspector.photoSizeMm) || 47;
    const photoRatio = Math.max(0.3, Math.min(1, photo / Math.max(1, cut)));
    const ov = overrides || {};
    /* Final output is always clean: no proof numbers / filenames unless
       the export dialog explicitly enables them for this run. */
    const toggles = {
      ...current.toggles,
      number: Boolean(ov.number),
      filename: false,
      ...(ov.toggles || {}),
    };
    if (ov.bleed !== undefined) toggles.bleed = Boolean(ov.bleed);
    return current.pages.map((page) => ({
      pins: page.pins,
      toggles,
      cutStyle: current.inspector.cutStyle === 'dashed' ? 'dashed' : 'solid',
      photoRatio,
    }));
  }, []);

  const actions = useMemo(() => {
    const touch = () => { dirtyRef.current = true; };

    const runExport = async (format, options) => {
      const current = stateRef.current;
      const opts = options || {};
      const dpi = opts.dpi || current.settings.dpi;
      const paper = current.inspector.paper;
      const cropmark = opts.cropmark ?? current.settings.cropmark;
      const transparent = Boolean(opts.transparent);
      const cutStyle = current.inspector.cutStyle === 'dashed' ? 'dashed' : 'solid';
      const cut = cutMmOf(current.inspector);
      const photo = Number(current.inspector.photoSizeMm) || 47;
      const photoRatio = Math.max(0.3, Math.min(1, photo / Math.max(1, cut)));
      const allPages = exportPagesPayload(current, { number: opts.number, bleed: opts.bleed });
      const want = opts.pages || 'all';
      const pagesPayload = want === 'current'
        ? [allPages[Math.min(Math.max(current.sheetPage, 1), allPages.length) - 1]].filter(Boolean)
        : allPages;
      const names = [];
      const doPdf = async () => {
        const fileName = resolveFileName(current.settings.name, {
          project: current.projectName, pages: pagesPayload.length, ext: 'pdf',
        });
        const blob = await renderPdf({
          pages: pagesPayload,
          paper,
          orientation: current.inspector.orientation,
          customWidth: current.inspector.customWidth,
          customHeight: current.inspector.customHeight,
          dpi,
          cmyk: current.settings.cmyk,
          cropmark,
          cutStyle,
          photoRatio,
        });
        downloadBlob(blob, fileName);
        names.push(fileName);
      };
      const doPng = async () => {
        for (let i = 0; i < pagesPayload.length; i += 1) {
          const page = pagesPayload[i];
          const fileName = resolveFileName(current.settings.name, {
            project: current.projectName, pages: pagesPayload.length, ext: 'png',
          });
          /* Separate page suffix when exporting several PNGs. */
          const suffixed = pagesPayload.length > 1
            ? fileName.replace(/\.png$/i, '-hal' + (i + 1) + '.png')
            : fileName;
          const blob = await renderSheetPng({
            pins: page.pins, toggles: page.toggles || current.toggles,
            paper,
            orientation: current.inspector.orientation,
            customWidth: current.inspector.customWidth,
            customHeight: current.inspector.customHeight,
            dpi, cropmark, cutStyle, photoRatio, transparent,
          });
          downloadBlob(blob, suffixed);
          names.push(suffixed);
        }
      };
      if (format === 'PNG') await doPng();
      else if (format === 'BOTH') { await doPdf(); await doPng(); }
      else await doPdf();
      dispatch({ type: 'setStats', patch: { exports: (current.stats.exports || 0) + 1 } });
      return names.join(', ');
    };

    const exportBackup = () => {
      const current = stateRef.current;
      const payload = {
        app: 'pin-print-studio',
        version: 1,
        exportedAt: new Date().toISOString(),
        project: current.projectName,
        inspector: current.inspector,
        settings: current.settings,
        pages: current.pages,
        assets: current.assets.map((a) => ({ ...a, url: undefined })),
        gallery: current.galleryCards.map((c) => ({ ...c, url: undefined })),
        presets: current.presets,
        projects: current.projects,
        versions: current.versions.map((v) => ({ ...v, payload: v.payload ? true : undefined })),
      };
      const name = resolveFileName(current.settings.name, {
        project: current.projectName, pages: current.pages.length, ext: 'pinzip',
      });
      downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), name);
      return { name, payload };
    };

    return {
      ...state,
      pins,
      sheetTotal,
      sheetPage: currentPage,
      sheetSize,
      packingInfo,
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
      requestConfirm: (payload) => dispatch({
        type: 'setConfirm',
        value: {
          message: payload.message,
          note: payload.note,
          toast: payload.toast,
          nav: payload.nav,
          onConfirm: payload.onConfirm,
        },
      }),
      resolveConfirm: () => {
        const pending = state.confirm;
        dispatch({ type: 'setConfirm', value: null });
        if (!pending) return;
        if (typeof pending.onConfirm === 'function') pending.onConfirm();
        toast(pending.toast || 'Tindakan selesai.', 'ok');
        if (pending.nav) dispatch({ type: 'nav', page: pending.nav });
      },

      /* editor */
      toggleLayer: (key) => {
        pushHistory(state);
        dispatch({ type: 'toggleLayer', key });
        if (key === 'grid') dispatch({ type: 'setSettings', patch: { grid: !state.toggles.grid } });
        touch();
        toast(TOGGLE_LABEL[key] + ' ' + (state.toggles[key] ? 'disembunyikan' : 'ditampilkan') + '.', 'info');
      },
      zoomBy: (delta) => dispatch({ type: 'setZoom', zoom: state.zoom + delta }),
      setZoom: (zoom) => dispatch({ type: 'setZoom', zoom }),
      gotoSheetPage: (page) => dispatch({ type: 'setSheetPage', page }),
      setSheetPage: (page) => dispatch({ type: 'setSheetPage', page }),
      addSheetPage: () => {
        pushHistory(state);
        dispatch({ type: 'addSheetPage' });
        touch();
        commitSave();
        toast('Halaman baru ditambahkan.', 'ok');
      },
      removeSheetPage: () => {
        if (state.pages.length <= 1) {
          toast('Minimal satu halaman harus tersisa.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'removeSheetPage' });
        touch();
        commitSave();
        toast('Halaman dihapus.', 'ok');
      },
      selectPin: (id, additive) => {
        if (additive && id) {
          dispatch({ type: 'togglePinSelection', id });
          return;
        }
        if (!id) {
          dispatch({ type: 'selectPin', id: null });
          return;
        }
        const pin = pins.find((p) => p.id === id);
        dispatch({ type: 'selectPin', id, x: pin?.x, y: pin?.y });
      },
      togglePinSelection: (id) => dispatch({ type: 'togglePinSelection', id }),
      setSelection: (ids) => dispatch({ type: 'setSelection', ids }),
      clearSelection: () => dispatch({ type: 'clearSelection' }),
      movePin: (id, x, y) => {
        const snap = stateRef.current.inspector?.snap;
        const nx = snap ? Math.round(Number(x) / 25) * 25 : Math.round(x);
        const ny = snap ? Math.round(Number(y) / 25) * 25 : Math.round(y);
        dispatch({ type: 'movePin', id, x: nx, y: ny });
        dispatch({ type: 'setInspector', patch: { posX: nx, posY: ny } });
        touch();
      },
      removeSelectedPin: () => {
        const ids = state.selectedPinIds && state.selectedPinIds.length
          ? state.selectedPinIds
          : (state.selectedPinId ? [state.selectedPinId] : []);
        if (!ids.length) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'removeSelectedPin' });
        touch();
        commitSave();
        toast(ids.length > 1 ? ids.length + ' desain terpilih dihapus dari layout.' : 'Desain terpilih dihapus dari layout.', 'ok');
      },
      duplicateSelectedPin: () => {
        const ids = state.selectedPinIds && state.selectedPinIds.length
          ? state.selectedPinIds
          : (state.selectedPinId ? [state.selectedPinId] : []);
        if (!ids.length) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'duplicateSelectedPin' });
        touch();
        commitSave();
        toast(ids.length > 1 ? ids.length + ' desain diduplikat.' : 'Desain diduplikat.', 'ok');
      },
      duplicateSelectedPinCount: (count) => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        const sel = pins.find((p) => p.id === state.selectedPinId);
        const size = sel?.size || pinSizeFromCut(cutMmOf(state.inspector));
        const { cells } = freePackingCells(pins, state.inspector, sheetSize, size);
        if (!cells.length) {
          toast('Kertas penuh — tidak ada ruang untuk pin ukuran ini. Kecilkan ukuran/margin atau tambah halaman.', 'err');
          return;
        }
        const want = Math.max(1, Math.min(200, Math.floor(Number(count) || 0)));
        if (!want) {
          toast('Jumlah tidak valid.', 'err');
          return;
        }
        const n = Math.min(want, cells.length);
        pushHistory(state);
        dispatch({ type: 'duplicateSelectedPinCount', count: n });
        touch();
        commitSave();
        toast(n === want
          ? n + ' salinan ditambahkan ke layout.'
          : 'Hanya ' + n + ' yang muat — sisa ruang kertas habis.', n === want ? 'ok' : 'info');
      },
      setInspector: (patch) => {
        const nextInspector = { ...stateRef.current.inspector, ...patch };
        dispatch({ type: 'setInspector', patch });
        const selId = stateRef.current.selectedPinId;
        if (selId) {
          const live = {};
          if (patch.rotate !== undefined) live.rotate = Number(patch.rotate) || 0;
          if (patch.posX !== undefined) live.x = Number(patch.posX) || 0;
          if (patch.posY !== undefined) live.y = Number(patch.posY) || 0;
          if (Object.keys(live).length) {
            dispatch({ type: 'updateSelectedPin', patch: live });
          }
        }
        const layoutKeys = ['paper', 'orientation', 'margin', 'gap', 'rows', 'cols', 'customWidth', 'customHeight'];
        if (Object.keys(patch).some((k) => layoutKeys.includes(k))) {
          const current = stateRef.current;
          const idx = Math.min(Math.max(current.sheetPage, 1), current.pages.length) - 1;
          const newPins = gridPins(current.pages[idx]?.pins || [], nextInspector, 'origin');
          const keepId = current.selectedPinId && newPins.some((p) => p.id === current.selectedPinId)
            ? current.selectedPinId
            : null;
          dispatch({
            type: 'replacePages',
            pages: current.pages.map((page, i) => (i === idx ? { ...page, pins: newPins } : page)),
            inspector: nextInspector,
            selectedPinId: keepId,
          });
        }
        touch();
      },
      applyInspector: () => {
        pushHistory(state);
        dispatch({ type: 'applyInspector' });
        touch();
        commitSave();
        toast('Pengaturan diterapkan ke layout.', 'ok');
      },
      applySelected: () => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({
          type: 'updateSelectedPin',
          patch: {
            size: pinSizeFromCut(state.inspector.cutSizeMm ?? state.inspector.diameter),
            x: Number(state.inspector.posX) || 0,
            y: Number(state.inspector.posY) || 0,
            rotate: Number(state.inspector.rotate) || 0,
          },
        });
        touch();
        commitSave();
        toast('Pengaturan diterapkan ke 1 desain terpilih.', 'ok');
      },
      applySelectedImage: (patch) => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'updateSelectedPin', patch });
        touch();
        commitSave();
      },
      toggleCrop: () => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        const pin = pins.find((p) => p.id === state.selectedPinId);
        const next = !pin?.crop;
        pushHistory(state);
        dispatch({ type: 'updateSelectedPin', patch: { crop: next } });
        touch();
        toast(next ? 'Crop aktif: gambar memenuhi lingkaran (cover).' : 'Crop mati: gambar muat penuh (contain).', 'info');
      },
      rotateSelected: (delta) => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        const cur = Number(state.inspector.rotate) || 0;
        const next = Math.max(-180, Math.min(180, cur + delta));
        pushHistory(state);
        dispatch({ type: 'setInspector', patch: { rotate: next } });
        dispatch({ type: 'updateSelectedPin', patch: { rotate: next } });
        touch();
        commitSave();
      },
      centerSelectedImage: () => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        const current = stateRef.current;
        const { w: sheetW, h: sheetH } = paperSizePx(current.inspector);
        const pin = current.pages.flatMap((p) => p.pins).find((p) => p.id === current.selectedPinId);
        const size = pin?.size || 150;
        const cx = Math.round(sheetW / 2 - size / 2);
        const cy = Math.round(sheetH / 2 - size / 2);
        pushHistory(state);
        dispatch({ type: 'setInspector', patch: { posX: cx, posY: cy } });
        dispatch({ type: 'updateSelectedPin', patch: { x: cx, y: cy } });
        touch();
        commitSave();
        toast('Gambar dipusatkan di tengah kertas.', 'ok');
      },
      resetSelectedImage: () => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'setInspector', patch: { posX: 60, posY: 60, rotate: 0 } });
        dispatch({ type: 'updateSelectedPin', patch: { x: 60, y: 60, rotate: 0 } });
        touch();
        commitSave();
        toast('Posisi gambar direset.', 'ok');
      },
      centerLayout: () => {
        pushHistory(state);
        dispatch({ type: 'centerLayout' });
        touch();
        commitSave();
        toast('Layout halaman dipusatkan pada kertas.', 'ok');
      },
      resetLayout: () => {
        pushHistory(state);
        dispatch({ type: 'resetLayout' });
        touch();
        commitSave();
        toast('Layout halaman dikosongkan.', 'ok');
      },
      setLock: (on) => {
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'setLockAll', on });
        touch();
        toast(on ? 'Posisi desain dikunci.' : 'Kunci posisi dibuka.', 'info');
      },

      /* assets */
      setAssetQuery: (query) => dispatch({ type: 'setAssetQuery', query }),
      toggleAsset: (id) => {
        pushHistory(state);
        dispatch({ type: 'toggleAsset', id });
        touch();
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
      addAssets: async (files, options) => {
        const list = Array.from(files || []);
        if (!list.length) {
          toast('Pilih berkas gambar terlebih dahulu.', 'err');
          return [];
        }
        const opts = options || {};
        const created = [];
        for (let i = 0; i < list.length; i += 1) {
          const file = list[i];
          const size = await imageDimensions(file);
          const ext = (file.name.split('.').pop() || '').toUpperCase();
          const index = state.assets.length + i;
          const art = ART_PALETTE[index % ART_PALETTE.length];
          const icon = ICON_PALETTE[index % ICON_PALETTE.length];
          created.push({
            id: 'a' + Date.now().toString(36) + i,
            name: file.name,
            meta: ext + ' · ' + (size.width ? size.width + '×' + size.height : Math.max(1, Math.round(file.size / 1024)) + ' KB'),
            status: opts.toLayout ? 'placed' : 'unplaced',
            order: 10 + i,
            inLayout: opts.toLayout ? 1 : 0,
            art,
            icon,
            selected: false,
            url: URL.createObjectURL(file),
          });
        }
        pushHistory(state);
        dispatch({ type: 'addAssets', assets: created });
        dispatch({
          type: 'addGalleryCards',
          cards: created.map((asset) => ({
            id: 'g' + asset.id,
            name: asset.name,
            format: (asset.name.split('.').pop() || '').toUpperCase(),
            size: (asset.meta.split('· ')[1] || '').replace(' vektor', ''),
            art: asset.art,
            icon: asset.icon,
            checked: false,
            selected: false,
            status: opts.toLayout ? null : 'unplaced',
            url: asset.url,
          })),
        });
        if (opts.toLayout) {
          const newPins = created.map((asset, i) => makePin(asset, i, asset.art, asset.icon, asset.name.replace(/\.[a-z0-9]+$/i, '')));
          dispatch({ type: 'replacePages', pages: state.pages.map((page, i) => (i === currentPage - 1 ? { ...page, pins: [...page.pins, ...newPins] } : page)) });
        }
        touch();
        commitSave();
        toast(created.length + ' gambar berhasil diunggah.', 'ok');
        return created;
      },
      removeAssets: (ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        pushHistory(state);
        dispatch({ type: 'removeAssets', ids: list });
        dispatch({ type: 'removeGalleryCards', ids: list });
        touch();
        commitSave();
        toast('Desain dihapus dari proyek.', 'ok');
      },
      removeSelectedAssets: () => {
        const ids = state.assets.filter((a) => a.selected).map((a) => a.id);
        if (!ids.length) {
          toast('Pilih desain pada panel kiri terlebih dahulu.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'removeAssets', ids });
        touch();
        commitSave();
        toast(ids.length + ' desain dihapus dari proyek.', 'ok');
      },
      addSelectedAssetsToLayout: () => {
        const chosen = state.assets.filter((a) => a.selected);
        if (!chosen.length) {
          toast('Pilih desain pada panel kiri terlebih dahulu.', 'err');
          return;
        }
        dispatch({ type: 'setCropQueue', queue: chosen.map((a) => ({ id: a.id, name: a.name, url: a.url, art: a.art, icon: a.icon })) });
        dispatch({ type: 'openDialog', id: 'dlg-crop11' });
        toast('Atur crop 1:1 untuk ' + chosen.length + ' desain.', 'info');
      },
      shiftCropQueue: () => {
        const q = stateRef.current.cropQueue || [];
        dispatch({ type: 'setCropQueue', queue: q.slice(1) });
        if (q.length <= 1) dispatch({ type: 'closeDialog' });
      },
      addCroppedPin: (asset, crop) => {
        if (!asset) return;
        const c = crop || {};
        const pin = makePin(asset, 0, asset.art, asset.icon, String(asset.name || '').replace(/\.[a-z0-9]+$/i, ''), {
          crop: true,
          cropX: c.x ?? 50,
          cropY: c.y ?? 50,
          cropZoom: c.zoom ?? 100,
          locked: !!c.locked,
        });
        const current = stateRef.current;
        pushHistory(current);
        dispatch({
          type: 'replacePages',
          pages: current.pages.map((page, i) => (i === current.sheetPage - 1 ? { ...page, pins: [...page.pins, pin] } : page)),
          selectedPinId: pin.id,
        });
        dispatch({ type: 'markAssetsPlaced', ids: [asset.id] });
        const q = current.cropQueue || [];
        dispatch({ type: 'setCropQueue', queue: q.slice(1) });
        touch();
        commitSave();
        if (q.length <= 1) dispatch({ type: 'closeDialog' });
      },

      /* gallery */
      toggleGalleryCheck: (id) => dispatch({ type: 'toggleGalleryCheck', id }),
      removeGalleryCard: (id) => {
        pushHistory(state);
        dispatch({ type: 'removeGalleryCard', id });
        touch();
        commitSave();
        toast('Berkas dihapus dari galeri.', 'ok');
      },
      duplicateGalleryCard: (id) => {
        pushHistory(state);
        dispatch({ type: 'duplicateGalleryCard', id });
        touch();
        commitSave();
        toast('Berkas diduplikat.', 'ok');
      },
      addGalleryToProject: () => {
        const checked = state.galleryCards.filter((c) => c.checked);
        if (!checked.length) {
          toast('Pilih berkas yang ingin ditambahkan.', 'err');
          return;
        }
        const newAssets = checked.map((card, i) => ({
          id: 'a' + Date.now().toString(36) + i,
          name: card.name,
          meta: card.format + ' · ' + card.size,
          status: 'unplaced',
          order: 10 + i,
          inLayout: 0,
          art: card.art,
          icon: card.icon,
          selected: false,
        }));
        pushHistory(state);
        dispatch({ type: 'addAssets', assets: newAssets });
        touch();
        commitSave();
        toast(checked.length + ' desain ditambahkan ke proyek aktif.', 'ok');
      },
      replaceSelectedWithAsset: (assetId) => {
        const asset = state.galleryCards.find((c) => c.id === assetId)
          || state.assets.find((a) => a.id === assetId);
        if (!asset) {
          toast('Pilih gambar pengganti terlebih dahulu.', 'err');
          return false;
        }
        if (!state.selectedPinId) {
          toast('Pilih desain pada lembar terlebih dahulu.', 'err');
          return false;
        }
        pushHistory(state);
        dispatch({ type: 'replaceSelectedPin', asset });
        touch();
        commitSave();
        toast('Gambar pada desain terpilih diganti.', 'ok');
        return true;
      },

      /* presets */
      usePreset: (id) => {
        const preset = state.presets.find((p) => p.id === id);
        if (!preset) return;
        const geometry = preset.geometry || {};
        pushHistory(state);
        dispatch({ type: 'setInspector', patch: { ...geometry } });
        dispatch({
          type: 'replacePages',
          pages: state.pages.map((page, i) => (i === currentPage - 1
            ? { ...page, pins: gridPins(page.pins, { ...state.inspector, ...geometry }, 'origin') }
            : page)),
        });
        dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
        touch();
        commitSave();
        toast('Preset "' + preset.title + '" diterapkan ke editor.', 'ok');
      },
      addPreset: (data) => {
        const geometry = {
          paper: data.paper, diameter: Number(data.diameter) || 58, rows: Number(data.rows) || 4,
          cols: Number(data.cols) || 3, gap: Number(data.gap) || 4, margin: Number(data.margin) || 8,
          orientation: 'portrait', bleed: 3,
        };
        const preset = {
          id: 'preset-' + Date.now().toString(36),
          badge: { kind: 'tag', text: 'Baru' },
          meta: paperLabelOf(geometry.paper) + ' · ' + geometry.diameter + 'mm',
          title: data.title,
          body: geometry.rows + ' baris × ' + geometry.cols + ' kolom, jarak ' + geometry.gap + ' mm, margin ' + geometry.margin + ' mm.',
          confirm: 'Hapus preset ' + data.title + '?',
          builtin: false,
          geometry,
        };
        pushHistory(state);
        dispatch({ type: 'addPreset', preset });
        touch();
        commitSave();
        toast('Preset "' + data.title + '" disimpan.', 'ok');
      },
      updatePreset: (id, patch) => {
        pushHistory(state);
        dispatch({ type: 'updatePreset', id, patch });
        touch();
        commitSave();
        toast('Preset diperbarui.', 'ok');
      },
      removePreset: (id) => {
        pushHistory(state);
        dispatch({ type: 'removePreset', id });
        touch();
        commitSave();
        toast('Preset dihapus.', 'ok');
      },
      duplicatePreset: (id) => {
        pushHistory(state);
        dispatch({ type: 'duplicatePreset', id });
        touch();
        commitSave();
        toast('Preset diduplikat.', 'ok');
      },

      /* projects */
      duplicateProject: (id, customName) => {
        pushHistory(state);
        dispatch({ type: 'duplicateProject', id, name: customName });
        touch();
        commitSave();
        toast('Proyek diduplikat.', 'ok');
      },
      removeProject: (id) => {
        pushHistory(state);
        dispatch({ type: 'removeProject', id });
        touch();
        commitSave();
        toast('Proyek dihapus dari riwayat.', 'ok');
      },
      restoreVersion: (id) => {
        const version = state.versions.find((v) => v.id === id);
        const payload = version?.payload || VERSION_SEED_PAYLOAD[id];
        if (!payload) {
          toast('Versi ini tidak memiliki data untuk dipulihkan.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'replacePages', pages: payload, selectedPinId: null });
        touch();
        commitSave();
        toast('Versi ' + String(version?.time || '').replace('Hari ini, ', '') + ' dipulihkan.', 'ok');
      },

      /* settings */
      setSettings: (patch) => {
        if (patch.lang && patch.lang !== 'Bahasa Indonesia') {
          toast('Terjemahan English belum tersedia — antarmuka tetap Bahasa Indonesia.', 'err');
          return;
        }
        dispatch({ type: 'setSettings', patch });
        if (Object.prototype.hasOwnProperty.call(patch, 'grid')) {
          dispatch({ type: 'setToggle', key: 'grid', value: patch.grid });
        }
        touch();
      },
      resetSettings: () => {
        pushHistory(state);
        dispatch({ type: 'resetSettings' });
        dispatch({ type: 'setToggle', key: 'grid', value: DEFAULT_SETTINGS.grid });
        touch();
        toast('Pengaturan dikembalikan ke default.', 'ok');
      },
      setSettingsTab: (tab) => dispatch({ type: 'setSettingsTab', tab }),
      setPreviewDpi: (dpi) => dispatch({ type: 'setPreviewDpi', dpi }),
      setPreviewPage: (page) => dispatch({ type: 'setPreviewPage', page }),

      /* save / rename */
      toastInline: (message, kind = 'info') => toast(message, kind),
      notify: toast,
      save: () => {
        touch();
        commitSave();
        toast('Proyek tersimpan.', 'ok');
      },
      markDirty: () => {
        touch();
        commitSave();
      },
      renameProject: (name) => {
        const clean = String(name || '').trim();
        if (!clean) {
          toast('Nama proyek tidak boleh kosong.', 'err');
          return;
        }
        pushHistory(state);
        dispatch({ type: 'renameProject', name: clean });
        touch();
        commitSave();
        toast('Nama proyek diperbarui.', 'ok');
      },

      /* undo / redo */
      undo: () => {
        if (!state.undoStack.length) {
          toast('Tidak ada tindakan untuk dibatalkan.', 'info');
          return;
        }
        dispatch({ type: 'undo' });
        touch();
        toast('Perubahan diurungkan.', 'info');
      },
      redo: () => {
        if (!state.redoStack.length) {
          toast('Tidak ada tindakan untuk dikembalikan.', 'info');
          return;
        }
        dispatch({ type: 'redo' });
        touch();
        toast('Perubahan diulang.', 'info');
      },

      /* export + backup */
      startExport: (options) => {
        const opts = options || {};
        const format = opts.format === 'PNG' ? 'PNG' : opts.format === 'BOTH' ? 'BOTH' : 'PDF';
        runProgress(
          setExportProgress,
          EXPORT_NOTES,
          () => runExport(format, opts).then((fileName) => {
            toast('Ekspor ' + (format === 'BOTH' ? 'PDF + PNG' : format) + ' selesai — ' + fileName + '.', 'ok');
          }),
          exportTimer,
          () => commitSave(true),
        );
      },
      print: async () => {
        const current = stateRef.current;
        const cut = cutMmOf(current.inspector);
        const photo = Number(current.inspector.photoSizeMm) || 47;
        let ok = false;
        try {
          ok = await printSheets({
            pages: exportPagesPayload(current),
            paper: current.inspector.paper,
            orientation: current.inspector.orientation,
            customWidth: current.inspector.customWidth,
            customHeight: current.inspector.customHeight,
            dpi: current.settings.dpi,
            cropmark: current.settings.cropmark,
            cutStyle: current.inspector.cutStyle === 'dashed' ? 'dashed' : 'solid',
            photoRatio: Math.max(0.3, Math.min(1, photo / Math.max(1, cut))),
          });
        } catch {
          ok = false;
        }
        toast(ok ? 'Dokumen dikirim ke antrean cetak.' : 'Peramban menolak membuka pratinjau cetak.', ok ? 'ok' : 'err');
      },
      clearCache: () => {
        ['pages', 'assets', 'gallery', 'presets', 'projects', 'versions'].forEach((key) => store.remove(key));
        toast('Cache pratinjau dibersihkan.', 'ok');
      },
      resetToDefault: () => {
        ['page', 'toggles', 'zoom', 'savedAt', 'hasUndo', 'sheetPage', 'pages', 'assets',
          'gallery', 'projects', 'versions', 'projectName', 'settings', 'inspector', 'stats']
          .forEach((key) => store.remove(key));
        pushHistory(state);
        dispatch({ type: 'replacePages', pages: [{ id: 'page-' + Date.now().toString(36), pins: [] }], selectedPinId: null });
        dispatch({ type: 'resetToEmptyCollections' });
        dispatch({ type: 'setVersions', versions: [] });
        dispatch({ type: 'renameProject', name: 'Proyek Tanpa Judul' });
        dispatch({ type: 'resetPrefs' });
        touch();
        toast('Semua data dikosongkan — mulai dari kanvas kosong.', 'ok');
      },
      createProject: (name, options) => {
        const opts = options || {};
        const title = String(name || '').trim() || 'Proyek Tanpa Judul';
        const paper = opts.paper || 'a3';
        let initialPins = [];
        let inspectorPatch = { ...DEFAULT_INSPECTOR, paper };

        if (opts.preset === 'last' && state.projects.length > 0) {
          const last = state.projects[0];
          if (Array.isArray(last.pages) && last.pages.length) {
            initialPins = last.pages[0].pins || [];
            if (last.inspector) inspectorPatch = { ...inspectorPatch, ...last.inspector };
          } else {
            initialPins = PAGE_SEED[0].pins;
          }
        } else if (opts.preset && opts.preset !== 'empty') {
          const found = state.presets.find((p) => p.id === opts.preset);
          if (found && found.geometry) {
            inspectorPatch = { ...inspectorPatch, ...found.geometry };
            initialPins = gridPins(PAGE_SEED[0].pins.slice(0, 6), inspectorPatch, 'origin');
          }
        }

        pushHistory(state);
        dispatch({
          type: 'replacePages',
          pages: [{ id: 'page-' + Date.now().toString(36), pins: initialPins }],
          selectedPinId: null,
          inspector: inspectorPatch,
        });
        dispatch({ type: 'renameProject', name: title });
        dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
        touch();
        commitSave();
        toast('Proyek baru dibuat.', 'ok');
      },
      openProject: (name) => {
        const project = state.projects.find((p) => p.name === name);
        pushHistory(state);
        if (project && Array.isArray(project.pages) && project.pages.length) {
          dispatch({
            type: 'replacePages',
            pages: project.pages,
            selectedPinId: null,
            inspector: project.inspector || state.inspector,
          });
        }
        dispatch({ type: 'renameProject', name });
        dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
        touch();
        commitSave();
        toast('Proyek "' + name + '" dibuka.', 'ok');
      },
      exportBackup,
      startBackup: () => {
        runProgress(
          setBackupProgress,
          BACKUP_NOTES,
          () => {
            const result = exportBackup();
            toast('Cadangan diekspor — ' + result.name + '.', 'ok');
          },
          backupTimer,
        );
      },
      importBackup: (text) => {
        let payload;
        try {
          payload = JSON.parse(text);
        } catch {
          toast('Berkas cadangan tidak dapat dibaca.', 'err');
          return false;
        }
        if (!payload || payload.app !== 'pin-print-studio' || !Array.isArray(payload.pages)) {
          toast('Berkas bukan cadangan Pin Print Studio.', 'err');
          return false;
        }
        pushHistory(state);
        dispatch({ type: 'replacePages', pages: payload.pages, selectedPinId: null });
        if (payload.inspector) dispatch({ type: 'setInspector', patch: payload.inspector });
        if (payload.project) dispatch({ type: 'renameProject', name: payload.project });
        if (Array.isArray(payload.assets) || Array.isArray(payload.gallery)) {
          dispatch({ type: 'replaceCollections', assets: payload.assets, galleryCards: payload.gallery });
        }
        if (payload.settings) {
          dispatch({ type: 'setSettings', patch: payload.settings });
        }
        dispatch({ type: 'nav', page: 'editor', railOpen: false, dialog: null });
        touch();
        commitSave();
        toast('Proyek berhasil diimpor.', 'ok');
        return true;
      },
    };
  }, [state, pins, sheetTotal, currentPage, sheetSize, packingInfo, exportProgress, backupProgress, toast, commitSave, runProgress, pushHistory, exportPagesPayload]);

  return <StudioContext.Provider value={actions}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>');
  return ctx;
}