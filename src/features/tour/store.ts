import { create } from 'zustand';
import { NARROW_QUERY } from '@/hooks/useMediaQuery';
import { STEPS, type TourStep } from './steps';
import { resetStage } from './stage';

const SEEN_KEY = 'claire-review.tour-seen';

interface TourState {
  /** Steps for this run: wide-only steps drop out at phone width. */
  steps: TourStep[];
  /** Step on screen, or null when the tour is not running. */
  index: number | null;
  start: () => void;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage blocked: the tour may show again */ }
}

function seen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}

/* The guided tour: which step is showing, and arranging the screen for it. */
export const useTourStore = create<TourState>((set, get) => ({
  steps: STEPS,
  index: null,
  start: () => {
    const narrow = window.matchMedia(NARROW_QUERY).matches;
    set({ steps: STEPS.filter((s) => !(narrow && s.wide)) });
    get().go(0);
  },
  go: (i) => {
    const step = get().steps[i];
    if (!step) return;
    resetStage();
    step.setup?.();
    set({ index: i });
  },
  next: () => {
    const { index, steps, go, stop } = get();
    if (index === null) return;
    if (index >= steps.length - 1) stop();
    else go(index + 1);
  },
  prev: () => {
    const { index, go } = get();
    if (index) go(index - 1);
  },
  stop: () => {
    resetStage();
    markSeen();
    set({ index: null });
  },
}));

export const startTour = () => useTourStore.getState().start();

/** First visit, or ?tour in the address: start the tour once the screen has settled. */
export function startTourIfNew() {
  const asked = new URLSearchParams(window.location.search).has('tour');
  if (!asked && seen()) return undefined;
  const t = setTimeout(() => { if (useTourStore.getState().index === null) startTour(); }, 700);
  return () => clearTimeout(t);
}
