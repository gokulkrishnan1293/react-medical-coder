import { useEffect, useState, type RefObject } from 'react';

/**
 * Drag to pan a scrolling column of images, like a photo viewer: grab the page and move it in any direction.
 * Left button only, so the right-click menu still works. Returns whether a drag is under way, for the cursor.
 */
export function usePan(ref: RefObject<HTMLElement | null>) {
  const [panning, setPanning] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      e.preventDefault();
      const x0 = e.clientX;
      const y0 = e.clientY;
      const left = el.scrollLeft;
      const top = el.scrollTop;
      el.setPointerCapture(e.pointerId);
      setPanning(true);
      const move = (ev: PointerEvent) => {
        el.scrollLeft = left - (ev.clientX - x0);
        el.scrollTop = top - (ev.clientY - y0);
      };
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        setPanning(false);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    };
    el.addEventListener('pointerdown', down);
    return () => el.removeEventListener('pointerdown', down);
  }, [ref]);
  return panning;
}
