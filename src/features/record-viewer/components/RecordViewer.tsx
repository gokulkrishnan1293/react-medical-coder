import { useMemo, useRef } from 'react';
import type { Finding } from '@/types';
import { PAGES } from '@/data';
import { scrollerRef } from '@/lib/dom';
import { useFindings } from '@/features/findings';
import { useTextSelection } from '@/features/add-finding';
import { useUiStore } from '@/stores/uiStore';
import { useScrollSync } from '../useScrollSync';
import { RecordPage } from './RecordPage';
import { Minimap } from './Minimap';
import '../record.css';

/** The record: continuous scroll of pages, page indicator and minimap. */
export function RecordViewer() {
  const findings = useFindings();
  const currentPage = useUiStore((s) => s.currentPage);
  const onMouseUp = useTextSelection();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useScrollSync();

  const byBlock = useMemo(() => {
    const m: Record<string, Finding[]> = {};
    findings.forEach((f) => { (m[f.block] ??= []).push(f); });
    return m;
  }, [findings]);

  const onScroll = () => {
    const { scrolling, card, set } = useUiStore.getState();
    if (!scrolling) set({ scrolling: true });
    if (card && !card.pinned) set({ card: null });
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => set({ scrolling: false }), 420);
  };

  return (
    <div className="relative flex min-w-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onMouseUp={onMouseUp}
        onKeyUp={(e) => { if (e.shiftKey) onMouseUp(); }}
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-7 pb-[140px] max-[760px]:pt-4 max-[760px]:pb-[120px]"
      >
        <div className="mx-auto flex max-w-[800px] flex-col gap-7">
          {PAGES.map((p) => <RecordPage key={p.n} page={p} byBlock={byBlock} />)}
        </div>
      </div>
      <div className="pointer-events-none absolute top-2.5 right-[30px] z-5 rounded-full border border-line bg-chrome px-2.5 py-[3px] font-mono text-[11.5px] font-medium text-ink-2 tabular-nums max-[760px]:hidden">
        Page {currentPage} of {PAGES.length}
      </div>
      <Minimap />
    </div>
  );
}
