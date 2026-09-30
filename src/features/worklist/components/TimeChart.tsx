import type { WorkItem } from '@/types';
import { HoverTip } from '@/components/ui';

const STATUS = { new: 'To do', inProgress: 'In progress', completed: 'Completed' } as const;
const fmt = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);

/**
 * Time spent per case, as horizontal bars: one series, so no legend; each bar carries its value, since there
 * are only a few. The case being reviewed counts up live.
 */
export function TimeChart({ items }: { items: WorkItem[] }) {
  const rows = items.map((w) => ({ w, m: w.minutes ?? 0 })).sort((a, b) => b.m - a.m);
  const max = Math.max(1, ...rows.map((r) => r.m));
  const total = rows.reduce((n, r) => n + r.m, 0);
  return (
    <section aria-labelledby="time-title" className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-baseline gap-2">
        <h2 id="time-title" className="text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Time spent</h2>
        <span className="ml-auto font-mono text-[12px] text-ink-2 tabular-nums">{fmt(total)} total</span>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map(({ w, m }) => (
          <li key={w.id}>
            <HoverTip
              className="block"
              tip={<><span className="block font-semibold">{w.id} · {fmt(m)}</span><span className="block opacity-85">{w.patient} · {STATUS[w.status]}</span></>}
            >
              <span tabIndex={0} className="grid grid-cols-[92px_minmax(0,1fr)_52px] items-center gap-2 rounded outline-offset-2">
                <span className="font-mono text-[11.5px] text-ink-2">{w.id}</span>
                <span className="h-3 rounded-r bg-chrome-2">
                  {m > 0 && <span className="block h-full rounded-r bg-series-1" style={{ width: `${(m / max) * 100}%` }} />}
                </span>
                <span className="text-right font-mono text-[11.5px] font-semibold tabular-nums">{m ? `${m} min` : '—'}</span>
              </span>
            </HoverTip>
          </li>
        ))}
      </ul>
    </section>
  );
}
