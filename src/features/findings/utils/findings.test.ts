import { describe, expect, it } from 'vitest';
import { INITIAL_FINDINGS } from '@/data';
import type { Finding } from '@/types';
import { summarize } from './mdm';
import { routeOf, sortByReading, tagOf } from './finding';
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

  it('AI suggestions only count when asked', () => {
    expect(summarize(INITIAL_FINDINGS, true).code).toBe('99285');
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
    expect(tagOf(byId('m2'))).toBe('J2405 · MAR');
    expect(tagOf(byId('i1'))).toBe('INTV');
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
