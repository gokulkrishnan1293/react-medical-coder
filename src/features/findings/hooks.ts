import { useMemo } from 'react';
import { useFindingsStore } from './store/findingsStore';
import { sortByReading } from './utils/finding';
import { summarize } from './utils/mdm';

export const useFindings = () => useFindingsStore((s) => s.findings);

/** The review is completed, so nothing can be changed until it is reopened. */
export const useReadOnly = () => useFindingsStore((s) => s.readOnly);

/** Findings in reading order. */
export function useOrderedFindings() {
  const findings = useFindings();
  return useMemo(() => sortByReading(findings), [findings]);
}

/** MDM summary from accepted and coder-added evidence. */
export function useSummary(includeAi = false) {
  const findings = useFindings();
  return useMemo(() => summarize(findings, includeAi), [findings, includeAi]);
}
