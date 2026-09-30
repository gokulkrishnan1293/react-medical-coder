import { useMemo } from 'react';
import { CLAIM, CLAIM_CODES } from '@/data';
import { sortByReading, useFindings, useSummary } from '@/features/findings';
import { checkDx, checkLine, notOnClaim } from './utils/claimStatus';

/** Claim lines and diagnoses checked against the current findings. */
export function useClaimChecks() {
  const findings = useFindings();
  const s = useSummary();
  return useMemo(() => {
    const sorted = sortByReading(findings);
    return {
      lines: CLAIM.lines.map((l) => ({ l, c: checkLine(l, sorted, s) })),
      dx: CLAIM.dx.map((d) => ({ d, c: checkDx(d, sorted) })),
      extra: notOnClaim(sorted, CLAIM_CODES),
    };
  }, [findings, s]);
}
