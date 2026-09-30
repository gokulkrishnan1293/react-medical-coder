import { create } from 'zustand';
import type { Finding } from '@/types';
import { CURRENT_CASE_ID, INITIAL_FINDINGS, WORKLIST, locate } from '@/data';
import { useFindingsStore } from '@/features/findings';
import { totalSeconds, useReviewStore } from '@/features/review';
import { api } from './api';
import { applySavedReview, toSavedReview } from './review';

interface SaveState {
  state: 'idle' | 'saving' | 'saved' | 'error';
  savedAt: string | null;
  error: string | null;
  /** Things from the saved review that no longer fit the case files, shown once. */
  notices: string[];
  set: (patch: Partial<Omit<SaveState, 'set'>>) => void;
}

export const useSaveStore = create<SaveState>((set) => ({ state: 'idle', savedAt: null, error: null, notices: [], set: (p) => set(p) }));

const DEBOUNCE = 500;
const RETRY = [2000, 5000, 15000, 30000];

let timer: ReturnType<typeof setTimeout> | undefined;
let pending = false;
let inFlight = false;
let failures = 0;
let lastSpent = 0;
/** Set while resetting, so nothing is saved back on the way out. */
let off = false;

function draft() {
  const { status, comment, completedAt, timeByDay } = useReviewStore.getState();
  return toSavedReview(CURRENT_CASE_ID, INITIAL_FINDINGS, useFindingsStore.getState().findings, { status, comment, completedAt, timeByDay });
}

async function save(keepalive = false) {
  if (off) return;
  if (inFlight && !keepalive) { pending = true; return; }
  inFlight = true;
  pending = false;
  const s = useSaveStore.getState();
  s.set({ state: 'saving' });
  try {
    lastSpent = spent();
    const r = await api.saveReview(CURRENT_CASE_ID, draft(), { keepalive });
    failures = 0;
    s.set({ state: 'saved', savedAt: r.savedAt, error: null });
  } catch (e) {
    s.set({ state: 'error', error: e instanceof Error ? e.message : String(e) });
    clearTimeout(timer);
    timer = setTimeout(() => void save(), RETRY[Math.min(failures++, RETRY.length - 1)]);
  } finally {
    inFlight = false;
    if (pending) void save();
  }
}

const spent = () => totalSeconds(useReviewStore.getState().timeByDay);
const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void save(), DEBOUNCE); };

/**
 * Loads the saved review of the case this page shows into the stores, then saves every change back:
 * half a second after a change, when the page is hidden or closed, and once a minute while time is counting.
 */
export async function loadAndAutosave() {
  let saved = null;
  try { saved = await api.getReview(CURRENT_CASE_ID); } catch (e) { useSaveStore.getState().set({ state: 'error', error: e instanceof Error ? e.message : String(e) }); }
  if (saved) {
    const { findings, review, notices } = applySavedReview(INITIAL_FINDINGS, saved, locate);
    hydrate(findings, review.status, review.comment, review.completedAt, review.timeByDay);
    lastSpent = totalSeconds(review.timeByDay);
    useSaveStore.getState().set({ state: 'saved', savedAt: saved.savedAt, notices });
    notices.forEach((n) => console.warn(`[review] ${n}`));
  } else {
    // nothing saved yet: a case its case.json marks completed opens completed, and read-only
    const w = WORKLIST.find((x) => x.id === CURRENT_CASE_ID);
    if (w?.status === 'completed') hydrate(INITIAL_FINDINGS, 'completed', '', w.completedAt ? new Date(w.completedAt) : null, {});
  }
  // subscribe after loading, so restoring the review is not saved straight back
  useFindingsStore.subscribe((s, p) => { if (s.findings !== p.findings) schedule(); });
  useReviewStore.subscribe((s, p) => { if (s.status !== p.status || s.comment !== p.comment || s.completedAt !== p.completedAt) schedule(); });
  setInterval(() => { if (spent() !== lastSpent) void save(); }, 60_000);
  const flush = () => { if (timer || spent() !== lastSpent) { clearTimeout(timer); timer = undefined; void save(true); } };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

function hydrate(findings: Finding[], status: 'inProgress' | 'completed', comment: string, completedAt: Date | null, timeByDay: Record<string, number>) {
  useFindingsStore.setState({ findings, history: [], readOnly: status === 'completed' });
  useReviewStore.setState({ status, comment, completedAt, timeByDay });
}

/** Back to CLAIRE's findings: deletes the saved review and reloads the case. */
export async function resetReview() {
  off = true;
  clearTimeout(timer);
  await api.resetReview(CURRENT_CASE_ID);
  window.location.reload();
}
