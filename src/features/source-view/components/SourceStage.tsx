import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PAGES, PAGE_H, PAGE_IMAGES, PAGE_W } from '@/data';
import { pageEl, scrollerRef } from '@/lib/dom';
import { cn, scrollBehavior } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { setSourceMode } from '../actions';
import { PAGE_COLUMN, useZoom } from '@/features/zoom';

const CARD_W = 104;
/** Space the stack needs beside the page before it can sit out in the open. */
const ROOM = CARD_W + 44;

/**
 * Stage Manager-style stack of original page images in the left margin: the page you are
 * reading with its neighbours, tilted away. Click one to compare it with the record.
 */
export function SourceStage() {
  const currentPage = useUiStore((s) => s.currentPage);
  const zoom = useZoom('record');
  const [gutter, setGutter] = useState(0);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const ro = new ResizeObserver(() => setGutter((sc.clientWidth - Math.min(PAGE_COLUMN * zoom, sc.clientWidth - 32)) / 2));
    ro.observe(sc);
    return () => ro.disconnect();
  }, [zoom]);

  /* When the page fills the width, the stack tucks behind the edge and slides out on hover. */
  const tucked = gutter < ROOM;
  const pages = PAGES.filter((p) => Math.abs(p.n - currentPage) <= 1).map((p) => p.n);

  const open = (n: number) => {
    if (n !== currentPage) pageEl(n)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    setSourceMode('compare');
  };

  return (
    <div
      aria-label="Original pages"
      className={cn(
        'group/stage absolute top-1/2 left-0 z-5 -translate-y-1/2 py-6 pr-5 pl-4 transition-transform duration-300 ease-out max-[760px]:hidden',
        tucked && '-translate-x-[calc(100%-26px)] hover:translate-x-0 focus-within:translate-x-0',
      )}
    >
      <div className="mb-2 pl-0.5 text-[10px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Original</div>
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {pages.map((n) => {
            const current = n === currentPage;
            return (
              <motion.div
                key={n}
                layout
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: current ? 1 : 0.7, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                whileHover={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className="relative [perspective:700px] hover:z-10"
              >
                <button
                  type="button"
                  onClick={() => open(n)}
                  title={`Compare page ${n} with the original`}
                  aria-label={`Original page ${n}. Compare with the record`}
                  className={cn(
                    'relative block origin-left rounded-[3px] bg-paper shadow-page transition-[transform,scale,box-shadow] duration-200 ease-out [transform:rotateY(22deg)]',
                    'hover:scale-[1.12] hover:shadow-[var(--shadow)] hover:[transform:rotateY(0deg)] focus-visible:[transform:rotateY(0deg)]',
                    current && 'ring-2 ring-accent ring-offset-2 ring-offset-desk',
                  )}
                  style={{ width: CARD_W, height: (CARD_W * PAGE_H) / PAGE_W }}
                >
                  <img src={PAGE_IMAGES[n]} alt="" className="block size-full rounded-[3px]" draggable={false} />
                  <span className="absolute right-1 bottom-1 rounded-full bg-ink/75 px-1.5 font-mono text-[9.5px] leading-[15px] text-paper tabular-nums">
                    {n}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {tucked && (
        <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center group-hover/stage:opacity-0">
          <span className="h-10 w-1 rounded-full bg-ink-3/50" />
        </div>
      )}
    </div>
  );
}
