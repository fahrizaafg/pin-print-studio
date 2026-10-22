import { Icon } from './icons.jsx';

/* ─── checkbox square (asset rows, check rows, gallery cards) ───────── */
export function Box({ checked, className = '' }) {
  return (
    <span className={`box${checked ? ' is-checked' : ''}${className ? ' ' + className : ''}`} aria-hidden="true">
      <Icon name="check" stroke={2.4} />
    </span>
  );
}

/* ─── toggle switch ─────────────────────────────────────────────────── */
export function Switch({ on, onToggle, label, ...rest }) {
  return (
    <button
      type="button"
      className={`switch${on ? ' is-on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      {...rest}
    />
  );
}

/* ─── check row (label + box + copy) ────────────────────────────────── */
export function CheckRow({ checked, onToggle, label, sub, children, ...rest }) {
  return (
    <label className={`check-row${checked ? ' is-checked' : ''}`} onClick={onToggle} {...rest}>
      <Box checked={checked} />
      <span>
        {children ?? (
          <>
            <span className="check-label">{label}</span>
            {sub ? <span className="check-sub">{sub}</span> : null}
          </>
        )}
      </span>
    </label>
  );
}

/* ─── segmented control ─────────────────────────────────────────────── */
export function Seg({ value, onChange, options, className = '', ...rest }) {
  return (
    <div className={`seg${className ? ' ' + className : ''}`} {...rest}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'is-active' : undefined}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── export / backup progress ──────────────────────────────────────── */
export function Progress({ progress, className = '' }) {
  return (
    <div className={`progress-wrap${className ? ' ' + className : ''}`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <div className="progress-note">
        <span>{progress.note}</span>
        <span className="num">{Math.round(progress.pct)}%</span>
      </div>
    </div>
  );
}