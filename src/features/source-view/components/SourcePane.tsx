import { useEffect, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { PAGES, PAGE_H, PAGE_IMAGES, PAGE_W } from '@/data';
import { Icon } from '@/components/ui';
import { scrollerRef } from '@/lib/dom';
import { sourceRef } from '@/lib/docPosition';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { PAGE_COLUMN, ZoomControls, useFitWidth, useZoom, useZoomGestures } from '@/features/zoom';
import { openDocMenu } from '@/features/doc-menu';
import { setSourceMode } from '../actions';
import { alignSource, syncRecordFromSource, syncSourceFromRecord } from '../sync';
import { usePan } from '../usePan';

/** The original page images in a column beside the record, zoomed on their own, scroll-locked to it, and panned by dragging. */
export function SourcePane() {
  const zoom = useZoom('source');
  const syncScroll = useUiStore((s) => s.syncScroll);
  const mark = useUiStore((s) => s.sourceMark);
  useFitWidth('source', sourceRef);
  useZoomGestures('source', sourceRef);
  const panning = usePan(sourceRef);

  useLayoutEffect(() => { if (syncScroll) alignSource(); }, [syncScroll]);
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    sc.addEventListener('scroll', syncSourceFromRecord, { passive: true });
    return () => sc.removeEventListener('scroll', syncSourceFromRecord);
  }, []);

  return (
    <aside aria-label="Original document" className="relative flex min-w-0 flex-1 flex-col border-r border-line bg-desk max-[760px]:hidden">
      <div
        ref={sourceRef}
        onScroll={syncRecordFromSource}
        onContextMenu={(e) => openDocMenu(e, 'source')}
        className={cn('min-h-0 flex-1 overflow-auto px-4 pt-12 pb-[140px]', panning ? 'cursor-grabbing' : 'cursor-grab')}
      >
        <div style={{ width: PAGE_COLUMN * zoom }} className="mx-auto flex flex-col gap-7">
          {PAGES.map((p) => (
            <div key={p.n} data-page={p.n} className="relative">
              <img
                src={PAGE_IMAGES[p.n]}
                width={PAGE_W}
                height={PAGE_H}
                alt={`Original page ${p.n}`}
                className="block h-auto w-full rounded-[2px] shadow-page select-none"
                draggable={false}
              />
              {mark?.n === p.n && (
                <motion.div
                  key={mark.t}
                  aria-hidden
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="pointer-events-none absolute inset-x-0 h-10 -translate-y-1/2 border-y-2 border-accent bg-accent/15"
                  style={{ top: mark.f * 100 + '%' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <SourceToolbar />
    </aside>
  );
}

const iconBtn = 'grid size-6 place-items-center rounded-full text-ink-2 hover:bg-line';

function SourceToolbar() {
  const currentPage = useUiStore((s) => s.currentPage);
  const syncScroll = useUiStore((s) => s.syncScroll);
  const set = useUiStore((s) => s.set);
  return (
    <div className="absolute top-2.5 left-1/2 z-6 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-chrome py-0.5 pr-0.5 pl-3 text-[11.5px] whitespace-nowrap text-ink-2 shadow-page">
      <span className="font-semibold tracking-wide text-ink uppercase">Original</span>
      <span className="font-mono tabular-nums">p. {currentPage}/{PAGES.length}</span>
      <span className="mx-1 h-4 w-px bg-line" />
      <ZoomControls side="source" />
      <span className="mx-1 h-4 w-px bg-line" />
      <button
        type="button"
        className={cn(iconBtn, syncScroll && 'text-accent')}
        aria-pressed={syncScroll}
        aria-label="Sync scrolling with the record"
        title={syncScroll ? 'Scrolling with the record. Click to unlink' : 'Unlinked. Click to scroll with the record'}
        onClick={() => set({ syncScroll: !syncScroll })}
      >
        {syncScroll ? <Icon.link size={14} /> : <Icon.unlink size={14} />}
      </button>
      <button type="button" className={iconBtn} aria-label="Close original" title="Close original (Esc)" onClick={() => setSourceMode('stage')}>
        <Icon.close size={14} />
      </button>
    </div>
  );
}
