/* Inline SVG icon set lifted 1:1 from the prototype (24×24, stroke based). */

const shapes = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  gridRounded: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  gridTiles: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 15l4.5-4 4 3.5 3-2.5L21 16" />
      <circle cx="8.5" cy="9" r="1.4" />
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
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  /* gallery / swatch artwork only: prototype used a wider 4→20 cross here */
  cross: <path d="M12 4v16M4 12h16" />,
  /* prototype's own "half-moon" glyph (M5 15c0-5 4-7 7-7s7 2 7 7z) */
  halfmoon: <path d="M5 15c0-5 4-7 7-7s7 2 7 7z" />,
  folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h7V4M8 20v-6h8v6" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h9a6 6 0 0 1 6 6" />
    </>
  ),
  redo: (
    <>
      <path d="m15 7 5 5-5 5" />
      <path d="M20 12h-9a6 6 0 0 0-6 6" />
    </>
  ),
  exportArrow: (
    <>
      <path d="M12 4v10M8.5 10.5 12 14l3.5-3.5" />
      <path d="M5 18h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 20V9M7.5 13 12 8.5 16.5 13" />
      <path d="M5 4h14" />
    </>
  ),
  paper: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  bolt: <path d="M13 3 4 14h5l-1 7 9-11h-5z" />,
  eye: (
    <>
      <path d="M12 3.5c4.5 0 8 3.2 9 8.5-1 5.3-4.5 8.5-9 8.5S4 17.3 3 12c1-5.3 4.5-8.5 9-8.5z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  png: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m4 15 4.5-4 4 3.5 3-2.5L20 16" />
      <circle cx="9" cy="9" r="1.3" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V3h10v6" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 16h10v5H7z" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M8 11h6M16 16l4 4" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M8 11h6M11 8v6M16 16l4 4" />
    </>
  ),
  chevronLeft: <path d="M14 6l-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="8" rx="1.5" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
    </>
  ),
  backup: (
    <>
      <path d="M4 6h16v4H4z" />
      <path d="M6 10v8h12v-8M10 14h4" />
    </>
  ),
  /* pin artwork */
  house: <path d="M6 9.5 12 5l6 4.5V19H6z" />,
  coffee: (
    <>
      <path d="M6 8h12l-1 9H7z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 15c0-5 4-7 7-7s7 2 7 7z" />
      <path d="M12 8V4" />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.6.6-4.2 3.8 1.2 5.4L12 16l-5 2.8 1.2-5.4L4 9.6l5.6-.6z" />,
  /* toast marks */
  toastOk: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9.5" />
    </>
  ),
  toastErr: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v6M12 16.5v.01" />
    </>
  ),
  toastInfo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </>
  ),
};

export function Icon({ name, stroke = 1.6, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={className}>
      {shapes[name]}
    </svg>
  );
}