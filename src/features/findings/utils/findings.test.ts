import { describe, expect, it } from 'vitest';
import { INITIAL_FINDINGS } from '@/data';
import type { Finding } from '@/types';
import { mdmOf } from '@/data';
import { summarize } from './mdm';
import { routeOf, sortByReading, tagOf, tallyReview } from './finding';
import { segments } from './segments';

const byId = (id: string) => INITIAL_FINDINGS.find((f) => f.id === id)!;
const accept = (fs: Finding[], ...ids: string[]) => fs.map((f) => (ids.includes(f.id) ? { ...f, status: 'confirmed' as const } : f));

describe('summarize (demo ED case)', () => {
  it('starts at 99284: Problems, Data and Risk all Moderate', () => {
    const s = summarize(INITIAL_FINDINGS);
    expect([s.prob, s.data, s.risk]).toEqual([2, 2, 2]);
    expect(s.code).toBe('99284');
  });

  it('accepting DKA and the admission decision supports 99285', () => {
    const s = summarize(accept(INITIAL_FINDINGS, 'd2', 'r1'));
    expect([s.prob, s.risk]).toEqual([3, 3]);
    expect(s.code).toBe('99285');
  });

  it('accepting the ECG interpretation makes Data High', () => {
    expect(summarize(accept(INITIAL_FINDINGS, 's4')).data).toBe(3);
  });

  it('counts a test tagged in two places once', () => {
    const cmp = { ...byId('s1'), status: 'added' as const };
    const again = { ...cmp, id: 'again', page: 5 };
    const base = INITIAL_FINDINGS.filter((f) => f.id !== 's1');
    expect(summarize([...base, cmp, again]).c1).toBe(summarize([...base, cmp]).c1);
  });

  it('AI suggestions only count when asked', () => {
    expect(summarize(INITIAL_FINDINGS, true).code).toBe('99285');
  });
});

describe('mdmOf (MDM derived from findings)', () => {
  it('takes Problems from diagnoses, Data from tests, Risk from drugs and decisions', () => {
    expect(mdmOf(byId('d2'))).toMatchObject({ el: 'problems', level: 3 });
    expect(mdmOf(byId('s1'))).toMatchObject({ el: 'data', cat: 1 });
    expect(mdmOf(byId('s4'))).toMatchObject({ el: 'data', cat: 2 });
    expect(mdmOf(byId('m2'))).toMatchObject({ el: 'risk', level: 2 });
    expect(mdmOf(byId('r1'))).toMatchObject({ el: 'risk', level: 3 });
    expect(mdmOf(byId('r3'))).toMatchObject({ el: 'data', cat: 3 });
  });

  it('gives no credit for IV fluids or services that are not tests', () => {
    expect(mdmOf(byId('m1'))).toBeNull();
    expect(mdmOf(byId('s5'))).toBeNull();
  });
});

describe('finding helpers', () => {
  it('routes findings', () => {
    expect(routeOf(byId('d5'))).toBe('onClaim');
    expect(routeOf(byId('d2'))).toBe('notOnClaim');
    expect(routeOf(byId('m4'))).toBe('notOnClaim');
    expect(routeOf(byId('i1'))).toBe('support');
    expect(routeOf({ ...byId('d5'), status: 'rejected' })).toBe('excluded');
  });

  it('builds box tags', () => {
    expect(tagOf(byId('d2'))).toBe('E11.10 · PROB·H');
    expect(tagOf(byId('m2'))).toBe('J2405 · RISK·M · MAR');
    expect(tagOf(byId('r1'))).toBe('RISK·H');
    expect(tagOf(byId('i1'))).toBe('SVC');
  });

  it('sorts in reading order', () => {
    expect(sortByReading(INITIAL_FINDINGS)[0].id).toBe('d1');
  });

  it('segments text around evidence', () => {
    const out = segments('Diagnoses: Hyperkalemia today', [byId('d4')]);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('Diagnoses: ');
  });
});

describe('tallyReview', () => {
  const set = (fs: Finding[], id: string, patch: Partial<Finding>) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f));

  it('counts per code: a code with any place still pending is to review', () => {
    const t = tallyReview(sortByReading(INITIAL_FINDINGS));
    expect(t.pending).toBeGreaterThan(0);
    expect(t.rejected + t.modified + t.added).toBe(0);
  });

  it('sorts decisions into accepted, modified and rejected, and keeps my own findings apart', () => {
    let fs = INITIAL_FINDINGS.map((f) => (f.status === 'ai' ? { ...f, status: 'confirmed' as const } : f));
    fs = set(fs, 'd4', { status: 'rejected' });
    fs = set(fs, 'd4b', { status: 'rejected' });
    fs = set(fs, 'd3', { editedFrom: 'N17.0' });
    fs = [...fs, { ...byId('d1'), id: 'mine', source: 'coder', status: 'added', code: 'R10.9', desc: 'Abdominal pain' }];
    const t = tallyReview(sortByReading(fs));
    expect(t).toMatchObject({ pending: 0, rejected: 1, modified: 1, added: 1 });
    expect(t.accepted).toBeGreaterThan(10);
  });
});
