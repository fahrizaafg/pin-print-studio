import { useEffect } from 'react';
import { useStudio } from '../state/StudioContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

/* Fields keep their native shortcuts (typing, select, undo in text). */
function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;
  const tag = String(target.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/* Global keyboard shortcuts — same keys/messages as the prototype. */
export function useKeyboardShortcuts() {
  const studio = useStudio();
  const toast = useToast();
  const { dialog, railOpen, undoStack, redoStack, page } = studio;

  useEffect(() => {
    const onKeyDown = (e) => {
      const typing = isTypingTarget(e.target);

      /* Escape always works, even inside a field. */
      if (e.key === 'Escape') {
        if (dialog) {
          studio.closeDialog();
          return;
        }
        if (railOpen) studio.closeRail();
        if (page === 'editor' && (studio.selectedPinIds?.length || studio.selectedPinId)) studio.clearSelection();
        return;
      }

      if (typing) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && page === 'editor' && !dialog) {
        /* Keeps Backspace from navigating away even when nothing is selected. */
        e.preventDefault();
        if ((studio.selectedPinIds && studio.selectedPinIds.length) || studio.selectedPinId) studio.removeSelectedPin();
        return;
      }

      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();

      if (k === 's') {
        e.preventDefault();
        studio.save();
      } else if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.length) studio.undo();
        else toast('Tidak ada tindakan untuk dibatalkan.', 'info');
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (redoStack.length) studio.redo();
        else toast('Tidak ada tindakan untuk dikembalikan.', 'info');
      } else if (k === 'a') {
        if (page === 'editor') {
          e.preventDefault();
          studio.selectAllAssets();
        }
      } else if (k === 'e') {
        e.preventDefault();
        studio.startExport({ format: 'PNG' });
      } else if (k === 'p') {
        e.preventDefault();
        studio.print();
      } else if (k === '=' || k === '+') {
        e.preventDefault();
        studio.zoomBy(10);
      } else if (k === '-') {
        e.preventDefault();
        studio.zoomBy(-10);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dialog, page, railOpen, redoStack.length, studio, toast, undoStack.length]);
}
