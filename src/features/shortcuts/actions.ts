import { sortByReading, useFindingsStore } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useUiStore, type FullNotesTab } from '@/stores/uiStore';
import { clamp } from '@/lib/utils';

/** Next (+1) or previous (-1) finding in reading order, starting from the current page if none is active. */
export function stepFinding(d: 1 | -1) {
  const ordered = sortByReading(useFindingsStore.getState().findings);
  if (!ordered.length) return;
  const { activeId, currentPage } = useUiStore.getState();
  let idx = ordered.findIndex((f) => f.id === activeId);
  if (idx < 0) {
    const first = ordered.findIndex((f) => f.page >= currentPage);
    idx = d > 0 ? first : first - 1;
    if (idx < 0) idx = d > 0 ? 0 : ordered.length - 1;
    jumpTo(ordered[clamp(idx, 0, ordered.length - 1)].id);
    return;
  }
  jumpTo(ordered[(idx + d + ordered.length) % ordered.length].id);
}

export const openFullNotes = (tab: FullNotesTab = 'findings') => useUiStore.getState().set({ full: tab, card: null });
