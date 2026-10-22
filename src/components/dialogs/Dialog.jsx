import { useEffect, useRef } from 'react';
import { Icon } from '../ui/icons.jsx';

/* Shared overlay + dialog chrome (markup identical to the prototype). */
export default function Dialog({ id, title, subtitle, subtitleId, size, open, onClose, children, footer, alert, bodyStyle, bodyId }) {
  const bodyRef = useRef(null);

  /*
   * Prototype: the first focusable in the overlay is the close button, so no
   * field ever received focus — visual parity depends on leaving focus alone.
   */
  useEffect(() => {
    if (open && document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }, [open]);

  return (
    <div
      className={`overlay${open ? ' is-open' : ''}`}
      id={id}
      data-od-id={id}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`dialog${size === 'lg' ? ' dialog-lg' : ''}`} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="dialog-head">
          <div>
            <h2 id={`${id}-title`} style={{ fontSize: 'var(--text-lg)' }}>{title}</h2>
            {subtitle ? <div className="dialog-sub" id={subtitleId}>{subtitle}</div> : null}
          </div>
          <button type="button" className="btn-close" aria-label="Tutup" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body" id={bodyId} style={bodyStyle} ref={bodyRef}>{children}</div>
        {footer ? <div className="dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}