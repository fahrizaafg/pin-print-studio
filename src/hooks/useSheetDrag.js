import { useCallback, useEffect, useRef } from 'react';

/*
 * Pointer drag for pins on the sheet.
 * The sheet is CSS-scaled, so screen deltas are divided by the live scale
 * derived from getBoundingClientRect().width / offsetWidth (never hard-coded).
 */
export function useSheetDrag(sheetRef, onMove, onDragStart, onDragEnd) {
  const drag = useRef(null);

  const getScale = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet || !sheet.offsetWidth) return 1;
    return sheet.getBoundingClientRect().width / sheet.offsetWidth || 1;
  }, [sheetRef]);

  const handlePointerDown = useCallback(
    (event, pin) => {
      if (event.button !== 0) return;
      const allowed = onDragStart({ pin, event });
      if (!allowed) return;

      const target = event.currentTarget;
      drag.current = {
        pin,
        target,
        startX: pin.x,
        startY: pin.y,
        startClientX: event.clientX,
        startClientY: event.clientY,
        scale: getScale(),
        moved: false,
      };
      try { target.setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer in tests */ }
      try { target.style.cursor = 'grabbing'; } catch { /* noop */ }
      event.preventDefault();
    },
    [getScale, onDragStart],
  );

  useEffect(() => {
    const move = (event) => {
      const d = drag.current;
      if (!d) return;
      const dx = (event.clientX - d.startClientX) / d.scale;
      const dy = (event.clientY - d.startClientY) / d.scale;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 1) return;
      d.moved = true;

      /* Clamp inside the sheet with the prototype's 10px slack. */
      const sheet = sheetRef.current;
      const maxX = (sheet?.offsetWidth ?? 620) - d.pin.size + 10;
      const maxY = (sheet?.offsetHeight ?? 877) - d.pin.size + 10;
      const x = Math.max(-10, Math.min(maxX, d.startX + dx));
      const y = Math.max(-10, Math.min(maxY, d.startY + dy));
      onMove(d.pin.id, Math.round(x), Math.round(y));
    };
    const up = () => {
      const d = drag.current;
      if (!d) return;
      d.target.style.cursor = 'grab';
      drag.current = null;
      if (d.moved) onDragEnd(d.pin.id);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    };
  }, [onDragEnd, onMove, sheetRef]);

  return handlePointerDown;
}
