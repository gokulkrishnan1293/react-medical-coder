import { useEffect } from 'react';
import { BLOCKS } from '@/data';
import { scrollerRef } from '@/lib/dom';
import { useFindingsStore } from '@/features/findings';
import { useUiStore } from '@/stores/uiStore';
import { useAddFindingStore } from './store';

/**
 * Turns a text selection inside the record into a pending "add finding".
 * Returns the mouse-up handler for the record scroller.
 */
export function useTextSelection() {
  useEffect(() => {
    const onSelChange = () => {
      if (useAddFindingStore.getState().compose) return;
      const ws = window.getSelection();
      if (!ws || ws.isCollapsed) useAddFindingStore.getState().set({ sel: null });
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest) return;
      const add = useAddFindingStore.getState();
      if (!t.closest('[data-add-finding]') && add.compose) add.set({ compose: null, sel: null });
      if (!t.closest('[role=dialog],.ev,[data-row],[data-mm-tick],table')) {
        const { card, set } = useUiStore.getState();
        if (card?.pinned) set({ card: null });
      }
    };
    document.addEventListener('selectionchange', onSelChange);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('selectionchange', onSelChange);
      document.removeEventListener('mousedown', onDown);
    };
  }, []);

  return () => {
    setTimeout(() => {
      const ws = window.getSelection();
      if (!ws || ws.isCollapsed || !ws.rangeCount) return;
      const raw = ws.toString().replace(/\s+/g, ' ').trim();
      if (raw.length < 3) return;
      const range = ws.getRangeAt(0);
      const n = range.startContainer;
      const blkEl = (n.nodeType === 1 ? (n as Element) : n.parentElement)?.closest<HTMLElement>('.blk');
      if (!blkEl || !scrollerRef.current?.contains(blkEl)) return;
      const b = BLOCKS[blkEl.dataset.block!];
      let text = raw;
      if (b.t.indexOf(text) < 0) {
        // selection ran past the block: clip it to the block end
        const r2 = document.createRange();
        r2.setStart(range.startContainer, range.startOffset);
        r2.setEnd(blkEl, blkEl.childNodes.length);
        text = r2.toString().replace(/\s+/g, ' ').trim();
      }
      const i = b.t.indexOf(text);
      if (i < 0 || !text) return;
      const overlap = useFindingsStore.getState().findings.some((f) => {
        if (f.block !== b.id) return false;
        const j = b.t.indexOf(f.text);
        return j >= 0 && i < j + f.text.length && j < i + text.length;
      });
      useUiStore.getState().set({ card: null });
      useAddFindingStore.getState().set({ compose: null, sel: { block: b.id, page: b.page, text, range: range.cloneRange(), overlap } });
    }, 0);
  };
}
