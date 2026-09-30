import { CASE } from '@/data';
import { LEVELS, useFindings, useOrderedFindings, useSummary } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useUiStore } from '@/stores/uiStore';
import type { Finding } from '@/types';
import { nextAiSuggestion } from './nextAi';

export interface Checkpoint {
  k: 'prob' | 'data' | 'risk' | 'lvl' | 'ai';
  label: string;
  val: string;
  met: boolean;
  part?: boolean;
  go: () => void;
}

/** Checkpoint pills derived from findings. See docs/specs/checkpoint-bar.md. */
export function useCheckpoints(): Checkpoint[] {
  const findings = useFindings();
  const ordered = useOrderedFindings();
  const s = useSummary();
  const withAi = useSummary(true);
  const aiTotal = findings.filter((f) => f.source === 'ai').length;
  const aiPending = findings.filter((f) => f.status === 'ai').length;
  const firstOf = (pred: (f: Finding) => boolean) => { const f = ordered.find(pred); if (f) jumpTo(f.id); };
  const pendingData = ordered.some((x) => x.mdm?.el === 'data' && x.status === 'ai');

  return [
    { k: 'prob', label: 'Problems', val: LEVELS[s.prob], met: s.prob >= 3, part: withAi.prob > s.prob, go: () => firstOf((f) => f.mdm?.el === 'problems') },
    { k: 'data', label: 'Data', val: LEVELS[s.data], met: s.data >= 2, part: withAi.data > s.data, go: () => firstOf((f) => f.mdm?.el === 'data' && (f.status === 'ai' || !pendingData)) },
    { k: 'risk', label: 'Risk', val: LEVELS[s.risk], met: s.risk >= 3, part: withAi.risk > s.risk, go: () => firstOf((f) => f.mdm?.el === 'risk' && f.mdm.level === s.risk) },
    { k: 'lvl', label: 'Level', val: `${s.code} of ${CASE.billed}`, met: s.code === CASE.billed, go: () => useUiStore.getState().set({ full: 'claim', card: null }) },
    { k: 'ai', label: 'AI review', val: `${aiTotal - aiPending} of ${aiTotal}`, met: !aiPending, part: aiPending < aiTotal, go: nextAiSuggestion },
  ];
}
