import { create } from 'zustand';
import { NARROW_QUERY } from '@/hooks/useMediaQuery';
import { STEPS, type TourStep } from './steps';
import { HOME_STEPS } from './homeSteps';
import { rememberStage, resetStage, restoreStage } from './stage';

/** Two walkthroughs: the review workbench for a case, and the home screen. Each is seen once on its own. */
export type TourName = 'case' | 'home';

const TOURS: Record<TourName, { steps: TourStep[]; seenKey: string }> = {
  case: { steps: STEPS, seenKey: 'claire-review.tour-seen' },
  home: { steps: HOME_STEPS, seenKey: 'claire-review.home-tour-seen' },
};

interface TourState {
  /** Which walkthrough is running. */
  tour: TourName;
  /** Steps for this run: wide-only steps drop out at phone width. */
  steps: TourStep[];
  /** Step on screen, or null when the tour is not running. */
  index: number | null;
  start: (tour?: TourName) => void;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

function markSeen(tour: TourName) {
  try { localStorage.setItem(TOURS[tour].seenKey, '1'); } catch { /* storage blocked: the tour may show again */ }
}

function seen(tour: TourName) {
  try { return localStorage.getItem(TOURS[tour].seenKey) === '1'; } catch { return true; }
}

/* The guided tour: which step is showing, and arranging the screen for it. */
export const useTourStore = create<TourState>((set, get) => ({
  tour: 'case',
  steps: STEPS,
  index: null,
  start: (tour = 'case') => {
    const narrow = window.matchMedia(NARROW_QUERY).matches;
    if (tour === 'case' && get().index === null) rememberStage();
    set({ tour, steps: TOURS[tour].steps.filter((s) => !(narrow && s.wide)) });
    get().go(0);
  },
  go: (i) => {
    const step = get().steps[i];
    if (!step) return;
    if (get().tour === 'case') resetStage();
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
    const { tour } = get();
    if (tour === 'case') { resetStage(); restoreStage(); }
    markSeen(tour);
    set({ index: null });
  },
}));

export const startTour = (tour: TourName = 'case') => useTourStore.getState().start(tour);

/** First visit to a screen, or ?tour in the address: start its tour once the screen has settled. */
export function startTourIfNew(tour: TourName = 'case') {
  const asked = new URLSearchParams(window.location.search).has('tour');
  if (!asked && seen(tour)) return undefined;
  const t = setTimeout(() => { if (useTourStore.getState().index === null) startTour(tour); }, 700);
  return () => clearTimeout(t);
}
