import { sortByReading, useFindingsStore } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useUiStore } from '@/stores/uiStore';

/** Jumps to the next pending AI suggestion after the active finding, wrapping around. */
export function nextAiSuggestion() {
  const ordered = sortByReading(useFindingsStore.getState().findings);
  const idx = ordered.findIndex((f) => f.id === useUiStore.getState().activeId);
  const next = [...ordered.slice(idx + 1), ...ordered.slice(0, idx + 1)].find((f) => f.status === 'ai');
  if (next) jumpTo(next.id);
}
