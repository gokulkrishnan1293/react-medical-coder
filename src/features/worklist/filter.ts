import type { WorkItem } from '@/types';
import { reviewerById } from '@/data';

export type WorkView = 'all' | 'mine' | 'new' | 'inProgress' | 'completed' | 'locked';

/** Open by another reviewer right now: shown, but it cannot be opened. */
export const lockedFor = (w: WorkItem, me: string) => !!w.openBy && w.openBy.reviewer !== me;

export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const completedToday = (w: WorkItem, by?: string) =>
  !!w.completedAt && new Date(w.completedAt) >= startOfToday() && (!by || w.completedBy === by);

/** Whole days from today to the due date: 0 today, negative when overdue. */
export function daysLeft(w: WorkItem, now = new Date()) {
  const a = new Date(now); a.setHours(0, 0, 0, 0);
  const b = new Date(w.due); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const inView = (w: WorkItem, view: WorkView, me: string) => {
  switch (view) {
    case 'all': return true;
    case 'mine': return w.assignee === me && w.status !== 'completed';
    case 'locked': return lockedFor(w, me);
    default: return w.status === view;
  }
};

/** Every word of the query must match the case ID, patient, document, claim, payer, stage, codes or assignee. */
function matches(w: WorkItem, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [w.id, w.patient, w.documentId, w.claimId, w.payer, w.stage, w.billed, w.paid, reviewerById(w.assignee)?.name ?? '', reviewerById(w.openBy?.reviewer)?.name ?? '']
    .join(' ').toLowerCase();
  return words.every((t) => hay.includes(t));
}

/**
 * The worklist as shown: searched, filtered to a view, open work first by due date, then completed work
 * with the most recent first.
 */
export function filterCases(items: WorkItem[], { q = '', view = 'all' as WorkView, me }: { q?: string; view?: WorkView; me: string }) {
  return items
    .filter((w) => inView(w, view, me) && matches(w, q))
    .sort((a, b) => {
      const done = Number(a.status === 'completed') - Number(b.status === 'completed');
      if (done) return done;
      if (a.status === 'completed') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
      return a.due.localeCompare(b.due);
    });
}

export const countByView = (items: WorkItem[], me: string) =>
  Object.fromEntries((['all', 'mine', 'new', 'inProgress', 'completed', 'locked'] as WorkView[]).map((v) => [v, items.filter((w) => inView(w, v, me)).length])) as Record<WorkView, number>;
