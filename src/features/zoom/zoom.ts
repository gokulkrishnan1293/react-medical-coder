import { useEffect, type RefObject } from 'react';
import { columnEl, readAnchor, spotAt, writeAnchor, writeSpotAt } from '@/lib/docPosition';
import { clamp } from '@/lib/utils';
import { ui, useUiStore, type Zoom, type ZoomSide } from '@/stores/uiStore';

/** Page width at 100%. Both columns lay pages out at this width, so 100% means the same on each side. */
export const PAGE_COLUMN = 800;
/** Horizontal padding of each scrolling column. */
const GUTTER = 32;

const STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
export const ZOOM_MIN = STEPS[0];
export const ZOOM_MAX = STEPS[STEPS.length - 1];

const resolve = (z: Zoom, fit: number) => (z === 'fit' ? fit : z);

export const currentZoom = (side: ZoomSide) => resolve(ui().zoom[side], ui().fit[side]);

/** The zoom factor a column is showing, with "fit" worked out. */
export function useZoom(side: ZoomSide) {
  return useUiStore((s) => resolve(s.zoom[side], s.fit[side]));
}

/**
 * Zoom one column. The spot under the pointer (when given) or in the middle of the viewport
 * stays where it is on screen.
 */
export function setZoom(side: ZoomSide, z: Zoom, clientY?: number) {
  const root = columnEl(side);
  const at = root && (clientY === undefined ? readAnchor(root) : spotAt(root, clientY));
  ui().set({ zoom: { ...ui().zoom, [side]: z === 'fit' ? z : clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX) } });
  if (!root || !at) return;
  requestAnimationFrame(() => (clientY === undefined ? writeAnchor(root, at) : writeSpotAt(root, at, clientY)));
}

export function stepZoom(side: ZoomSide, dir: 1 | -1, clientY?: number) {
  const cur = currentZoom(side);
  const next = dir > 0
    ? STEPS.find((s) => s > cur + 0.005) ?? ZOOM_MAX
    : [...STEPS].reverse().find((s) => s < cur - 0.005) ?? ZOOM_MIN;
  setZoom(side, next, clientY);
}

/* The column the pointer is over; keyboard zoom acts on it. */
let hovered: ZoomSide = 'record';
export const hoveredSide = () => hovered;

/**
 * Pointer zoom for one column: ⌘/Ctrl + wheel and trackpad pinch zoom around the cursor.
 * Also remembers the column as the target for keyboard zoom while the pointer is over it.
 */
export function useZoomGestures(side: ZoomSide, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () => { hovered = side; };
    const leave = () => { if (hovered === side) hovered = 'record'; };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      // a mouse wheel notch is a big jump: take one zoom step. A trackpad pinch sends small deltas: follow it smoothly.
      if (Math.abs(dy) >= 40) stepZoom(side, dy < 0 ? 1 : -1, e.clientY);
      else setZoom(side, currentZoom(side) * Math.exp(-dy * 0.01), e.clientY);
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', wheel);
    };
  }, [side, ref]);
}

/** Keeps the column's fit-to-width zoom current as it resizes. */
export function useFitWidth(side: ZoomSide, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const f = Math.max(0.2, (el.clientWidth - GUTTER) / PAGE_COLUMN);
      if (Math.abs(ui().fit[side] - f) > 0.001) ui().set({ fit: { ...ui().fit, [side]: f } });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [side, ref]);
}
