import { scrollerRef } from '@/lib/dom';
import { readAnchor, writeAnchor } from '@/lib/docPosition';
import { ui, useUiStore, type SourceMode } from '@/stores/uiStore';

const ORDER: SourceMode[] = ['stage', 'compare', 'overlay'];

export const VIEW_LABEL: Record<SourceMode, string> = {
  stage: 'Reading view',
  compare: 'Side by side',
  overlay: 'Overlay with slider',
};

/** Switch how the original shows, staying on the same spot of the record. */
export function setSourceMode(mode: SourceMode) {
  if (ui().source === mode) return;
  const sc = scrollerRef.current;
  const at = sc && readAnchor(sc);
  ui().set({ source: mode, peek: false });
  // the record may re-render its pages in another layout; put the reader back where they were
  if (sc && at) requestAnimationFrame(() => requestAnimationFrame(() => writeAnchor(sc, at)));
}

export const cycleSourceMode = () => setSourceMode(ORDER[(ORDER.indexOf(ui().source) + 1) % ORDER.length]);

/** Move the overlay slider across the page, 0 = left edge, 1 = right edge. */
export const setDivider = (v: number) => ui().set({ divider: Math.min(1, Math.max(0, v)) });

/** Where the divider shows: while Space is held it moves out so the scan covers the whole page. */
export const shownDivider = (s: ReturnType<typeof useUiStore.getState>) => (s.peek ? (s.scanSide === 'left' ? 1 : 0) : s.divider);
