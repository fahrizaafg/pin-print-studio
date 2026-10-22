import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/ui/icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);
  const layerRef = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, out: true } : t)));
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 180);
  }, []);

  const toast = useCallback(
    (message, kind = 'ok') => {
      const id = ++seq.current;
      setToasts((list) => [...list, { id, message, kind }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" id="toast-stack" data-od-id="toast-stack" aria-live="polite" ref={layerRef}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast is-${t.kind === 'ok' ? 'ok' : t.kind === 'err' ? 'err' : 'info'}${t.out ? ' is-out' : ''}`}
            role="status"
          >
            <span className="toast-mark">
              <Icon name={t.kind === 'err' ? 'toastErr' : t.kind === 'info' ? 'toastInfo' : 'toastOk'} stroke={2} />
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Hook lives beside its provider by design; the fast-refresh rule does not apply. */
// eslint-disable-next-line react/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
