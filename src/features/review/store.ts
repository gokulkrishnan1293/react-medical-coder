import { create } from 'zustand';
import { dayKey } from '@/lib/utils';
import { useFindingsStore } from '@/features/findings';

export type ReviewStatus = 'inProgress' | 'completed';

interface ReviewState {
  status: ReviewStatus;
  /** Coder's closing comment on the review. */
  comment: string;
  completedAt: Date | null;
  /** Seconds the case has been open on each day (YYYY-MM-DD), while the tab is visible and the review not completed. Saved with the review. */
  timeByDay: Record<string, number>;
  tick: (seconds: number) => void;
  complete: (comment: string) => void;
  reopen: () => void;
}

/* Whether the coder has finished reviewing this document. A completed review is read-only until reopened. */
export const useReviewStore = create<ReviewState>((set) => ({
  status: 'inProgress',
  comment: '',
  completedAt: null,
  timeByDay: {},
  tick: (seconds) => set((s) => {
    if (s.status === 'completed') return s;
    const k = dayKey();
    return { timeByDay: { ...s.timeByDay, [k]: (s.timeByDay[k] ?? 0) + seconds } };
  }),
  complete: (comment) => {
    set({ status: 'completed', comment: comment.trim(), completedAt: new Date() });
    useFindingsStore.setState({ readOnly: true });
  },
  reopen: () => {
    set({ status: 'inProgress', completedAt: null });
    useFindingsStore.setState({ readOnly: false });
  },
}));

/** All the time recorded, in seconds. */
export const totalSeconds = (t: Record<string, number>) => Object.values(t).reduce((a, b) => a + b, 0);
