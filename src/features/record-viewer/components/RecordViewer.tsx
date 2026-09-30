import { type ReactNode, useMemo, useRef } from 'react';
import type { Finding } from '@/types';
import { PAGES } from '@/data';
import { scrollerRef } from '@/lib/dom';
import { useFindings } from '@/features/findings';
import { useTextSelection } from '@/features/add-finding';
import { useUiStore } from '@/stores/uiStore';
import { ZoomControls, useFitWidth, useZoom, useZoomGestures } from '@/features/zoom';
import { openDocMenu } from '@/features/doc-menu';
import { useScrollSync } from '../useScrollSync';
import { RecordPage } from './RecordPage';
import { OverlayPage } from './OverlayPage';
import { PageSlider } from './PageSlider';
import { Minimap } from './Minimap';
import '../record.css';

interface Props {
  /** Floats over the record's margin, e.g. the stack of original pages. */
  margin?: ReactNode;
  /** Extra controls shown next to zoom. */
  tools?: ReactNode;
}

/** The record: continuous scroll of pages, page indicator and minimap. */
export function RecordViewer({ margin, tools }: Props) {
  const findings = useFindings();
  const currentPage = useUiStore((s) => s.currentPage);
  /* Overlay view draws each page on the scan's line boxes, with the scan laid over it. */
  const source = useUiStore((s) => s.source);
  const overlay = source === 'overlay';
  const onMouseUp = useTextSelection();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const zoom = useZoom('record');
  useFitWidth('record', scrollerRef);
  useZoomGestures('record', scrollerRef);
  useScrollSync(overlay);

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
        data-tour="record"
        onScroll={onScroll}
        onMouseUp={onMouseUp}
        onKeyUp={(e) => { if (e.shiftKey) onMouseUp(); }}
        onContextMenu={(e) => openDocMenu(e, 'record')}
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-12 pb-[140px] max-[760px]:pt-4 max-[760px]:pb-[120px]"
      >
        <div style={{ zoom }} className="mx-auto flex max-w-[800px] flex-col gap-7">
          {PAGES.map((p) => (overlay
            ? <OverlayPage key={p.n} page={p} byBlock={byBlock} />
            : <RecordPage key={p.n} page={p} byBlock={byBlock} />))}
        </div>
      </div>
      <div className="pointer-events-none absolute top-2.5 right-[30px] z-5 rounded-full border border-line bg-chrome px-2.5 py-[3px] font-mono text-[11.5px] font-medium text-ink-2 tabular-nums max-[760px]:hidden">
        Page {currentPage} of {PAGES.length}
      </div>
      {margin}
      {source !== 'compare' && <PageSlider />}
      <div data-tour="record-tools" className="absolute top-2.5 left-[30px] z-6 flex items-center gap-1 rounded-full border border-line bg-chrome p-0.5 shadow-page max-[760px]:hidden">
        <ZoomControls side="record" />
        {tools && <><span className="mx-1 h-4 w-px bg-line" />{tools}</>}
      </div>
      <Minimap key={overlay ? 'overlay' : 'reading'} />
    </div>
  );
}
