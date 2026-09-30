import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PAGES } from '@/data';
import { scrollerRef, evidenceEl, pageEl } from '@/lib/dom';
import { cn, scrollBehavior } from '@/lib/utils';
import { tagOf, useOrderedFindings } from '@/features/findings';
import type { FindingStatus } from '@/types';
import { useUiStore } from '@/stores/uiStore';
import { jumpTo } from '../navigation';

interface Mark { id: string; status: FindingStatus; t: number; code: string }

/** Slim overview strip on the scroll edge: page bounds, a tick per finding, and the viewport. */
export function Minimap() {
  const ordered = useOrderedFindings();
  const activeId = useUiStore((s) => s.activeId);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [pages, setPages] = useState<{ n: number; t: number; h: number }[]>([]);
  const [vp, setVp] = useState({ top: 0, h: 0.2 });
  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;

  const measure = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const H = sc.scrollHeight || 1;
    const base = sc.getBoundingClientRect().top - sc.scrollTop;
    setMarks(
      orderedRef.current.flatMap((f) => {
        const el = evidenceEl(f.id);
        return el ? [{ id: f.id, status: f.status, t: (el.getBoundingClientRect().top - base) / H, code: tagOf(f) }] : [];
      }),
    );
    setPages(
      PAGES.flatMap((p) => {
        const el = pageEl(p.n);
        if (!el) return [];
        const r = el.getBoundingClientRect();
        return [{ n: p.n, t: (r.top - base) / H, h: r.height / H }];
      }),
    );
    setVp({ top: sc.scrollTop / H, h: sc.clientHeight / H });
  }, []);

  useLayoutEffect(measure, [ordered, measure]);
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const onScroll = () => setVp({ top: sc.scrollTop / sc.scrollHeight, h: sc.clientHeight / sc.scrollHeight });
    sc.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(sc);
    if (sc.firstElementChild) ro.observe(sc.firstElementChild);
    document.fonts?.ready.then(measure);
    return () => { sc.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, [measure]);

  const onRail = (e: React.MouseEvent<HTMLDivElement>) => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientY - r.top) / r.height;
    sc.scrollTo({ top: f * sc.scrollHeight - sc.clientHeight / 2, behavior: scrollBehavior() });
  };

  return (
    <div className="relative w-5 flex-none cursor-pointer border-l border-line bg-chrome max-[760px]:w-3.5" onClick={onRail} title="Record overview. Click to jump.">
      {pages.map((p) => (
        <div key={p.n} className="absolute inset-x-0 border-t border-line" style={{ top: p.t * 100 + '%', height: p.h * 100 + '%' }} />
      ))}
      <div
        className="pointer-events-none absolute inset-x-0.5 rounded border border-ink/20 bg-ink/8 transition-[top] duration-75 ease-linear"
        style={{ top: vp.top * 100 + '%', height: vp.h * 100 + '%' }}
      />
      {marks.map((m) => (
        <button
          key={m.id}
          data-mm-tick
          title={m.code}
          aria-label={'Jump to ' + m.code}
          className={cn(
            'st-' + m.status,
            'absolute h-1 rounded-sm bg-st after:absolute after:-inset-1',
            activeId === m.id ? 'inset-x-px shadow-[0_0_0_2px_var(--chrome),0_0_0_3.5px_var(--c)]' : 'inset-x-1',
            m.status === 'rejected' && 'opacity-45',
          )}
          style={{ top: `calc(${m.t * 100}% - 2px)` }}
          onClick={(e) => { e.stopPropagation(); jumpTo(m.id); }}
        />
      ))}
    </div>
  );
}
