import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { PAGES, PAGE_H, PAGE_IMAGES, PAGE_W } from '@/data';
import { Button, Icon, Kbd } from '@/components/ui';
import { clamp } from '@/lib/utils';
import { useExtractionStore } from '../store';
import { cropPage } from '../report';

interface Box { x: number; y: number; w: number; h: number }

/** Smallest capture, in page pixels: anything less is a click, not a drag. */
const MIN = 12;

/**
 * Capture from the original, inside the app: the page of the original the flag is on, scrolled to it. Drag a
 * box around what matters and use it; step to the page before or after if the evidence is there. The capture
 * is cut from the page image itself, so it is as sharp as the scan. Enter uses it, Esc cancels.
 */
export function CaptureOverlay() {
  const capture = useExtractionStore((s) => s.capture)!;
  const set = useExtractionStore((s) => s.set);
  const [page, setPage] = useState(capture.page);
  const [box, setBox] = useState<Box | null>(null);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const close = () => set({ capture: null });

  // page pixels ↔ screen pixels: the page fills the view's width
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.6, (el.clientWidth - 48) / PAGE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // open at the flag; other pages open at the top
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = page === capture.page ? Math.max(0, capture.top * scale - 120) : 0;
  }, [page, scale, capture.page, capture.top]);

  const use = async () => {
    if (!box || busy) return;
    setBusy(true);
    try { capture.onDone(await cropPage(page, box)); close(); } finally { setBusy(false); }
  };

  useEffect(() => {
    // capture phase: Esc and Enter belong to this view, not to the editor or the workbench underneath
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void use(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); e.stopImmediatePropagation();
        const n = clamp(page + (e.key === 'ArrowLeft' ? -1 : 1), 1, PAGES.length);
        if (n !== page) { setPage(n); setBox(null); }
      } else e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  });

  const toPage = (clientX: number, clientY: number) => {
    const r = sheet.current!.getBoundingClientRect();
    return { x: clamp((clientX - r.left) / scale, 0, PAGE_W), y: clamp((clientY - r.top) / scale, 0, PAGE_H) };
  };

  const drag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const a = toPage(e.clientX, e.clientY);
    (e.target as Element).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const b = toPage(ev.clientX, ev.clientY);
      setBox({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const b = toPage(ev.clientX, ev.clientY);
      if (Math.abs(b.x - a.x) < MIN || Math.abs(b.y - a.y) < MIN) setBox(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const go = (d: number) => { const n = clamp(page + d, 1, PAGES.length); if (n !== page) { setPage(n); setBox(null); } };
  const px = (v: number) => v * scale;

  return (
    <motion.div
      data-add-finding
      role="dialog"
      aria-label="Capture from the original"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-90 flex flex-col bg-scrim p-4 max-[760px]:p-2"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-chrome shadow-float">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-flag-fill text-flag"><Icon.flag size={14} /></span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">Capture from the original</div>
            <div className="text-[11.5px] text-ink-3">Drag a box around what the flag is about.</div>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-paper p-0.5 font-mono text-[11.5px]">
            <button type="button" onClick={() => go(-1)} disabled={page <= 1} aria-label="Previous page" className="grid size-6 place-items-center rounded-full hover:bg-chrome-2 disabled:opacity-40"><Icon.left size={13} /></button>
            <span className="px-1 tabular-nums">p. {page} / {PAGES.length}</span>
            <button type="button" onClick={() => go(1)} disabled={page >= PAGES.length} aria-label="Next page" className="grid size-6 place-items-center rounded-full hover:bg-chrome-2 disabled:opacity-40"><Icon.right size={13} /></button>
          </div>
          <Button onClick={close}>Cancel <Kbd>Esc</Kbd></Button>
          <Button variant="primary" onClick={() => void use()} disabled={!box || busy} className="disabled:opacity-50">
            <Icon.check size={14} />{busy ? 'Capturing…' : 'Use capture'} <Kbd>↵</Kbd>
          </Button>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-desk px-6 py-5">
          <div
            ref={sheet}
            onPointerDown={drag}
            className="relative mx-auto cursor-crosshair touch-none select-none shadow-page"
            style={{ width: px(PAGE_W), height: px(PAGE_H) }}
          >
            <img src={PAGE_IMAGES[page]} alt={`Original page ${page}`} draggable={false} className="pointer-events-none block size-full" />
            {box && (
              <>
                {/* dim everything outside the box */}
                <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
                  <path fillRule="evenodd" style={{ fill: 'rgba(12, 22, 32, 0.45)' }} d={`M0 0H${px(PAGE_W)}V${px(PAGE_H)}H0Z M${px(box.x)} ${px(box.y)}h${px(box.w)}v${px(box.h)}h${-px(box.w)}Z`} />
                </svg>
                <div className="pointer-events-none absolute border-2 border-flag" style={{ left: px(box.x), top: px(box.y), width: px(box.w), height: px(box.h) }}>
                  <span className="absolute -top-6 left-0 rounded bg-flag px-1.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-paper">
                    {Math.round(box.w)} × {Math.round(box.h)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
