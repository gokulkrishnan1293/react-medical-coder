import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Button, Icon, Kbd } from '@/components/ui';
import { clamp, cn } from '@/lib/utils';
import { useTourStore } from './store';
import type { TourStep } from './steps';

interface Box { x: number; y: number; w: number; h: number }

/** Room between a lit element and its outline. */
const PAD = 6;
const GAP = 14;
const EDGE = 12;
const CARD_W = 340;

function measure(selectors: string[]): Box[] {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return selectors.flatMap((s) => {
    let el: Element | null = null;
    try { el = document.querySelector(s); } catch { return []; }
    const r = el?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return [];
    // keep the outline on screen for elements taller or wider than the window
    const x = Math.max(r.left - PAD, 2);
    const y = Math.max(r.top - PAD, 2);
    const w = Math.min(r.right + PAD, W - 2) - x;
    const h = Math.min(r.bottom + PAD, H - 2) - y;
    return w > 0 && h > 0 ? [{ x, y, w, h }] : [];
  });
}

/** Follow the step's elements every frame: they move with scrolling, animation and layout changes. */
function useBoxes(step: TourStep) {
  const selectors = useMemo(() => step.targets?.() ?? [], [step]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  useEffect(() => {
    let raf = 0;
    let last = '';
    const tick = () => {
      const b = measure(selectors);
      const key = b.map((r) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`).join('|');
      if (key !== last) { last = key; setBoxes(b); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [selectors]);
  return boxes;
}

/** Beside the anchor if there is room, else below or above it, else in a corner at the far end of the screen from it. */
function place(a: Box | undefined, w: number, h: number, below: boolean) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (!a) return { left: (W - w) / 2, top: Math.max(EDGE, (H - h) / 2) };
  const vy = clamp(a.y, EDGE, H - h - EDGE);
  const vx = clamp(a.x, EDGE, W - w - EDGE);
  const tries = [
    a.x + a.w + GAP + w <= W - EDGE && { left: a.x + a.w + GAP, top: vy },
    a.x - GAP - w >= EDGE && { left: a.x - GAP - w, top: vy },
    a.y + a.h + GAP + h <= H - EDGE && { left: vx, top: a.y + a.h + GAP },
    a.y - GAP - h >= EDGE && { left: vx, top: a.y - GAP - h },
  ];
  if (below) tries.unshift(tries[2]);
  const low = a.y + a.h / 2 > H / 2;
  return tries.find(Boolean) || { left: W - w - EDGE, top: low ? EDGE : H - h - EDGE };
}

const rounded = ({ x, y, w, h }: Box, r = 8) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const block = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); };

/**
 * Guided tour over the live screen: dims everything but the step's elements, which stay usable,
 * and explains them in a card beside them. → or Enter next, ← back, Esc to leave.
 */
export function Tour() {
  const { steps, index, next, prev, stop } = useTourStore();
  if (index === null) return null;
  return <TourStepView key={index} step={steps[index]} i={index} n={steps.length} next={next} prev={prev} stop={stop} />;
}

function TourStepView({ step, i, n, next, prev, stop }: { step: TourStep; i: number; n: number; next: () => void; prev: () => void; stop: () => void }) {
  const boxes = useBoxes(step);
  const card = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: CARD_W, h: 240 });
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const last = i === n - 1;

  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    card.current?.focus({ preventScroll: true });
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    // capture, so the tour's keys win over the app's shortcuts; typing in a field is left alone
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === 'Escape') stop();
      else if (e.key === 'Enter' || (e.key === 'ArrowRight' && !step.appArrows)) next();
      else if (e.key === 'ArrowLeft' && !step.appArrows) prev();
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
    };
  }, [step, next, prev, stop]);

  const pos = place(boxes[0], size.w, size.h, step.placement === 'below');
  const frame = `M0 0H${vp.w}V${vp.h}H0Z`;

  return (
    <div className="pointer-events-none fixed inset-0 z-100">
      <svg className="absolute inset-0" width={vp.w} height={vp.h} aria-hidden="true">
        <defs>
          <mask id="tour-holes">
            <rect width="100%" height="100%" fill="white" />
            {boxes.map((b, k) => <path key={k} d={rounded(b)} fill="black" />)}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#tour-holes)" pointerEvents="none" style={{ fill: 'var(--scrim)' }} />
        {/* catches clicks outside the lit elements; clicks inside pass through to them */}
        <path
          d={frame + boxes.map((b) => rounded(b)).join('')}
          fillRule="evenodd"
          fill="transparent"
          pointerEvents="fill"
          onMouseDown={block}
          onClick={block}
        />
        {boxes.map((b, k) => (
          <path key={k} d={rounded(b)} fill="none" pointerEvents="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
        ))}
      </svg>

      <motion.div
        ref={card}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="pointer-events-auto absolute flex w-[min(340px,calc(100vw-24px))] flex-col rounded-xl border border-line bg-paper p-4 shadow-float outline-none"
        style={pos}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold tracking-[0.08em] text-accent uppercase">{step.section}</span>
          <span className="font-mono text-[11px] text-ink-3 tabular-nums">{i + 1} / {n}</span>
          <button type="button" onClick={stop} aria-label="Leave the tour" title="Leave the tour (Esc)" className="ml-auto grid size-6 place-items-center rounded-md text-ink-2 hover:bg-chrome-2 hover:text-ink">
            <Icon.close size={14} />
          </button>
        </div>
        <h2 id="tour-title" className="mt-1 text-[15px] font-bold tracking-tight text-balance">{step.title}</h2>
        <div id="tour-body" className="mt-1.5 text-[13px] leading-normal text-ink-2">{step.body}</div>
        {step.keys && (
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5 text-xs">
            {step.keys.map(([ks, what]) => (
              <Fragment key={what}>
                <dt className="flex gap-1 text-ink">{ks.map((k) => <Kbd key={k}>{k}</Kbd>)}</dt>
                <dd className="text-ink-2">{what}</dd>
              </Fragment>
            ))}
          </dl>
        )}
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-chrome-2" aria-hidden="true">
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((i + 1) / n) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {i === 0
            ? <button type="button" onClick={stop} className="mr-auto text-[12.5px] text-ink-3 hover:text-ink">Skip tour</button>
            : <span className="mr-auto hidden text-[11px] text-ink-3 sm:inline">{step.appArrows ? 'Enter' : '← →'} to move · Esc to leave</span>}
          {i > 0 && <Button onClick={prev}><Icon.left size={14} />Back</Button>}
          <Button variant="primary" onClick={next} className={cn(i === 0 && 'px-3.5')}>
            {i === 0 ? 'Start the tour' : last ? 'Finish' : 'Next'}
            {!last && <Icon.right size={14} />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
