import { describe, expect, it } from 'vitest';
import { CLAIM, CLAIM_CODES, INITIAL_FINDINGS } from '@/data';
import { summarize } from '@/features/findings/utils/mdm';
import type { Finding } from '@/types';
import { checkDx, checkLine, notOnClaim } from './claimStatus';

const line = (code: string) => CLAIM.lines.find((l) => l.code === code)!;
const dx = (code: string) => CLAIM.dx.find((d) => d.code === code)!;
const s0 = summarize(INITIAL_FINDINGS);

describe('claim checks (demo case)', () => {
  it('visit level falls short until the evidence is accepted', () => {
    expect(checkLine(line('99285'), INITIAL_FINDINGS, s0).state).toBe('short');
    const accepted: Finding[] = INITIAL_FINDINGS.map((f) => (['d2', 'r1'].includes(f.id) ? { ...f, status: 'confirmed' } : f));
    expect(checkLine(line('99285'), accepted, summarize(accepted)).state).toBe('supported');
  });

  it('adds MAR units across administrations', () => {
    const c = checkLine(line('J7030'), INITIAL_FINDINGS, s0);
    expect(c.state).toBe('supported');
    expect(c.evidence).toHaveLength(2);
  });

  it('flags missing units', () => {
    const one = INITIAL_FINDINGS.map((f) => (f.id === 'm3' ? { ...f, status: 'rejected' as const } : f));
    expect(checkLine(line('J7030'), one, s0)).toMatchObject({ state: 'partial', label: '1 of 2 units' });
  });

  it('shows pending AI evidence and codes with none', () => {
    expect(checkLine(line('93005'), INITIAL_FINDINGS, s0).state).toBe('pending');
    const none = INITIAL_FINDINGS.filter((f) => f.code !== '96374');
    expect(checkLine(line('96374'), none, s0).state).toBe('notFound');
  });

  it('suggests a replacement diagnosis', () => {
    expect(checkDx(dx('E11.65'), INITIAL_FINDINGS)).toMatchObject({ state: 'pending', label: 'Review suggestion' });
    expect(checkDx(dx('E86.0'), INITIAL_FINDINGS).state).toBe('supported');
  });

  it('lists codes found in the record but not billed', () => {
    const codes = notOnClaim(INITIAL_FINDINGS, CLAIM_CODES).map((f) => f.code);
    expect(codes).toEqual(expect.arrayContaining(['E11.10', 'N17.9', 'E87.5', '96365', 'J1815', 'J3480']));
    expect(codes).not.toContain('J2405');
  });
});
