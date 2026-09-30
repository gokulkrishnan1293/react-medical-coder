import { createRef } from 'react';

/* Shared element refs. Several floating layers position themselves against the record scroller. */
export const scrollerRef = createRef<HTMLDivElement>();

/** Where the "fly to notes" chip lands, registered by whichever notepad form is on screen. */
export const notesTargetRef: { current: HTMLElement | null } = { current: null };

export const evidenceEl = (id: string) => document.getElementById('ev-' + id);
export const pageEl = (n: number) => document.getElementById('page-' + n);
