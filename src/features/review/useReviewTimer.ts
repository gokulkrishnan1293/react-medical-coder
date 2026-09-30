import { useEffect } from 'react';
import { useReviewStore } from './store';

const STEP = 5;

/** Counts time spent on the case while the workbench is open and the tab is visible. */
export function useReviewTimer() {
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') useReviewStore.getState().tick(STEP); }, STEP * 1000);
    return () => clearInterval(t);
  }, []);
}
