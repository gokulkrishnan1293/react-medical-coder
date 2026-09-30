import { describe, expect, it } from 'vitest';
import type { Finding, SavedReview } from '@/types';
import { INITIAL_FINDINGS, locate } from '@/data';
import { applySavedReview, toSavedReview, type ReviewState } from './review';

const r0: ReviewState = { status: 'inProgress', comment: '', completedAt: null, timeByDay: { '2026-09-30': 90 } };
const save = (current: Finding[], r = r0): SavedReview => ({ ...toSavedReview('RC-2026-1187', INITIAL_FINDINGS, current, r), revision: 1, savedAt: '' });
const set = (id: string, patch: Partial<Finding>) => INITIAL_FINDINGS.map((f) => (f.id === id ? { ...f, ...patch } : f));

describe('saved review', () => {
  it('saves nothing for an untouched case', () => {
    const s = save(INITIAL_FINDINGS);
    expect(s.decisions).toEqual({});
    expect(s.added).toEqual([]);
    expect(s.review.timeByDay).toEqual({ '2026-09-30': 90 });
  });

  it('keeps only what changed, and round-trips to the same findings', () => {
    const d3 = INITIAL_FINDINGS.find((f) => f.id === 'd3')!;
    const mine: Finding = { ...d3, id: 'u1', source: 'coder', status: 'added', code: 'R10.84', desc: 'Generalized abdominal pain', page: 1, text: 'diffuse abdominal pain', block: locate(1, 'diffuse abdominal pain')! };
    const current = [...set('d2', { status: 'confirmed', comment: 'DKA confirmed' }).map((f) => (f.id === 'd4' ? { ...f, code: 'E87.20', desc: 'Acidosis', editedFrom: 'E87.5', editedFromDesc: 'Hyperkalemia' } : f)), mine];
    const s = save(current, { ...r0, status: 'completed', completedAt: new Date('2026-09-30T10:00:00Z') });
    expect(s.decisions).toEqual({
      d2: { status: 'confirmed', comment: 'DKA confirmed' },
      d4: { code: 'E87.20', desc: 'Acidosis', editedFrom: 'E87.5', editedFromDesc: 'Hyperkalemia' },
    });
    expect(s.added.map((a) => a.id)).toEqual(['u1']);
    const back = applySavedReview(INITIAL_FINDINGS, JSON.parse(JSON.stringify(s)), locate);
    expect(back.findings).toEqual(current);
    expect(back.review.status).toBe('completed');
    expect(back.notices).toEqual([]);
  });

  it('re-finds moved evidence, and falls back to CLAIRE when the words are gone', () => {
    const moved = set('d3', { page: 5, text: 'acute kidney injury', block: locate(5, 'acute kidney injury')!, movedFrom: { page: 5, block: INITIAL_FINDINGS.find((f) => f.id === 'd3')!.block, text: 'Acute kidney injury, prerenal' } });
    expect(applySavedReview(INITIAL_FINDINGS, save(moved), locate).findings).toEqual(moved);
    const stale = save(moved);
    stale.decisions.d3.text = 'words no longer in the record';
    const out = applySavedReview(INITIAL_FINDINGS, stale, locate);
    expect(out.findings.find((f) => f.id === 'd3')!.text).toBe('Acute kidney injury, prerenal');
    expect(out.notices).toHaveLength(1);
  });

  it('sets aside decisions for findings CLAIRE no longer has', () => {
    const s = save(set('d2', { status: 'rejected' }));
    s.decisions.gone = { status: 'confirmed' };
    const out = applySavedReview(INITIAL_FINDINGS, s, locate);
    expect(out.findings.find((f) => f.id === 'd2')!.status).toBe('rejected');
    expect(out.notices[0]).toContain('gone');
  });
});
