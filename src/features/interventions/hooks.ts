import { useMemo } from 'react';
import { CLAIM, INTERVENTION_RULES } from '@/data';
import { useFindings } from '@/features/findings';
import { deriveInterventions } from './derive';

/** Interventions derived from the current findings and the claim lines. */
export function useInterventions() {
  const findings = useFindings();
  return useMemo(() => deriveInterventions(findings, CLAIM.lines, INTERVENTION_RULES), [findings]);
}
