import { useState } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { jumpTo } from '@/features/record-viewer';
import { useInterventions } from '../hooks';
import { INTERVENTIONS_NOTE, InterventionBadge, NotFoundToggle, relevant } from './InterventionBadge';

const pages = (ids: { page: number }[]) => [...new Set(ids.map((f) => f.page))].map((p) => `p. ${p}`).join(', ');

/** Notepad half view: the interventions this case points to, their status, and a way into each path. */
export function InterventionsPanel() {
  const all = useInterventions();
  const set = useUiStore((s) => s.set);
  const [showAll, setShowAll] = useState(false);
  const shown = relevant(all, showAll);
  return (
    <div className="flex flex-col gap-1 px-1.5 pt-2 pb-2">
      <p className="px-1.5 pb-1 text-[11px] leading-snug text-ink-3">{INTERVENTIONS_NOTE}</p>
      {!shown.length && <p className="px-2.5 py-2 text-[12px] text-ink-2">No interventions found in this case's services or medications.</p>}
      {shown.map((d) => (
        <div key={d.rule.id} className="group flex items-center gap-1 rounded-lg hover:bg-chrome-2">
          <button
            disabled={!d.evidence.length}
            onClick={() => d.evidence[0] && jumpTo(d.evidence[0].id)}
            title={d.evidence.length ? 'Show in the record' : undefined}
            className={cn('flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2.5 text-left', !d.evidence.length && 'cursor-default')}
          >
            <span className={cn('min-w-0 flex-1 truncate text-[12px]', d.state === 'none' ? 'text-ink-3' : 'text-ink')}>{d.rule.label}</span>
            {d.evidence.length > 0 && <span className="font-mono text-[10.5px] text-ink-3">{pages(d.evidence)}</span>}
            <InterventionBadge state={d.state} />
          </button>
          <button
            onClick={() => set({ full: 'interventions', pathFor: d.rule.id, card: null })}
            aria-label={`How ${d.rule.label} was derived`}
            title="How it was derived"
            className="mr-1 grid size-6 place-items-center rounded-md text-ink-3 hover:bg-line hover:text-ink"
          >
            <Icon.flow size={14} />
          </button>
        </div>
      ))}
      <NotFoundToggle hidden={all.length - relevant(all, false).length} showAll={showAll} onToggle={() => setShowAll((v) => !v)} />
    </div>
  );
}
