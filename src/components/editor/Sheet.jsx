import { useRef } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import { useSheetDrag } from '../../hooks/useSheetDrag.js';
import { useToast } from '../../state/ToastContext.jsx';
import { Icon } from '../ui/icons.jsx';

const CUT_MARKS = [
  { left: 14, top: 14 },
  { right: 14, top: 14 },
  { left: 14, bottom: 14 },
  { right: 14, bottom: 14 },
  { left: '50%', top: 14, marginLeft: -6 },
  { left: '50%', bottom: 14, marginLeft: -6 },
  { top: '50%', left: 14, marginTop: -6 },
  { top: '50%', right: 14, marginTop: -6 },
];

export default function Sheet({ sheetRef }) {
  const studio = useStudio();
  const toast = useToast();
  const { pins, toggles, zoom, selectedPinId, selectPin, movePin, setInspector } = studio;
  const localRef = useRef(null);
  const ref = sheetRef ?? localRef;

  /* Prototype anchored the scroll back to the sheet wrapper after zooming. */
  const handleDragStart = ({ pin }) => {
    selectPin(pin.id);
    if (pin.locked) {
      toast('Posisi desain terkunci.', 'err');
      return false;
    }
    return true;
  };

  const handleMove = (id, x, y) => {
    movePin(id, x, y);
    setInspector({ posX: x, posY: y });
  };

  const handleDragEnd = () => studio.markDirty();

  const onPointerDown = useSheetDrag(ref, handleMove, handleDragStart, handleDragEnd);

  const sheetClass = [
    'sheet',
    toggles.cut ? 'show-cut' : '',
    toggles.marks ? 'show-marks' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={sheetClass}
      id="sheet"
      data-od-id="sheet-preview"
      ref={ref}
      style={{ transform: `scale(${zoom / 78})`, transformOrigin: 'top center' }}
    >
      {/* Overlay order mirrors the prototype: margin, bleed, safe, grid, cut marks. */}
      <div className="sheet-layer">
        {toggles.margin ? <div className="margin-box" id="layer-margin" style={{ left: 34, top: 34, right: 34, bottom: 34 }} /> : null}
        {toggles.bleed ? <div className="bleed-box" id="layer-bleed" style={{ left: -9, top: -9, right: -9, bottom: -9 }} /> : null}
        {toggles.safe ? <div className="safe-box" id="layer-safe" style={{ left: 52, top: 52, right: 52, bottom: 52 }} /> : null}
        {toggles.grid ? <div className="grid-lines" id="layer-grid" /> : null}

        {CUT_MARKS.map((style, i) => (
          <div className="cut-mark" key={i} style={style} />
        ))}
      </div>

      {pins.map((pin, index) => (
        <div
          key={pin.id}
          className={`pin${pin.id === selectedPinId ? ' is-selected' : ''}${pin.locked ? ' is-locked' : ''}`}
          data-pin-id={pin.id}
          style={{ left: pin.x, top: pin.y, width: pin.size, height: pin.size, cursor: pin.locked ? 'not-allowed' : 'grab' }}
          onPointerDown={(e) => onPointerDown(e, pin)}
        >
          {pin.locked ? (
            <span className="pin-lock"><Icon name="lock" stroke={1.8} /></span>
          ) : null}
          <span className={`pin-art ${pin.art}`}>
            <Icon name={pin.icon} />
          </span>
          {toggles.number ? <span className="pin-num">{index + 1}</span> : null}
          {toggles.filename ? <span className="pin-tag">{pin.label}</span> : null}
        </div>
      ))}

      <svg className="sheet-cutlines" viewBox="0 0 620 877" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="cutgrid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" fill="none" stroke="currentColor" strokeWidth="0.4" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}