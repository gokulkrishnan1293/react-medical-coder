import { describe, expect, it } from 'vitest';
import { ME, WORKLIST, minutesByDay } from '@/data';
import { completedToday, countByView, filterCases, lockedFor } from './filter';
import { sumTally } from './hooks';

describe('worklist', () => {
  it('finds cases by any word of ID, patient, claim or payer', () => {
    expect(filterCases(WORKLIST, { q: 'harper', me: ME.id }).map((w) => w.id)).toEqual(['RC-2026-1183']);
    expect(filterCases(WORKLIST, { q: 'northstar 1192', me: ME.id }).map((w) => w.id)).toEqual(['RC-2026-1192']);
    expect(filterCases(WORKLIST, { q: 'nothing-like-this', me: ME.id })).toHaveLength(0);
  });

  it('has three example cases, all mine, none locked', () => {
    expect(WORKLIST).toHaveLength(3);
    expect(WORKLIST.every((w) => w.assignee === ME.id)).toBe(true);
    expect(countByView(WORKLIST, ME.id)).toMatchObject({ all: 3, new: 1, inProgress: 1, completed: 1, locked: 0 });
  });

  it('would lock a case someone else has open, never my own', () => {
    const w = { ...WORKLIST[0], openBy: { reviewer: 'other', since: new Date().toISOString() } };
    expect(lockedFor(w, ME.id)).toBe(true);
    expect(lockedFor(w, 'other')).toBe(false);
  });

  it('lists open work by due date before completed work', () => {
    expect(filterCases(WORKLIST, { me: ME.id }).map((w) => w.id)).toEqual(['RC-2026-1192', 'RC-2026-1187', 'RC-2026-1183']);
  });

  it('counts my completions today', () => {
    expect(WORKLIST.filter((w) => completedToday(w, ME.id)).map((w) => w.id)).toEqual(['RC-2026-1183']);
  });

  it('adds up time the same way per case and per day, from the sessions in case.json', () => {
    const perCase = WORKLIST.reduce((n, w) => n + (w.minutes ?? 0), 0);
    const perDay = minutesByDay(WORKLIST).reduce((n, d) => n + d.minutes, 0);
    expect(perCase).toBe(35);
    expect(perDay).toBe(perCase);
    expect(minutesByDay(WORKLIST).at(-1)!.minutes).toBe(15);
  });

  it('sums CLAIRE counts over cases', () => {
    const t = { accepted: 1, modified: 0, rejected: 0, pending: 2, added: 0 };
    expect(sumTally([{ ...WORKLIST[0], claire: t }, { ...WORKLIST[1], claire: t }, WORKLIST[2]])).toMatchObject({ accepted: 2, pending: 4 });
  });
});
