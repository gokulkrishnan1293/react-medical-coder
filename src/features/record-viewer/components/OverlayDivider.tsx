import { useLayoutEffect, useReducer } from 'react';
import { Icon } from '@/components/ui';
import { pageEl, scrollerRef } from '@/lib/dom';
import { useScrollTick } from '@/hooks/useScrollTick';
import { useUiStore } from '@/stores/uiStore';
import { useZoom } from '@/features/zoom';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The slider handle for the overlay view. One handle, held in the middle of the viewport,
 * moves the divider on every page at once.
 */
export function OverlayDivider() {
  useScrollTick(scrollerRef);
  useZoom('record');
  const divider = useUiStore((s) => s.divider);
  const peek = useUiStore((s) => s.peek);
  const currentPage = useUiStore((s) => s.currentPage);
  const set = useUiStore((s) => s.set);
  // pages are measured from the DOM, so draw once more after they are in place
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(remeasure, []);

  const page = pageEl(currentPage);
  const box = scrollerRef.current?.parentElement;
  if (!page || !box) return null;
  const pr = page.getBoundingClientRect();
  const br = box.getBoundingClientRect();
  const v = peek ? 1 : divider;

  const drag = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = pageEl(useUiStore.getState().currentPage)?.getBoundingClientRect();
      if (r) set({ divider: clamp01((ev.clientX - r.left) / r.width) });
    };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    const next = { ArrowLeft: v - step, ArrowRight: v + step, Home: 0, End: 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    set({ divider: clamp01(next) });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-5 max-[760px]:hidden">
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pr.left - br.left + v * pr.width }}>
        <span className="absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full bg-ink/80 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-paper uppercase">Original</span>
        <button
          type="button"
          role="slider"
          aria-label="Overlay divider: original on the left, extracted text on the right"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(v * 100)}
          title="Drag, or use ← →. Hold Space to see the whole scan."
          onPointerDown={drag}
          onKeyDown={onKey}
          className="pointer-events-auto grid size-8 cursor-ew-resize touch-none place-items-center rounded-full border-2 border-paper bg-accent text-accent-ink shadow-float"
        >
          <span className="flex -space-x-1"><Icon.left size={13} sw={2.4} /><Icon.right size={13} sw={2.4} /></span>
        </button>
        <span className="absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-accent-ink uppercase">Extracted</span>
      </div>
    </div>
  );
}
