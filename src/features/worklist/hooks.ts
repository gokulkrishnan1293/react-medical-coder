import { useMemo } from 'react';
import type { ClaireTally, Finding, WorkItem } from '@/types';
import { CASE, CASE_FOLDERS, INITIAL_FINDINGS, ME, WORKLIST, minutesByDay } from '@/data';
import { tallyReview, useOrderedFindings, useSummary } from '@/features/findings';
import { useReviewStore } from '@/features/review';

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
  const timeByDay = useReviewStore((s) => s.timeByDay);
  return useMemo(() => {
    const claire = tallyReview(ordered);
    return WORKLIST.map((w) => {
      if (w.id !== CASE.id) {
        // a case with CLAIRE's findings counts them as written; without, case.json's counts stand in
        const raw = CASE_FOLDERS[w.id]?.findings;
        return raw ? { ...w, claire: tallyReview(raw.map((f): Finding => ({ ...f, block: '', source: 'ai' }))) } : w;
      }
      // time in the workbench, saved by day, on top of the sessions case.json lists
      const byDay = { ...w.minutesByDay };
      for (const [k, sec] of Object.entries(timeByDay)) byDay[k] = (byDay[k] ?? 0) + sec / 60;
      const minutes = Math.floor(Object.values(byDay).reduce((a, b) => a + b, 0));
      const touched = ordered.length !== INITIAL_FINDINGS.length || ordered.some((f) => !INITIAL_FINDINGS.includes(f)) || Object.keys(timeByDay).length > 0;
      const live: WorkItem = { ...w, claire, minutes, minutesByDay: byDay };
      // started, or reopened after completing: in progress until completed again
      if (status !== 'completed') return touched || w.status === 'completed' ? { ...live, status: 'inProgress', completedAt: undefined, outcome: undefined } : live;
      return {
        ...live,
        status: 'completed',
        completedAt: (completedAt ?? new Date()).toISOString(),
        completedBy: ME.id,
        outcome: supports === CASE.billed ? 'overturned' : 'upheld',
      };
    });
  }, [status, completedAt, supports, ordered, timeByDay]);
}

/** CLAIRE counts summed over cases. */
export const sumTally = (items: WorkItem[]): ClaireTally =>
  items.reduce<ClaireTally>(
    (t, w) => (w.claire ? { accepted: t.accepted + w.claire.accepted, modified: t.modified + w.claire.modified, rejected: t.rejected + w.claire.rejected, pending: t.pending + w.claire.pending, added: t.added + w.claire.added } : t),
    { accepted: 0, modified: 0, rejected: 0, pending: 0, added: 0 },
  );

/** Minutes per day for the last 14 days, from every case's sessions and the time saved on the open case. */
export function useMinutesByDay(items: WorkItem[]) {
  return minutesByDay(items).map((d) => ({ ...d, minutes: Math.floor(d.minutes) }));
}
