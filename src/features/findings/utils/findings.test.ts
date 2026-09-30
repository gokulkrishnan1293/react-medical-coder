import { describe, expect, it } from 'vitest';
import { INITIAL_FINDINGS } from '@/data';
import type { Finding } from '@/types';
import { summarize } from './mdm';
import { routeOf, sortByReading, tagOf } from './finding';
import { segments } from './segments';

const byId = (id: string) => INITIAL_FINDINGS.find((f) => f.id === id)!;
const withStatus = (fs: Finding[], id: string, status: Finding['status']) => fs.map((f) => (f.id === id ? { ...f, status } : f));

describe('summarize (demo case)', () => {
  it('starts at 99214: Problems High, Data Low, Risk Moderate', () => {
    const s = summarize(INITIAL_FINDINGS);
    expect([s.prob, s.data, s.risk]).toEqual([3, 1, 2]);
    expect(s.code).toBe('99214');
  });

  it('accepting the BMP order makes Data Moderate', () => {
    const s = summarize(withStatus(INITIAL_FINDINGS, 'f8', 'confirmed'));
    expect(s.data).toBe(2);
    expect(s.code).toBe('99214');
  });

  it('adding a High risk element supports 99215', () => {
    const admit: Finding = {
      id: 'u1', page: 4, block: byId('f9').block, text: 'x', type: 'mdm', status: 'added', source: 'coder',
      mdm: { el: 'risk', level: 3, label: 'Decision regarding hospitalization' },
    };
    expect(summarize([...INITIAL_FINDINGS, admit]).code).toBe('99215');
  });

  it('AI suggestions only count when asked', () => {
    expect(summarize(INITIAL_FINDINGS, true).data).toBeGreaterThan(summarize(INITIAL_FINDINGS).data);
  });
});

describe('finding helpers', () => {
  it('routes codes on and off the claim', () => {
    expect(routeOf(byId('f1'))).toBe('onClaim');
    expect(routeOf(byId('f3'))).toBe('notOnClaim');
    expect(routeOf(byId('f11'))).toBe('info');
    expect(routeOf({ ...byId('f1'), status: 'rejected' })).toBe('excluded');
  });

  it('builds box tags', () => {
    expect(tagOf(byId('f1'))).toBe('E11.65 · PROB·H');
    expect(tagOf(byId('f6'))).toBe('DATA·C1');
  });

  it('sorts in reading order', () => {
    expect(sortByReading(INITIAL_FINDINGS)[0].id).toBe('f2');
  });

  it('segments text around evidence', () => {
    const f = byId('f4');
    const out = segments('stage: CKD stage 3a today', [f]);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('stage: ');
  });
});
