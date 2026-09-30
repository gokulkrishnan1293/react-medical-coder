import { codeLabel, useFindingsStore } from '@/features/findings';
import { ui } from '@/stores/uiStore';
import { flash, jumpTo } from '@/features/record-viewer/navigation';
import { useAddFindingStore } from './store';

/* Changing a finding's evidence: pick the finding, then select the right words in the record. */

export function startRebind(id: string) {
  ui().set({ full: null, card: null, menu: null });
  useAddFindingStore.getState().set({ rebind: id, sel: null, compose: null });
  // show where the evidence is now, once the full notes have closed
  setTimeout(() => jumpTo(id, false), 60);
}

export function applyRebind() {
  const add = useAddFindingStore.getState();
  const { rebind: id, sel } = add;
  if (!id || !sel || sel.overlap) return;
  useFindingsStore.getState().setEvidence(id, { page: sel.page, block: sel.block, text: sel.text });
  window.getSelection()?.removeAllRanges();
  add.set({ rebind: null, sel: null, compose: null });
  ui().set({ activeId: id });
  setTimeout(() => flash(id, 1800), 30);
}

export function cancelRebind() {
  const add = useAddFindingStore.getState();
  add.set({ rebind: null });
  add.cancel();
}

/** Label of the finding being moved, for prompts. */
export function rebindLabel() {
  const id = useAddFindingStore.getState().rebind;
  const f = id && useFindingsStore.getState().findings.find((x) => x.id === id);
  return f ? codeLabel(f) : '';
}
