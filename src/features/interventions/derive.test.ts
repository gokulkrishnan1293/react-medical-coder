import { describe, expect, it } from 'vitest';
import { CLAIM, INITIAL_FINDINGS, INTERVENTION_RULES } from '@/data';
import type { Finding } from '@/types';
import { deriveInterventions } from './derive';

const derive = (fs: Finding[], lines = CLAIM.lines) =>
  Object.fromEntries(deriveInterventions(fs, lines, INTERVENTION_RULES).map((d) => [d.rule.id, d]));

describe('deriveInterventions', () => {
  it('derives interventions from service and MAR findings', () => {
    const d = derive(INITIAL_FINDINGS);
    expect(d.monitor.state).toBe('met');
    expect(d.fluids.state).toBe('met');
    expect(d.infusion.state).toBe('pending');
    expect(d.monitor.evidence.map((f) => f.id)).toEqual(['i1']);
  });

  it('keeps the path: which condition matched, which claim lines, which diagnoses', () => {
    const fluids = derive(INITIAL_FINDINGS).fluids;
    expect(fluids.conditions[0].findings.map((f) => f.id)).toEqual(['s6']);
    expect(fluids.conditions[0].lines.map((l) => l.line)).toEqual([3]);
    expect(fluids.reasons.map((f) => f.code)).toEqual(['E86.0', 'E11.10']);
  });

  it('flags an intervention the claim bills but the record does not show', () => {
    const noHydration = INITIAL_FINDINGS.filter((f) => !['s6', 'm1', 'm3'].includes(f.id));
    expect(derive(noHydration).fluids.state).toBe('billedOnly');
    expect(derive(noHydration, []).fluids.state).toBe('none');
  });

  it('ignores rejected findings', () => {
    const fs = INITIAL_FINDINGS.map((f) => (f.id === 'i1' ? { ...f, status: 'rejected' as const } : f));
    expect(derive(fs).monitor.state).toBe('none');
  });

  it('derives specimen collection from lab tests, IV access from IV MAR entries, and finds no imaging', () => {
    const d = derive(INITIAL_FINDINGS);
    expect(d.specimen.state).toBe('met');
    expect(d.specimen.evidence.map((f) => f.code)).toContain('80053');
    expect(d.ivAccess.state).toBe('met');
    expect(d.ivAccess.conditions.find((c) => c.cond.kind === 'route')!.findings.map((f) => f.id)).toContain('m1');
    expect(d.imaging.state).toBe('none');
  });
});
