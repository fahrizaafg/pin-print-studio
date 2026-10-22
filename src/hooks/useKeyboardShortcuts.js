import { useEffect } from 'react';
import { useStudio } from '../state/StudioContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

/* Global keyboard shortcuts — same keys/messages as the prototype. */
export function useKeyboardShortcuts() {
  const studio = useStudio();
  const toast = useToast();
  const { dialog, railOpen, undoStack, redoStack, page } = studio;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dialog) {
          studio.closeDialog();
          return;
        }
        if (railOpen) studio.closeRail();
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
      } else if (k === '=' || k === '+') {
        e.preventDefault();
        studio.zoomBy(10);
      } else if (k === '-') {
        e.preventDefault();
        studio.zoomBy(-10);
      }
    };

    const onKeyUp = (e) => {
      if (e.key === 'Delete' && page === 'editor') {
        studio.removeSelectedPin();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [dialog, page, railOpen, redoStack.length, studio, toast, undoStack.length]);
}
