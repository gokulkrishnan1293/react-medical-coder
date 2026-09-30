import { createRef } from 'react';
import type { DocSpot, ZoomSide } from '@/stores/uiStore';
import { scrollerRef } from './dom';
import { clamp, scrollBehavior } from './utils';

/*
 * Positions in the document columns. The record and the original images both mark their pages
 * with data-page, so a position is "page n, fraction f down it". That keeps the columns lined up
 * even when they are zoomed differently.
 */

/** The column of original page images, when it is on screen. */
export const sourceRef = createRef<HTMLDivElement>();

export const columnEl = (side: ZoomSide) => (side === 'record' ? scrollerRef : sourceRef).current;

interface Span { n: number; top: number; h: number }

function spans(root: HTMLElement): Span[] {
  const base = root.getBoundingClientRect().top - root.scrollTop;
  return Array.from(root.querySelectorAll<HTMLElement>('[data-page]'), (el) => {
    const r = el.getBoundingClientRect();
    return { n: +el.dataset.page!, top: r.top - base, h: r.height || 1 };
  });
}

function spotAtContentY(root: HTMLElement, y: number): DocSpot | null {
  const all = spans(root);
  if (!all.length) return null;
  const hit = all.reduce((acc, p) => (p.top <= y ? p : acc), all[0]);
  return { n: hit.n, f: clamp((y - hit.top) / hit.h, 0, 1) };
}

/** The spot under the middle of the column's viewport. */
export const readAnchor = (root: HTMLElement) => spotAtContentY(root, root.scrollTop + root.clientHeight / 2);

/** The spot under a pointer position. */
export const spotAt = (root: HTMLElement, clientY: number) =>
  spotAtContentY(root, clientY - root.getBoundingClientRect().top + root.scrollTop);

/* Scroll positions we set ourselves, so the echo scroll event is not taken for the user's. */
const expected = new WeakMap<HTMLElement, number>();

export function isEcho(root: HTMLElement) {
  const e = expected.get(root);
  expected.delete(root);
  return e !== undefined && Math.abs(root.scrollTop - e) <= 1;
}

/** Scroll so the spot sits at a pointer position, e.g. to zoom around the cursor. */
export function writeSpotAt(root: HTMLElement, a: DocSpot, clientY: number) {
  const p = spans(root).find((s) => s.n === a.n);
  if (!p) return;
  root.scrollTop = p.top + a.f * p.h - (clientY - root.getBoundingClientRect().top);
  expected.set(root, root.scrollTop);
}

/** Scroll so the spot sits in the middle of the viewport. Smooth scrolls count as the user's. */
export function writeAnchor(root: HTMLElement, a: DocSpot, smooth = false) {
  const p = spans(root).find((s) => s.n === a.n);
  if (!p) return;
  const top = p.top + a.f * p.h - root.clientHeight / 2;
  if (smooth) { root.scrollTo({ top, behavior: scrollBehavior() }); return; }
  root.scrollTop = top;
  expected.set(root, root.scrollTop);
}
