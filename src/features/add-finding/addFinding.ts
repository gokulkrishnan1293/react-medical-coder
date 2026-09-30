import type { Finding } from '@/types';
import { notesTargetRef } from '@/lib/dom';
import { flyChip } from '@/lib/flyChip';
import { tagOf, useFindingsStore } from '@/features/findings';
import { ui } from '@/stores/uiStore';
import { flash } from '@/features/record-viewer/navigation';
import { useAddFindingStore } from './store';

export type NewFinding = Pick<Finding, 'type'> & Partial<Pick<Finding, 'code' | 'desc' | 'mdm' | 'mar' | 'note'>>;

/** Adds a coder finding for the current selection and flies its chip into the notepad. */
export function addFinding(spec: NewFinding) {
  const { sel, cancel } = useAddFindingStore.getState();
  if (!sel) return;
  const id = 'u' + Date.now().toString(36);
  const f: Finding = { id, page: sel.page, block: sel.block, text: sel.text, source: 'coder', status: 'added', ...spec };
  const from = sel.range.getBoundingClientRect();
  useFindingsStore.getState().add(f);
  flyChip(from, tagOf(f) || 'NOTE', notesTargetRef.current);
  cancel();
  ui().set({ activeId: id });
  flash(id, 1800);
}
