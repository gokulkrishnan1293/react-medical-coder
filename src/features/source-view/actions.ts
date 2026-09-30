import { scrollerRef } from '@/lib/dom';
import { readAnchor, writeAnchor } from '@/lib/docPosition';
import { ui, type SourceMode } from '@/stores/uiStore';

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

/** Move the overlay slider, 0 = all extracted text, 1 = all scan. */
export const setDivider = (v: number) => ui().set({ divider: Math.min(1, Math.max(0, v)) });
