import type { ClaimLine, Finding } from '@/types';
import type { Condition, InterventionRule } from '@/data';
import { isLive } from '@/features/findings/utils/finding';

export type InterventionState = 'met' | 'pending' | 'billedOnly' | 'none';

export interface ConditionHit {
  cond: Condition;
  /** Service and MAR findings that meet the condition, accepted first. */
  findings: Finding[];
  /** Claim lines billed with a matching code. */
  lines: ClaimLine[];
}

/** An intervention and the path that reaches it: conditions, the findings and claim lines behind them, and the reason. */
export interface DerivedIntervention {
  rule: InterventionRule;
  /**
   * met: an accepted finding shows it · pending: only AI suggestions do ·
   * billedOnly: a claim line bills it but the record does not show it · none: not found.
   */
  state: InterventionState;
  conditions: ConditionHit[];
  /** Diagnoses found that make it necessary. */
  reasons: Finding[];
  /** Every finding behind it, accepted first. */
  evidence: Finding[];
}

const byStatus = (a: Finding, b: Finding) => Number(isLive(b)) - Number(isLive(a));
const uniqueByCode = (fs: Finding[]) => fs.filter((f, i) => fs.findIndex((x) => x.code === f.code) === i);

export function meets(cond: Condition, f: Finding): boolean {
  switch (cond.kind) {
    case 'code': return !!f.code && cond.codes.includes(f.code);
    case 'text': return cond.pattern.test(f.text) || cond.pattern.test(f.desc ?? '');
    case 'route': return !!f.mar && cond.pattern.test(f.mar.route);
  }
}

/**
 * ED interventions are not marked on the record: they follow from the services performed and the
 * medications given. Each rule is checked against service and MAR findings, and code conditions
 * against the claim lines too, so the review shows where the claim and the record agree.
 */
export function deriveInterventions(findings: Finding[], lines: ClaimLine[], rules: InterventionRule[]): DerivedIntervention[] {
  const open = findings.filter((f) => f.status !== 'rejected');
  const sources = open.filter((f) => f.type === 'svc' || f.type === 'mar');
  const dx = open.filter((f) => f.type === 'dx');
  return rules.map((rule) => {
    const conditions = rule.anyOf.map((cond) => ({
      cond,
      findings: sources.filter((f) => meets(cond, f)).sort(byStatus),
      lines: cond.kind === 'code' ? lines.filter((l) => cond.codes.includes(l.code)) : [],
    }));
    const evidence = [...new Set(conditions.flatMap((c) => c.findings))].sort(byStatus);
    const state: InterventionState = evidence.some(isLive) ? 'met'
      : evidence.length ? 'pending'
      : conditions.some((c) => c.lines.length) ? 'billedOnly'
      : 'none';
    // a diagnosis documented in several places is one reason: keep its best-reviewed finding
    const reasons = rule.because ? uniqueByCode(dx.filter((f) => !!f.code && rule.because!.codes.includes(f.code)).sort(byStatus)) : [];
    return { rule, state, conditions, reasons, evidence };
  });
}
