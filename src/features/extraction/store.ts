import { create } from 'zustand';
import type { ExtractionFlag, ExtractionKind } from '@/types';
import { BLOCKS, PAGES, locate } from '@/data';
import { READ_ONLY_MSG, useFindingsStore } from '@/features/findings';

/* The reviewer's extraction flags, and the editor for one. Saved apart from the review, as extraction.json. */

export const KIND_LABEL: Record<ExtractionKind, string> = { formatting: 'Formatting', data: 'Wrong data', missing: 'Missed content' };
export const KIND_NOTE: Record<ExtractionKind, string> = {
  formatting: 'The layout came out wrong: a table broken up, a heading lost, columns merged.',
  data: 'The text differs from the scan: a misread number, dose, date or name.',
  missing: 'Something on the original is not in the extracted text.',
};

/** Where the editor opens and what it is about: new words, a spot with missing content, or an existing flag. */
export type Draft =
  | { mode: 'words'; page: number; block: string; text: string; x: number; y: number }
  | { mode: 'spot'; page: number; block: string; x: number; y: number }
  | { mode: 'edit'; id: string; x: number; y: number };

/** The capture view: which page of the original to open, where on it, and what to do with the capture. */
export interface Capture { page: number; top: number; onDone: (dataUrl: string) => void }

interface ExtractionState {
  flags: ExtractionFlag[];
  draft: Draft | null;
  /** Open while the reviewer captures part of the original for the flag being edited. */
  capture: Capture | null;
  set: (patch: Partial<Pick<ExtractionState, 'flags' | 'draft' | 'capture'>>) => void;
  add: (f: Omit<ExtractionFlag, 'id' | 'createdAt'>) => void;
  update: (id: string, patch: Partial<Pick<ExtractionFlag, 'kind' | 'shouldRead' | 'comment' | 'screenshot'>>) => void;
  remove: (id: string) => void;
}

const toast = (msg: string) => useFindingsStore.setState({ toast: { id: Date.now(), msg, undoable: false } });
/** A completed review is read-only; extraction flags are part of the work, so they follow it. */
const locked = () => {
  if (!useFindingsStore.getState().readOnly) return false;
  toast(READ_ONLY_MSG);
  return true;
};

export const useExtractionStore = create<ExtractionState>((set, get) => ({
  flags: [],
  draft: null,
  capture: null,
  set: (patch) => set(patch),
  add: (f) => {
    if (locked()) return;
    const flag: ExtractionFlag = { ...f, id: 'x' + Date.now().toString(36), createdAt: new Date().toISOString() };
    set({ flags: [...get().flags, flag], draft: null });
    toast(`Flagged ${KIND_LABEL[f.kind].toLowerCase()} on page ${f.page}`);
  },
  update: (id, patch) => {
    if (locked()) return;
    set({ flags: get().flags.map((f) => (f.id === id ? { ...f, ...patch } : f)), draft: null });
  },
  remove: (id) => {
    if (locked()) return;
    set({ flags: get().flags.filter((f) => f.id !== id), draft: null });
    toast('Extraction flag removed');
  },
}));

/** The start of a paragraph, kept with a flag that has no words so the paragraph can be found again. */
export const nearOf = (block: string) => BLOCKS[block]?.t.slice(0, 60) ?? '';

/** Finds a saved flag's paragraph again from its page and words (or `near`). Flags that no longer fit are dropped. */
export function resolveFlags(saved: Omit<ExtractionFlag, 'block'>[]): { flags: ExtractionFlag[]; lost: number } {
  let lost = 0;
  const flags = saved.flatMap((f) => {
    const block = locate(f.page, f.text ?? f.near ?? '') ?? (f.near ? locate(f.page, f.near) : null);
    if (!block) { lost++; return []; }
    return [{ ...f, block }];
  });
  return { flags, lost };
}

/** The paragraph at a height on a record page (0 top, 1 bottom), for flagging missing content from the original. */
export function blockAt(page: number, f: number): string | null {
  const el = document.getElementById('page-' + page);
  const blocks = PAGES.find((p) => p.n === page)?.blocks ?? [];
  if (!el || !blocks.length) return blocks[0]?.id ?? null;
  const top = el.getBoundingClientRect().top;
  const y = top + f * el.getBoundingClientRect().height;
  let best = blocks[0].id;
  for (const b of blocks) {
    const bel = el.querySelector(`[data-block="${b.id}"]`);
    if (bel && bel.getBoundingClientRect().top <= y) best = b.id;
  }
  return best;
}

/** Scroll the record to a flag's paragraph and point it out. */
export function goToFlag(f: ExtractionFlag) {
  const el = f.block && document.querySelector(`[data-tour="record"] [data-block="${f.block}"]`);
  if (!el) return void document.getElementById('page-' + f.page)?.scrollIntoView({ block: 'start' });
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.remove('flag-flash');
  requestAnimationFrame(() => el.classList.add('flag-flash'));
  setTimeout(() => el.classList.remove('flag-flash'), 1500);
}
