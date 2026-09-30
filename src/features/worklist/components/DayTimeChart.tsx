import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/* Minutes reviewed per day: one series (no legend, the title names it), thin columns with a 4px rounded top,
   square at the baseline, recessive grid. Today's column carries its value; the rest show on hover. */

const H = 170;
const M = { top: 20, right: 6, bottom: 24, left: 50 };
const BAR = 24;

/** A column from the baseline up to y, rounded at the top. */
const column = (x: number, w: number, base: number, y: number) => {
  const h = base - y;
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x} ${base}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${base}Z`;
};

/** Round ticks from 0: steps of 30 minutes, up to four lines. */
function ticks(max: number) {
  const step = [30, 60, 90, 120].find((s) => max / s <= 4) ?? 120;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return { top, values: Array.from({ length: top / step + 1 }, (_, i) => i * step) };
}

const fmt = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim());
/** Axis label: 0, 30m, 1h, 1h 30m, 2h. */
const axis = (v: number) => (!v ? '0' : v < 60 ? `${v}m` : v % 60 ? `${Math.floor(v / 60)}h ${v % 60}m` : `${v / 60}h`);
const day = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });

export function DayTimeChart({ data }: { data: { date: Date; minutes: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { top, values } = ticks(Math.max(...data.map((d) => d.minutes)));
  const band = (width - M.left - M.right) / data.length;
  const w = Math.min(BAR, band * 0.6);
  const y = (v: number) => M.top + (H - M.top - M.bottom) * (1 - v / top);
  const x = (i: number) => M.left + band * i + (band - w) / 2;
  const last = data.length - 1;
  const worked = data.filter((d) => d.minutes > 0);
  const total = data.reduce((n, d) => n + d.minutes, 0);
  const h = hover !== null ? data[hover] : null;

  return (
    <section aria-labelledby="days-title" className="rounded-xl border border-line bg-paper p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
        <h2 id="days-title" className="text-[13.5px] font-semibold">Time spent by day</h2>
        <span className="text-[12px] text-ink-3">last 14 days · {fmt(total)} total · {worked.length ? fmt(Math.round(total / worked.length)) : '0 min'} a working day</span>
      </div>
      <div ref={ref} role="group" aria-label="Minutes spent reviewing per day, last 14 days" className="relative">
        <svg width={width} height={H} className="block overflow-visible">
          {values.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} className={v ? 'stroke-line' : 'stroke-ink-3'} strokeDasharray={v ? '2 3' : undefined} />
              <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[10.5px]">{axis(v)}</text>
            </g>
          ))}
          {data.map((d, i) => (
            <g key={i}>
              <path d={column(x(i), w, y(0), y(d.minutes))} className={cn('fill-series-1 transition-opacity', hover !== null && hover !== i && 'opacity-40')} />
              {i === last && d.minutes > 0 && <text x={x(i) + w / 2} y={y(d.minutes) - 6} textAnchor="middle" className="fill-ink font-mono text-[11px] font-semibold">{fmt(d.minutes)}</text>}
              {i % 2 === last % 2 && (
                <text x={x(i) + w / 2} y={H - 7} textAnchor="middle" className={cn('text-[10.5px]', i === last ? 'fill-ink font-semibold' : 'fill-ink-3')}>{i === last ? 'Today' : day(d.date)}</text>
              )}
              {/* hit target: the whole day's column, larger than the bar */}
              <rect
                x={M.left + band * i} y={M.top} width={band} height={H - M.top - M.bottom} fill="transparent" tabIndex={0}
                aria-label={`${day(d.date)}: ${fmt(d.minutes)}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                className="outline-none"
              />
            </g>
          ))}
        </svg>
        {h && hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-[11.5px] whitespace-nowrap text-paper shadow-float"
            style={{ left: x(hover) + w / 2, top: y(h.minutes) - 8 }}
          >
            <b className="font-semibold">{h.minutes ? fmt(h.minutes) : 'No review time'}</b> · {h.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
      <details className="mt-1 text-[12px] text-ink-2">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">Show as table</summary>
        <table className="mt-1.5 w-full max-w-[360px] border-collapse">
          <thead><tr><th className="border-b border-line py-1 text-left font-semibold">Day</th><th className="border-b border-line py-1 text-left font-semibold">Minutes</th></tr></thead>
          <tbody>{data.map((d, i) => <tr key={i}><td className="border-b border-line py-1">{i === last ? 'Today' : day(d.date)}</td><td className="border-b border-line py-1 font-mono tabular-nums">{d.minutes}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}
