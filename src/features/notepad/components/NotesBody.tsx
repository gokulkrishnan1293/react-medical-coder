import { useEffect, useRef } from 'react';
import { pageLabel } from '../pageLabel';
import { SegmentedTabs, Icon, Kbd, Button } from '@/components/ui';
import { ScoreCard, useOrderedFindings, useSummary } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { cn, scrollBehavior } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { Finding } from '@/types';
import { useNotepadStore } from '../store';
import { NoteRow } from './NoteRow';

function pageRange(ps: number[]) {
  if (!ps.length) return '';
  const a = Math.min(...ps);
  const b = Math.max(...ps);
  return a === b ? `p. ${a}` : `p. ${a}–${b}`;
}

/** Notepad content: In view / All lists grouped by page, plus the MDM scorecard. */
export function NotesBody() {
  const ordered = useOrderedFindings();
  const s = useSummary();
  const { tab, pinnedPages, set } = useNotepadStore();
  const visible = useUiStore((st) => st.visiblePages);
  const activeId = useUiStore((st) => st.activeId);
  const hoverId = useUiStore((st) => st.hoverId);
  const flashId = useUiStore((st) => st.flashId);
  const setUi = useUiStore((st) => st.set);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = pinnedPages ?? visible;
  const inView = ordered.filter((f) => pages.includes(f.page));
  const list = tab === 'view' ? inView : ordered;
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
  }, [activeId, tab]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-[7px]">
        <SegmentedTabs
          tabs={[{ key: 'view', label: 'In view', count: inView.length }, { key: 'all', label: 'All', count: ordered.length }]}
          value={tab}
          onChange={(k) => set({ tab: k })}
        />
        {tab === 'view' ? (
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
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-1.5 pt-1 pb-2">
        {groups.length === 0 && (
          <div className="px-3.5 py-5 text-[12.5px] leading-[1.55] text-ink-2">
            <b className="mb-1 block text-ink">Nothing marked on {pageRange(pages)}.</b>
            Select words on the record to add a diagnosis, procedure, MDM element or note.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.page}>
            <div className="sticky top-0 z-1 bg-chrome px-1.5 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
              Page {g.page} · {pageLabel(g.page)}
            </div>
            {g.items.map((f) => (
              <NoteRow
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
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-line px-2.5 pt-[9px] pb-3">
        <ScoreCard s={s} compact />
        <Button className="w-full" onClick={() => setUi({ full: 'findings', card: null })}>
          <Icon.expand size={14} />Full notes <Kbd>F</Kbd>
        </Button>
      </div>
    </div>
  );
}
