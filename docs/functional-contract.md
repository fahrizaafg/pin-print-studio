# Kontrak Fungsional — Pin Print Studio

Dokumen ini adalah **sumber kebenaran** untuk semua komponen UI. Jangan mengubah
`src/state/StudioContext.jsx` atau `src/data/studioData.js`; kalau butuh action baru, lapor lead.

## Aturan umum
- Bahasa antarmuka: Indonesia. Jangan menambah dependency npm.
- Jangan menyentuh `design-source/`, `src/styles/01..08c`, atau file milik teammate lain.
- Setiap tombol yang terlihat harus berefek nyata. Tidak boleh ada `onClick` yang hanya `toast`.
- Konfirmasi destruktif WAJIB memakai `requestConfirm({ message, note, toast, onConfirm })`;
  tanpa `onConfirm` tombol jadi tidak berefek (bug yang sedang kita perbaiki).
- Ikon yang tersedia (src/components/ui/icons.jsx): home, grid, gridRounded, gridTiles, image,
  history, settings, help, menu, plus, cross, halfmoon, folder, save, undo, redo, exportArrow,
  upload, paper, bolt, eye, png, print, zoomOut, zoomIn, chevronLeft, chevronRight, close, check,
  search, lock, backup, house, coffee, sun, leaf, star, toastOk, toastErr, toastInfo.
  Tidak ada 'trash'/'edit' — pakai svg inline atau ikon lain.

## `useStudio()` — state yang dibaca
`page, dialog, confirm, railOpen, panelRightOpen, projectName, pages, pins, sheetPage, sheetTotal,
selectedPinId, layoutMode, toggles, zoom, assetQuery, assets, galleryCards, presets, projects,
versions, inspector, settings, settingsTab, previewDpi, previewPage, stats, saveState,
lastSavedAt, undoStack, redoStack, exportProgress, backupProgress`

- `pins` = pin halaman aktif. `sheetTotal` = jumlah halaman. `sheetPage` = 1..sheetTotal.
- `pages` = `[{ id, pins: [{ id, x, y, size, art, icon, label, locked, crop, rotate, zoom }] }]`
- `assets` = `[{ id, name, meta, status:'placed'|'unplaced'|'locked', order, inLayout, art, icon, selected, url? }]`
- `galleryCards` = `[{ id, name, format, size, art, icon, checked, selected, status, url? }]`
- `presets` = `[{ id, badge:{kind:'pill'|'tag',text}, meta, title, body, confirm, builtin, geometry:{paper,orientation,diameter,rows,cols,gap,margin,bleed} }]`
- `projects` = `[{ id, name, paper, designs, changed, size, pages?, inspector? }]`
- `versions` = `[{ id, time, meta, payload? }]`
- `inspector` = `{ diameter, posX, posY, lock, bleed, bleedColor, imgZoom, rotate, qty, paper, orientation, margin, gap, rows, cols, customWidth, customHeight }`
- `settings` = `{ dark, grid, unit, tooltip, lang, dec, dia, bleed, gap2, paper2, safe, margin2, eco, dpi, fmt, cropmark, cmyk, name, autosave, cache }`
  (`dpi` berupa string '150 DPI'|'300 DPI'|'600 DPI'; `unit` true=mm false=inci; `dec` 'Koma (1,5 mm)'|'Titik (1.5 mm)')
- `toggles` = `{ cut, bleed, grid, margin, safe, filename, number, marks }`
- `stats` = `{ exports: number }`
- `saveState` = 'idle' | 'saving' | 'done'

## `useStudio()` — action
Navigasi: `goPage(page)`, `toggleRail()`, `closeRail()`, `togglePanelRight()`
Dialog: `openDialog(id)`, `closeDialog()`, `requestConfirm({message,note,toast,nav,onConfirm})`, `resolveConfirm()`
Proyek: `renameProject(name)`, `createProject(name,{paper,preset:'empty'})`, `openProject(name)`,
`duplicateProject(id)`, `removeProject(id)`, `save()`, `markDirty()`, `restoreVersion(id)`
Halaman: `addSheetPage()`, `removeSheetPage()`, `gotoSheetPage(p)`, `setSheetPage(p)`
Editor: `toggleLayer(key)`, `setZoom(z)`, `zoomBy(d)`, `setLayoutMode('grid'|'hemat')`, `selectPin(id)`,
`movePin(id,x,y)`, `removeSelectedPin()`, `duplicateSelectedPin()`, `setInspector(patch)`,
`applyInspector()`, `applySelected()`, `applySelectedImage(patch)`, `toggleCrop()`, `alignGrid()`,
`centerLayout()`, `resetLayout()`, `setLock(on)`
Aset: `setAssetQuery(q)`, `toggleAsset(id)`, `selectAllAssets()`, `deselectAssets()`,
`addAssets(files,{toLayout})` → Promise, `removeAssets(ids)`, `removeSelectedAssets()`,
`addSelectedAssetsToLayout()`
Galeri: `toggleGalleryCheck(id)`, `removeGalleryCard(id)`, `duplicateGalleryCard(id)`,
`addGalleryToProject()`, `replaceSelectedWithAsset(assetId)`
Preset: `usePreset(id)`, `addPreset({title,paper,diameter,rows,cols,gap,margin})`,
`updatePreset(id,patch)`, `removePreset(id)`, `duplicatePreset(id)`
Pengaturan: `setSettings(patch)`, `resetSettings()`, `setSettingsTab(t)`, `clearCache()`, `resetToDefault()`
Pratinjau: `setPreviewDpi('150'|'300'|'600')`, `setPreviewPage(p)`
Ekspor: `startExport({format:'PNG'|'PDF', dpi, cropmark})`, `print()`,
`exportBackup()` → `{name,payload}`, `startBackup()`, `importBackup(text)` → boolean
Lain: `undo()`, `redo()`, `notify(msg,kind)`, `toastInline(msg,kind)`
(kind: 'ok' | 'err' | 'info')

## Helper yang tersedia
- `src/lib/format.js`: `formatNumber(v, settings)`, `formatLength(mm, settings)`, `formatClock(date)`,
  `formatVersionTime(date)`, `formatStamp(date)`, `sanitizeFileName(name)`,
  `resolveFileName(pattern,{project,pages,ext,page})`, `downloadBlob(blob,name)`, `downloadText`,
  `readFileText(file)`, `imageDimensions(file)`
- `src/data/studioData.js`: `PAPER_MM` ({a4,a3,a3p} → [w,h] mm), `PAPER_LABEL`, `ART_PALETTE`,
  `ICON_PALETTE`, `ASSET_STATUS_LABEL`, `EXPORT_NOTES`, `BACKUP_NOTES`, `BUILTIN_TEMPLATES`,
  `DEFAULT_SETTINGS`, `PAGE_TITLES`.
  **`OPEN_PROJECTS` dan `RECENT_PROJECTS` sudah dihapus** — pakai `projects`.
- `src/components/ui/primitives.jsx`: `Box`, `Switch`, `CheckRow`, `Seg`, `Progress`
- `src/components/ui/icons.jsx`: `Icon({name, stroke, className})`

## Kelas CSS baru (disediakan lead di src/styles/09-functional.css)
- `.is-dark-canvas` pada elemen `.canvas-scroll` → kanvas gelap saat `settings.dark`.
- `.pin-art.is-cropped` → penanda mode crop.
- `.gcard-art img, .asset-thumb img, .pin-art img` → gambar unggahan nyata (`object-fit: cover`).
- `.is-hidden` → `display: none !important` untuk filter pencarian.
