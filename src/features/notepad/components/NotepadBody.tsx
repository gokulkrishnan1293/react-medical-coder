import { Button, Icon, Kbd } from '@/components/ui';
import { ScoreCard, useFindings, useSummary } from '@/features/findings';
import { ClaimPanel, useClaimChecks } from '@/features/claim';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useNotepadStore } from '../store';
import { FindingsList } from './FindingsList';

/** Half view: Findings and Claim tabs, level scorecard, and the way into Full notes. */
export function NotepadBody() {
  const s = useSummary();
  const findings = useFindings();
  const { lines, dx } = useClaimChecks();
  const { panel, set } = useNotepadStore();
  const setUi = useUiStore((st) => st.set);
  const pending = findings.filter((f) => f.status === 'ai').length;
  const claimOpen = [...lines, ...dx].filter(({ c }) => c.state !== 'supported').length;

  const tab = (key: 'findings' | 'claim', label: string, count: number, alert: number) => (
    <button
      role="tab"
      aria-selected={panel === key}
      onClick={() => set({ panel: key })}
      className={cn('relative flex flex-1 items-center justify-center gap-1.5 py-2 text-[12.5px] font-medium', panel === key ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent' : 'text-ink-3 hover:text-ink')}
    >
      {label}
      <span className="font-mono text-[10.5px] text-ink-3">{count}</span>
      {alert > 0 && <span className="rounded-full bg-ai-fill px-1.5 py-px text-[10px] font-semibold text-ai">{alert} open</span>}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="flex border-b border-line">
        {tab('findings', 'Findings', findings.length, pending)}
        {tab('claim', 'Claim', lines.length + dx.length, claimOpen)}
      </div>
      {panel === 'findings' ? (
        <FindingsList />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto"><ClaimPanel /></div>
      )}
      <div className="flex flex-col gap-2 border-t border-line px-2.5 pt-[9px] pb-3">
        <ScoreCard s={s} compact />
        <Button className="w-full" onClick={() => setUi({ full: panel === 'claim' ? 'claim' : 'findings', card: null })}>
          <Icon.expand size={14} />Full notes <Kbd>F</Kbd>
        </Button>
      </div>
    </div>
  );
}
