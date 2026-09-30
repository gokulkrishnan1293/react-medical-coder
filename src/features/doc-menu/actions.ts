import type { MouseEvent } from 'react';
import { scrollerRef } from '@/lib/dom';
import { columnEl, sourceRef, spotAt, writeAnchor } from '@/lib/docPosition';
import { ui, type DocSpot, type ZoomSide } from '@/stores/uiStore';
import { setSourceMode } from '@/features/source-view';

/** Right-click on a document column: open our menu in place of the browser's. */
export function openDocMenu(e: MouseEvent, side: ZoomSide) {
  e.preventDefault();
  const root = columnEl(side);
  ui().set({ menu: { x: e.clientX, y: e.clientY, side, at: root && spotAt(root, e.clientY) } });
}

export const closeDocMenu = () => ui().set({ menu: null });

/** Bring the same spot up in the original, opening it if needed, and point it out. */
export function showInOriginal(at: DocSpot) {
  const opening = ui().source !== 'compare';
  if (opening) setSourceMode('compare');
  const go = () => {
    const src = sourceRef.current;
    if (!src) return;
    writeAnchor(src, at);
    ui().set({ sourceMark: { ...at, t: Date.now() } });
  };
  // a freshly opened column needs a frame to lay out and line itself up first
  if (opening) requestAnimationFrame(() => requestAnimationFrame(go));
  else go();
}

export function showInRecord(at: DocSpot) {
  const sc = scrollerRef.current;
  if (sc) writeAnchor(sc, at, true);
}
