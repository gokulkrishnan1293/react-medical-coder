import { useMemo } from 'react';
import type { ClaireTally, WorkItem } from '@/types';
import { CASE, ME, WORKLIST, minutesByDay } from '@/data';
import { tallyReview, useOrderedFindings, useSummary } from '@/features/findings';
import { useReviewStore } from '@/features/review';
import { completedToday } from './filter';

/**
 * The worklist, with the case loaded in this prototype reflecting its live review: its CLAIRE counts follow
 * every accept, change and reject, and completing it moves it to Completed today with the outcome its
 * evidence supports.
 */
export function useWorklist(): WorkItem[] {
  const status = useReviewStore((s) => s.status);
  const completedAt = useReviewStore((s) => s.completedAt);
  const supports = useSummary().code;
  const ordered = useOrderedFindings();
  const spent = useReviewStore((s) => Math.floor(s.spentSeconds / 60));
  return useMemo(() => {
    const claire = tallyReview(ordered);
    return WORKLIST.map((w) => {
      if (w.id !== CASE.id) return w;
      const live: WorkItem = { ...w, claire, minutes: (w.minutes ?? 0) + spent };
      if (status !== 'completed') return live;
      return {
        ...live,
        status: 'completed',
        completedAt: (completedAt ?? new Date()).toISOString(),
        completedBy: ME.id,
        outcome: supports === CASE.billed ? 'overturned' : 'upheld',
      };
    });
  }, [status, completedAt, supports, ordered, spent]);
}

/** CLAIRE counts summed over cases. */
export const sumTally = (items: WorkItem[]): ClaireTally =>
  items.reduce<ClaireTally>(
    (t, w) => (w.claire ? { accepted: t.accepted + w.claire.accepted, modified: t.modified + w.claire.modified, rejected: t.rejected + w.claire.rejected, pending: t.pending + w.claire.pending, added: t.added + w.claire.added } : t),
    { accepted: 0, modified: 0, rejected: 0, pending: 0, added: 0 },
  );

/**
 * Minutes per day for the last 14 days. Today counts the cases completed today and the time on the open
 * case in this session; earlier days are synthetic until saved work exists (docs/DATA-SPEC.md).
 */
export function useMinutesByDay(items: WorkItem[]) {
  const session = useReviewStore((s) => Math.floor(s.spentSeconds / 60));
  // the open case counts only its time in this session; its earlier minutes belong to earlier days
  const done = items.filter((w) => completedToday(w) && w.id !== CASE.id).reduce((n, w) => n + (w.minutes ?? 0), 0);
  return minutesByDay(done + session);
}
