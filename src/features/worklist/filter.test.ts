import { describe, expect, it } from 'vitest';
import { ME, WORKLIST } from '@/data';
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

  it('counts my completions today and sums CLAIRE counts over the cases that have them', () => {
    expect(WORKLIST.filter((w) => completedToday(w, ME.id)).map((w) => w.id)).toEqual(['RC-2026-1183']);
    expect(sumTally(WORKLIST)).toEqual({ accepted: 15, modified: 3, rejected: 2, pending: 19, added: 1 });
  });
});
