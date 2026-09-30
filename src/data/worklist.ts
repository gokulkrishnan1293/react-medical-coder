import type { Reviewer, WorkItem } from '@/types';

/* Synthetic worklist and history for the home screen and dashboard. One reviewer: the signed-in user. Patients are synthetic. */

export const ME: Reviewer = { id: 'gk', name: 'Gokul K.', initials: 'GK' };

/** Everyone who reviews cases. Just the signed-in user for now; locking (`openBy`) needs a second reviewer to show. */
export const REVIEWERS: Reviewer[] = [ME];

export const reviewerById = (id?: string | null) => REVIEWERS.find((r) => r.id === id);

/** A time relative to now: `days` from today at `hour:min` local time (days < 0 is the past). */
function at(days: number, hour = 9, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

type Spec = Omit<WorkItem, 'claimId' | 'billed' | 'paid' | 'stage'> & Partial<Pick<WorkItem, 'billed' | 'paid' | 'stage'>>;
const item = (claimId: string, s: Spec): WorkItem => ({ stage: 'Reconsideration', billed: '99285', paid: '99284', claimId, ...s });

/**
 * Three example cases: the demo case (in progress, its CLAIRE counts live from the review), one completed
 * today and one still to do. Only the demo case has a record loaded.
 */
export const WORKLIST: WorkItem[] = [
  item('NSH-ED-55120-03', { id: 'RC-2026-1187', documentId: 'MR-26-0048117', patient: 'DEMO, Jordan', payer: 'Northstar Health Plan', received: at(-12), due: at(18), status: 'inProgress', assignee: 'gk', available: true, minutes: 12 }),
  item('NSH-ED-55288-02', {
    id: 'RC-2026-1183', documentId: 'MR-26-0047902', patient: 'DEMO, Harper', payer: 'Northstar Health Plan', received: at(-13), due: at(5), status: 'completed', assignee: 'gk',
    completedAt: at(0, 11, 26), completedBy: 'gk', outcome: 'overturned', minutes: 23,
    claire: { accepted: 15, modified: 3, rejected: 2, pending: 0, added: 1 },
  }),
  item('NSH-ED-55341-01', {
    id: 'RC-2026-1192', documentId: 'MR-26-0048255', patient: 'TEST, Avery', payer: 'Northstar Health Plan', received: at(-10), due: at(2), status: 'new', assignee: 'gk', minutes: 0,
    claire: { accepted: 0, modified: 0, rejected: 0, pending: 19, added: 0 },
  }),
];

/** Minutes reviewed on each of the 13 days before today, oldest first (weekends off). Synthetic. */
const PAST_MINUTES = [74, 96, 0, 0, 58, 112, 83, 101, 67, 0, 0, 88, 45];

/** Minutes reviewed per day over the last 14 days, ending with `today` (computed from the live worklist). */
export function minutesByDay(today: number): { date: Date; minutes: number }[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return [...PAST_MINUTES, today].map((minutes, i, all) => {
    const date = new Date(start);
    date.setDate(date.getDate() - (all.length - 1 - i));
    return { date, minutes };
  });
}
