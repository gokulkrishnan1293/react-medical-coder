import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useInterventions } from '../hooks';
import { INTERVENTIONS_NOTE, InterventionBadge, NotFoundToggle, relevant } from './InterventionBadge';
import { InterventionFlow } from './InterventionFlow';

/** Full view: the interventions this case points to, and the path that reaches the one selected. */
export function InterventionsTab({ onJump }: { onJump: (id: string) => void }) {
  const all = useInterventions();
  const pathFor = useUiStore((s) => s.pathFor);
  const set = useUiStore((s) => s.set);
  const [showAll, setShowAll] = useState(false);
  const shown = relevant(all, showAll);
  const sel = shown.find((d) => d.rule.id === pathFor) ?? shown[0];
  const count = (s: string) => all.filter((d) => d.state === s).length;
  const summary = [`${count('met')} documented`, count('pending') && `${count('pending')} to review`, count('billedOnly') && `${count('billedOnly')} billed but not in the record`].filter(Boolean).join(', ');

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-3">
      <p className="max-w-[80ch] text-[12.5px] leading-normal text-ink-2">
        {shown.length || showAll ? `${summary}.` : 'No interventions found in this case.'} {INTERVENTIONS_NOTE} Pick one to see how it was reached; click a finding in the chart to see it in the record.
      </p>
      <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-3 max-[760px]:grid-cols-1">
        <div className="flex min-h-0 flex-col overflow-y-auto">
        <div role="listbox" aria-label="Interventions" className="flex flex-col gap-1">
          {shown.map((d) => (
            <button
              key={d.rule.id}
              role="option"
              aria-selected={d === sel}
              onClick={() => set({ pathFor: d.rule.id })}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left',
                d === sel ? 'border-accent bg-accent-soft' : 'border-line bg-paper hover:border-ink-3',
              )}
            >
              <span className={cn('text-[12.5px] font-medium', d.state === 'none' && 'text-ink-3')}>{d.rule.label}</span>
              <InterventionBadge state={d.state} />
            </button>
          ))}
        </div>
        <NotFoundToggle hidden={all.length - relevant(all, false).length} showAll={showAll} onToggle={() => setShowAll((v) => !v)} />
        </div>
        <div className="min-h-[460px]">
          {sel ? <InterventionFlow d={sel} onJump={onJump} /> : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-line p-6 text-center text-[12.5px] text-ink-3">
              Nothing in this case's services, medications or claim meets an intervention yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
