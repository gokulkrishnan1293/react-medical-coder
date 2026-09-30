import type { WorkItem } from '@/types';
import { CASE_FOLDERS } from './caseFolders';
import { dayKey } from '@/lib/utils';
import { ME } from './reference';

/* The worklist and review-time history, built from the case folders and reference/user.json. */

/** A time relative to now: `days` from today at `hour:min` local time (days < 0 is the past). */
function at(days: number, hour = 9, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

/** The worklist: one row per case folder (src/data/cases/<id>/case.json → worklist), all assigned to me. */
export const WORKLIST: WorkItem[] = Object.values(CASE_FOLDERS)
  .map(({ id, file, claim }): WorkItem => {
    const w = file.worklist;
    return {
      id,
      stage: file.case.stage,
      patient: file.patient.name,
      documentId: w.documentId,
      claimId: claim.id,
      payer: file.case.payer,
      billed: file.case.billed,
      paid: file.case.paid,
      received: at(-w.receivedDaysAgo),
      due: at(w.dueInDays),
      status: w.status,
      assignee: ME.id,
      ...(w.status === 'completed' && {
        completedAt: w.completedToday ? at(0, ...(w.completedToday.split(':').map(Number) as [number, number])) : at(-(w.completedDaysAgo ?? 1), 16),
        completedBy: ME.id,
        outcome: w.outcome,
      }),
      ...sessions(w.sessions ?? []),
      claire: w.claire,
      available: true,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

/** Minutes spent on a case, in total and by day, from its sessions in case.json. */
function sessions(list: { daysAgo: number; minutes: number }[]) {
  const minutesByDay: Record<string, number> = {};
  for (const s of list) {
    const d = new Date();
    d.setDate(d.getDate() - s.daysAgo);
    minutesByDay[dayKey(d)] = (minutesByDay[dayKey(d)] ?? 0) + s.minutes;
  }
  return { minutes: list.reduce((n, s) => n + s.minutes, 0), minutesByDay };
}

/** Minutes reviewed on each of the last `days` days, ending today, summed over the cases. */
export function minutesByDay(items: WorkItem[], days = 14): { date: Date; minutes: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - i));
    const k = dayKey(date);
    return { date, minutes: items.reduce((n, w) => n + (w.minutesByDay?.[k] ?? 0), 0) };
  });
}
