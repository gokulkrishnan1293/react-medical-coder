import { useLayoutEffect, useReducer } from 'react';
import { Icon } from '@/components/ui';
import { pageEl, scrollerRef } from '@/lib/dom';
import { cn } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { ui, useUiStore } from '@/stores/uiStore';
import { useZoom } from '@/features/zoom';
import { setDivider, setSourceMode } from '@/features/source-view';

/** A drag shorter than this is a click. */
const CLICK_PX = 4;
/** Letting go this close to either page edge leaves the overlay. */
const EDGE = 0.02;

const pageRect = () => pageEl(ui().currentPage)?.getBoundingClientRect();

/**
 * Drag handles on the page itself for the overlay view. While reading, a grip sits on each side
 * of the page: pull either one across to lay the scan over the text (the left grip brings the scan
 * in from the left, the right grip starts from the whole scan). In the overlay, one handle rides the
 * divider; take it back to either edge to return to reading. Everything stays level with the middle
 * of the viewport, so it is always within reach.
 */
export function PageSlider() {
  useScrollTick(scrollerRef);
  useZoom('record');
  const overlay = useUiStore((s) => s.source === 'overlay');
  const divider = useUiStore((s) => (s.peek ? 1 : s.divider));
  const currentPage = useUiStore((s) => s.currentPage);
  // pages are measured from the DOM, so draw once more after they are in place
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(remeasure, [currentPage]);

  const page = pageEl(currentPage);
  const box = scrollerRef.current?.parentElement;
  if (!page || !box) return null;
  const pr = page.getBoundingClientRect();
  const br = box.getBoundingClientRect();
  const x = (f: number) => pr.left - br.left + f * pr.width;

  const drag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // listen on the window: a grip is swapped for the divider handle as soon as the overlay opens
    const x0 = e.clientX;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - x0) < CLICK_PX) return;
      moved = true;
      if (ui().source !== 'overlay') setSourceMode('overlay');
      const r = pageRect();
      if (r) setDivider((ev.clientX - r.left) / r.width);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const { source, divider: d } = ui();
      if (!moved) {
        if (source !== 'overlay') { setDivider(0.5); setSourceMode('overlay'); }
      } else if (d < EDGE || d > 1 - EDGE) {
        setSourceMode('stage');
        setDivider(0.5);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    const next = { ArrowLeft: divider - step, ArrowRight: divider + step, Home: 0, End: 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    setDivider(next);
  };

  const grip = (side: 'left' | 'right') => (
    <button
      key={side}
      type="button"
      onPointerDown={drag}
      aria-label={`Overlay the original scan, from the ${side}`}
      title="Drag across the page to compare with the original scan. Click to open at half."
      className={cn(
        'group/grip pointer-events-auto absolute top-1/2 flex h-20 w-4 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center border border-line bg-chrome text-accent shadow-page transition-[width,background-color,color] hover:w-5 hover:bg-accent hover:text-accent-ink',
        side === 'left' ? 'rounded-l-md border-r-0' : 'rounded-r-md border-l-0',
      )}
      // flush with the page edge, outside it
      style={side === 'left' ? { right: br.width - x(0) } : { left: x(1) }}
    >
      <Icon.grip size={12} />
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-5 max-[760px]:hidden">
      {overlay ? (
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: x(divider) }}>
          <span className="absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full bg-ink/75 px-1.5 py-px text-[9.5px] font-semibold tracking-wide whitespace-nowrap text-paper uppercase">Original</span>
          <button
            type="button"
            role="slider"
            aria-label="Overlay divider: original on the left, extracted text on the right"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(divider * 100)}
            title="Drag, or use ← →. Hold Space to see the whole scan. Drag to either edge to close."
            onPointerDown={drag}
            onKeyDown={onKey}
            className="pointer-events-auto grid size-8 cursor-ew-resize touch-none place-items-center rounded-full border-2 border-paper bg-accent text-accent-ink shadow-float"
          >
            <span className="flex -space-x-1"><Icon.left size={13} sw={2.4} /><Icon.right size={13} sw={2.4} /></span>
          </button>
          <span className="absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-full bg-accent/90 px-1.5 py-px text-[9.5px] font-semibold tracking-wide whitespace-nowrap text-accent-ink uppercase">Extracted</span>
        </div>
      ) : (
        [grip('left'), grip('right')]
      )}
    </div>
  );
}
