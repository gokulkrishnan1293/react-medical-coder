import { scrollerRef } from '@/lib/dom';
import { isEcho, readAnchor, sourceRef, writeAnchor } from '@/lib/docPosition';
import { ui } from '@/stores/uiStore';

/* Scroll sync between the record and the original page images, matched by page and position. */

function follow(from: HTMLElement | null, to: HTMLElement | null) {
  if (!from || !to || isEcho(from) || !ui().syncScroll) return;
  const a = readAnchor(from);
  if (a) writeAnchor(to, a);
}

export const syncSourceFromRecord = () => follow(scrollerRef.current, sourceRef.current);
export const syncRecordFromSource = () => follow(sourceRef.current, scrollerRef.current);

/** Line the originals up with the record without waiting for a scroll, e.g. on opening. */
export function alignSource() {
  const rec = scrollerRef.current;
  const src = sourceRef.current;
  const a = rec && readAnchor(rec);
  if (src && a && ui().syncScroll) writeAnchor(src, a);
}
