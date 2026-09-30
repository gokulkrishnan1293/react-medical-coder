import { PAGES } from '@/data';
import { scrollBehavior } from '@/lib/utils';
import { useAddFindingStore } from './store';

/**
 * Select words in the record as if the coder had dragged over them, bringing up the "Add …" bar.
 * Used by the tour. The words must sit in one text run of a block, outside any evidence box.
 */
export function selectInRecord(page: number, text: string) {
  const b = PAGES.find((p) => p.n === page)?.blocks.find((x) => x.t.includes(text));
  const el = b && document.querySelector<HTMLElement>(`[data-block="${b.id}"]`);
  if (!b || !el) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const i = n.data.indexOf(text);
    if (i < 0) continue;
    const range = document.createRange();
    range.setStart(n, i);
    range.setEnd(n, i + text.length);
    el.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    const ws = window.getSelection();
    ws?.removeAllRanges();
    ws?.addRange(range);
    useAddFindingStore.getState().set({ compose: null, sel: { block: b.id, page, text, range: range.cloneRange(), overlap: false } });
    return;
  }
}
