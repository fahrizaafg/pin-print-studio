import { useEffect, useRef } from 'react';

/* Fixed-position tooltip layer — never clipped by toolbar/panel overflow. */
export function TooltipLayer() {
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;
    let owner = null;

    const show = (el) => {
      const text = el.getAttribute('data-tip');
      if (!text) return;
      layer.textContent = text;
      layer.hidden = false;
      layer.style.left = '-9999px';
      layer.style.top = '0px';
      const w = layer.offsetWidth;
      const h = layer.offsetHeight;
      const r = el.getBoundingClientRect();
      let left = r.left + r.width / 2 - w / 2;
      left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
      let top = r.bottom + 8;
      if (top + h > window.innerHeight - 8) top = r.top - h - 8;
      layer.style.left = `${left}px`;
      layer.style.top = `${top}px`;
    };
    const hide = () => {
      layer.hidden = true;
      owner = null;
    };

    const onOver = (e) => {
      const t = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (t && t !== owner) {
        owner = t;
        show(t);
      }
    };
    const onOut = (e) => {
      const t = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (t && t === owner) hide();
    };
    const onFocusIn = (e) => {
      const t = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (t) {
        owner = t;
        show(t);
      }
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', hide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  return <div className="tooltip-layer" id="tooltip-layer" data-od-id="tooltip-layer" hidden ref={layerRef} />;
}
