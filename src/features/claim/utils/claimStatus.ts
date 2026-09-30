import type { ClaimDx, ClaimLine, Finding, MdmSummary } from '@/types';
import { CASE, mdmOf } from '@/data';
import { isLive } from '@/features/findings/utils/finding';

export type ClaimState = 'supported' | 'partial' | 'short' | 'replaced' | 'pending' | 'notFound';

export interface ClaimCheck {
  state: ClaimState;
  /** Short badge text. */
  label: string;
  /** One-line explanation of what the record shows. */
  detail: string;
  /** Findings to jump to, best first. */
  evidence: Finding[];
}

const pages = (fs: Finding[]) => [...new Set(fs.map((f) => f.page))].map((p) => `p. ${p}`).join(', ');

function byCode(code: string, findings: Finding[]) {
  const open = findings.filter((f) => f.code === code && f.status !== 'rejected');
  return { live: open.filter(isLive), pending: open.filter((f) => f.status === 'ai') };
}

function replacement(code: string, findings: Finding[]): ClaimCheck | null {
  const rep = findings.find((f) => f.replaces === code && f.status !== 'rejected');
  if (!rep) return null;
  return isLive(rep)
    ? { state: 'replaced', label: `Record shows ${rep.code}`, detail: `${rep.desc} (p. ${rep.page}).`, evidence: [rep] }
    : { state: 'pending', label: 'Review suggestion', detail: `AI suggests ${rep.code} instead (p. ${rep.page}).`, evidence: [rep] };
}

/** How well the record supports one claim line. */
export function checkLine(l: ClaimLine, findings: Finding[], s: MdmSummary): ClaimCheck {
  if (l.code === CASE.billed) {
    const mdm = findings.filter((f) => isLive(f) && mdmOf(f));
    return s.code === CASE.billed
      ? { state: 'supported', label: `Supports ${s.code}`, detail: 'Accepted evidence supports the billed level.', evidence: mdm }
      : { state: 'short', label: `Supports ${s.code}`, detail: `Accepted evidence supports ${s.code}, paid as ${l.paidCode}.`, evidence: mdm };
  }
  const { live, pending } = byCode(l.code, findings);
  if (live.length) {
    if (l.kind === 'drug') {
      const units = live.reduce((n, f) => n + (f.mar?.units ?? 0), 0);
      if (units < l.units) {
        return { state: 'partial', label: `${units} of ${l.units} units`, detail: `MAR supports ${units} of ${l.units} billed units (${pages(live)}).`, evidence: [...live, ...pending] };
      }
      return { state: 'supported', label: 'Supported', detail: `${units} units on the MAR (${pages(live)}).`, evidence: live };
    }
    return { state: 'supported', label: 'Supported', detail: `Documented on ${pages(live)}.`, evidence: live };
  }
  if (pending.length) return { state: 'pending', label: 'Needs review', detail: `AI found evidence on ${pages(pending)}.`, evidence: pending };
  return { state: 'notFound', label: 'Not found', detail: 'No evidence in the record yet.', evidence: [] };
}

/** How well the record supports one claim diagnosis. */
export function checkDx(d: ClaimDx, findings: Finding[]): ClaimCheck {
  const { live, pending } = byCode(d.code, findings);
  if (live.length) return { state: 'supported', label: 'Supported', detail: `Documented on ${pages(live)}.`, evidence: live };
  const rep = replacement(d.code, findings);
  if (rep) return rep;
  if (pending.length) return { state: 'pending', label: 'Needs review', detail: `AI found evidence on ${pages(pending)}.`, evidence: pending };
  return { state: 'notFound', label: 'Not found', detail: 'No evidence in the record yet.', evidence: [] };
}

/** Coded findings whose code is not on the claim (open or accepted). */
export const notOnClaim = (findings: Finding[], claimCodes: Set<string>) =>
  findings.filter((f) => f.code && !claimCodes.has(f.code) && f.status !== 'rejected');
