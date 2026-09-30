import { create } from 'zustand';

export type ReviewStatus = 'inProgress' | 'completed';

interface ReviewState {
  status: ReviewStatus;
  /** Coder's closing comment on the review. */
  comment: string;
  completedAt: Date | null;
  complete: (comment: string) => void;
  reopen: () => void;
}

/* Whether the coder has finished reviewing this document. */
export const useReviewStore = create<ReviewState>((set) => ({
  status: 'inProgress',
  comment: '',
  completedAt: null,
  complete: (comment) => set({ status: 'completed', comment: comment.trim(), completedAt: new Date() }),
  reopen: () => set({ status: 'inProgress', completedAt: null }),
}));
