/** Pointer-capture drag helper: calls move with the delta from the start point until release. */
export function startPointerDrag(
  e: React.PointerEvent<HTMLElement>,
  move: (dx: number, dy: number, ev: PointerEvent) => void,
  end?: () => void,
) {
  e.preventDefault();
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);
  const sx = e.clientX;
  const sy = e.clientY;
  const mv = (ev: PointerEvent) => move(ev.clientX - sx, ev.clientY - sy, ev);
  const up = () => {
    el.removeEventListener('pointermove', mv);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    end?.();
  };
  el.addEventListener('pointermove', mv);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
