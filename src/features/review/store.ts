import { create } from 'zustand';
import { useFindingsStore } from '@/features/findings';

export type ReviewStatus = 'inProgress' | 'completed';

interface ReviewState {
  status: ReviewStatus;
  /** Coder's closing comment on the review. */
  comment: string;
  completedAt: Date | null;
  /** Seconds the case has been open in this session, while the tab is visible and the review not completed. */
  spentSeconds: number;
  tick: (seconds: number) => void;
  complete: (comment: string) => void;
  reopen: () => void;
}

/* Whether the coder has finished reviewing this document. A completed review is read-only until reopened. */
export const useReviewStore = create<ReviewState>((set) => ({
  status: 'inProgress',
  comment: '',
  completedAt: null,
  spentSeconds: 0,
  tick: (seconds) => set((s) => (s.status === 'completed' ? s : { spentSeconds: s.spentSeconds + seconds })),
  complete: (comment) => {
    set({ status: 'completed', comment: comment.trim(), completedAt: new Date() });
    useFindingsStore.setState({ readOnly: true });
  },
  reopen: () => {
    set({ status: 'inProgress', completedAt: null });
    useFindingsStore.setState({ readOnly: false });
  },
}));
