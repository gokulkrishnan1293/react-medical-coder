import { useEffect, useRef } from 'react';
import type { Finding } from '@/types';
import { PAGES } from '@/data';
import { cn, scrollBehavior } from '@/lib/utils';
import { Icon, SegmentedTabs } from '@/components/ui';
import { useOrderedFindings } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useUiStore } from '@/stores/uiStore';
import { useNotepadStore } from '../store';
import { FindingCard } from './FindingCard';

const pageLabel = (n: number) => PAGES.find((p) => p.n === n)?.label ?? '';

function pageRange(ps: number[]) {
  if (!ps.length) return '';
  const a = Math.min(...ps);
  const b = Math.max(...ps);
  return a === b ? `p. ${a}` : `p. ${a}–${b}`;
}

/** Finding cards grouped by page; follows the scroll ("In view") or lists everything. */
export function FindingsList() {
  const ordered = useOrderedFindings();
  const { scope, pinnedPages, set } = useNotepadStore();
  const visible = useUiStore((st) => st.visiblePages);
  const activeId = useUiStore((st) => st.activeId);
  const hoverId = useUiStore((st) => st.hoverId);
  const flashId = useUiStore((st) => st.flashId);
  const setUi = useUiStore((st) => st.set);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = pinnedPages ?? visible;
  const inView = ordered.filter((f) => pages.includes(f.page));
  const list = scope === 'view' ? inView : ordered;
  const groups: { page: number; items: Finding[] }[] = [];
  list.forEach((f) => {
    let g = groups[groups.length - 1];
    if (!g || g.page !== f.page) groups.push((g = { page: f.page, items: [] }));
    g.items.push(f);
  });
  const pending = ordered.filter((f) => f.status === 'ai').length;

  useEffect(() => {
    if (!activeId) return;
    listRef.current?.querySelector(`[data-row="${activeId}"]`)?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
  }, [activeId, scope]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-1.5">
        <SegmentedTabs
          tabs={[{ key: 'view', label: 'In view', count: inView.length }, { key: 'all', label: 'All', count: ordered.length }]}
          value={scope}
          onChange={(k) => set({ scope: k })}
        />
        {scope === 'view' ? (
          <button
            onClick={() => set({ pinnedPages: pinnedPages ? null : [...visible] })}
            title={pinnedPages ? 'Unpin to follow the scroll again' : 'Pin these pages'}
            className={cn('ml-auto inline-flex items-center gap-[5px] rounded-[5px] px-1.5 py-[3px] text-[11.5px] tabular-nums', pinnedPages ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-chrome-2 hover:text-ink')}
          >
            <Icon.pin size={13} />
            {pinnedPages ? `Pinned ${pageRange(pinnedPages)}` : `Following ${pageRange(visible)}`}
          </button>
        ) : (
          <span className="ml-auto px-1.5 text-[11.5px] text-ink-3">{pending} to review</span>
        )}
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 && (
          <div className="px-3.5 py-5 text-[12.5px] leading-[1.55] text-ink-2">
            <b className="mb-1 block text-ink">Nothing marked on {pageRange(pages)}.</b>
            Select words on the record to add a diagnosis, service, MAR entry or note.
          </div>
        )}
        {groups.map((g) => (
          <section key={g.page}>
            <h3 className="sticky top-0 z-1 flex items-baseline gap-1.5 bg-chrome px-1 pt-2.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
              Page {g.page} · {pageLabel(g.page)}
              <span className="ml-auto font-mono tracking-normal normal-case">{g.items.length}</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {g.items.map((f) => (
                <FindingCard
                  key={f.id}
                  f={f}
                  active={activeId === f.id}
                  hot={hoverId === f.id}
                  flash={flashId === f.id}
                  onEnter={() => setUi({ hoverId: f.id })}
                  onLeave={() => setUi({ hoverId: null })}
                  onClick={() => jumpTo(f.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
