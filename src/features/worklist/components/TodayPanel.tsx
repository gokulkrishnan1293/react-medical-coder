import { Link } from 'react-router';
import type { WorkItem } from '@/types';
import { ME, reviewerById } from '@/data';
import { Avatar, Icon } from '@/components/ui';
import { completedToday, lockedFor } from '../filter';
import { ago, clock } from './bits';

const card = 'rounded-xl border border-line bg-paper p-4';
const heading = 'text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase';

/** What I finished today, what I left open, and who is in which case right now. */
export function TodayPanel({ items }: { items: WorkItem[] }) {
  const done = items.filter((w) => completedToday(w, ME.id)).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const minutes = done.map((w) => w.minutes).filter((m): m is number => m !== undefined);
  const avg = minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : null;
  const open = items.filter((w) => w.assignee === ME.id && w.status === 'inProgress');
  const others = items.filter((w) => lockedFor(w, ME.id));

  return (
    <aside aria-label="Today" className="flex flex-col gap-4">
      <section className={card}>
        <h2 className={heading}>Completed today</h2>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[34px] leading-none font-bold tracking-tight tabular-nums">{done.length}</span>
          <span className="text-[12.5px] text-ink-2">{done.length === 1 ? 'case' : 'cases'} by you</span>
        </div>
        {done.length > 0 && (
          <p className="mt-1 text-[12px] text-ink-3">
            {avg !== null && `${avg} min average`}
          </p>
        )}
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {done.map((w) => (
            <li key={w.id}>
              <Link to={`/cases/${w.id}`} className="flex items-center gap-2 py-2 hover:text-accent">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[12px] font-semibold">{w.id}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">{w.patient} · {clock(w.completedAt!)}</span>
                </span>
              </Link>
            </li>
          ))}
          {!done.length && <li className="py-2 text-[12.5px] text-ink-3">Nothing yet. Your first completed review shows up here.</li>}
        </ul>
      </section>

      {open.length > 0 && (
        <section className={card}>
          <h2 className={heading}>Pick up where you left off</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {open.map((w) => (
              <li key={w.id}>
                <Link to={`/cases/${w.id}`} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 hover:border-accent hover:bg-accent-soft">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] font-semibold">{w.id}</span>
                    <span className="block truncate text-[11.5px] text-ink-3">{w.patient} · {w.billed} → {w.paid}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-accent">Continue<Icon.right size={12} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        <section className={card}>
          <h2 className={heading}>Being reviewed now</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {others.map((w) => {
              const r = reviewerById(w.openBy!.reviewer)!;
              return (
                <li key={w.id} className="flex items-center gap-2 text-[12px]">
                  <Avatar r={r} size={24} />
                  <span className="min-w-0 flex-1">
                    <span className="block"><span className="font-medium">{r.name}</span> <span className="text-ink-3">· {ago(w.openBy!.since)}</span></span>
                    <span className="block font-mono text-[11.5px] text-ink-3">{w.id}</span>
                  </span>
                  <Icon.lock size={13} className="text-ink-3" />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
