import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ME } from '@/data';
import { Avatar, Icon, Kbd, ThemeToggle } from '@/components/ui';
import { Tour, startTour, startTourIfNew, useTourStore } from '@/features/tour';
import { cn } from '@/lib/utils';
import { sumTally, useMinutesByDay, useWorklist } from '../hooks';
import { countByView, filterCases, type WorkView } from '../filter';
import { WorkTable } from './WorkTable';
import { TodayPanel } from './TodayPanel';
import { ClaireCards } from './ClaireCards';
import { TimeChart } from './TimeChart';
import { DayTimeChart } from './DayTimeChart';

const VIEWS: { key: WorkView; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'To do' },
  { key: 'inProgress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'locked', label: 'Locked' },
];

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

/**
 * Home, the one screen before a case: what happened to CLAIRE's suggestions, the worklist with search and
 * views, and today's work beside it. Search and view live in the address (?q=…&view=…), so a refresh or
 * the back button keeps them. Press / to search.
 */
export function HomePage() {
  const [params, setParams] = useSearchParams();
  // the box has its own state so typing never waits on the address; the address follows it
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const view = (params.get('view') as WorkView) || 'all';
  const items = useWorklist();
  const rows = filterCases(items, { q, view, me: ME.id });
  const counts = countByView(items, ME.id);
  const byDay = useMinutesByDay(items);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => startTourIfNew('home'), []);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      if (e.key === '/') { e.preventDefault(); search.current?.focus(); }
      if (e.key === '?' && useTourStore.getState().index === null) startTour('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-desk">
      <main className="mx-auto grid max-w-[1320px] gap-5 px-5 py-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px] max-[760px]:px-4">
        <section aria-labelledby="worklist-title" className="min-w-0">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-bold tracking-tight">
            <span aria-hidden className="grid size-6 place-items-center rounded-md bg-accent font-mono text-[12px] text-accent-ink">C</span>
            CLAIRE
            <span data-tour="home-tools-narrow" className="ml-auto flex items-center gap-1 font-normal text-ink-2 min-[1100px]:hidden"><ThemeToggle /><TourButton /><Avatar r={ME} size={26} /><span className="ml-1">{ME.name}</span></span>
          </div>
          <h1 id="worklist-title" className="text-[22px] font-bold tracking-tight">{greeting()}, {ME.name.split(' ')[0]}</h1>
          <p data-tour="home-summary" className="mt-0.5 w-fit text-[13px] text-ink-2">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
            <span className="font-semibold text-ok">{counts.completed} completed</span> · <span className="font-semibold text-ai">{counts.inProgress} in progress</span> · {counts.new} to do
          </p>

          <ClaireCards t={sumTally(items)} cases={items.length} />

          <div className="mt-5"><DayTimeChart data={byDay} /></div>

          <h2 className="mt-6 text-[13.5px] font-semibold">Your cases</h2>
          <div data-tour="home-find">
          <label className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 shadow-page focus-within:border-accent">
            <Icon.search size={16} className="text-ink-3" />
            <input
              ref={search}
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); update({ q: e.target.value }); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setQ(''); update({ q: '' }); e.currentTarget.blur(); } }}
              placeholder="Search case, patient, document or claim number"
              aria-label="Search the worklist"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none"
            />
            <Kbd>/</Kbd>
          </label>

          <div role="tablist" aria-label="Worklist views" className="mt-3 mb-3 flex flex-wrap gap-1.5">
            {VIEWS.filter((v) => v.key !== 'locked' || counts.locked > 0).map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key}
                onClick={() => update({ view: v.key })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[12.5px]',
                  view === v.key ? 'border-ink bg-paper font-semibold' : 'border-line bg-paper text-ink-2 hover:border-ink-3',
                )}
              >
                {v.key === 'locked' && <Icon.lock size={11} />}
                {v.label} <span className="font-mono text-[11px] text-ink-3">{counts[v.key]}</span>
              </button>
            ))}
          </div>
          </div>

          <div data-tour="home-table"><WorkTable items={rows} /></div>
        </section>
        <div className="flex flex-col gap-4">
          <span data-tour="home-tools" className="flex items-center justify-end gap-1 self-end text-[13px] text-ink-2 max-[1099px]:hidden"><ThemeToggle withLabel /><TourButton withLabel /><Avatar r={ME} size={28} className="ml-1" /><span className="ml-1">{ME.name}</span></span>
          <TodayPanel items={items} />
          <TimeChart items={items} />
        </div>
      </main>
      <Tour />
    </div>
  );
}

/** Starts the home screen's walkthrough (also ? on this screen). */
function TourButton({ withLabel }: { withLabel?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => startTour('home')}
      title="Take the tour of this screen (?)"
      aria-label="Take the tour of this screen"
      className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] px-2 text-[12.5px] text-ink-2 hover:bg-chrome-2 hover:text-ink"
    >
      <Icon.help size={15} />{withLabel && <span>Tour</span>}
    </button>
  );
}
