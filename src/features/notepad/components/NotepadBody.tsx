import { Button, Icon, Kbd } from '@/components/ui';
import { useFindings } from '@/features/findings';
import { ClaimPanel, useClaimChecks } from '@/features/claim';
import { InterventionsPanel, useInterventions } from '@/features/interventions';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useNotepadStore } from '../store';
import { FindingsList } from './FindingsList';

/** Half view: Findings, Claim and Interventions tabs, and the way into Full notes. */
export function NotepadBody() {
  const findings = useFindings();
  const { lines, dx } = useClaimChecks();
  const { panel, set } = useNotepadStore();
  const interventions = useInterventions();
  const setUi = useUiStore((st) => st.set);
  const pending = findings.filter((f) => f.status === 'ai').length;
  const claimOpen = [...lines, ...dx].filter(({ c }) => c.state !== 'supported').length;

  const tab = (key: typeof panel, label: string, count: number, alert: number) => (
    <button
      role="tab"
      aria-selected={panel === key}
      onClick={() => set({ panel: key })}
      className={cn('relative flex flex-1 items-center justify-center gap-1 py-2 text-[12.5px] font-medium whitespace-nowrap', panel === key ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent' : 'text-ink-3 hover:text-ink')}
    >
      {label}
      <span className="font-mono text-[10.5px] text-ink-3">{count}</span>
      {alert > 0 && <span title={`${alert} open`} aria-label={`${alert} open`} className="rounded-full bg-ai-fill px-1.5 py-px text-[10px] font-semibold text-ai">{alert}</span>}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="flex border-b border-line">
        {tab('findings', 'Findings', findings.length, pending)}
        {tab('claim', 'Claim', lines.length + dx.length, claimOpen)}
        {tab('interventions', 'Interventions', interventions.filter((d) => d.state === 'met').length, interventions.filter((d) => d.state === 'pending' || d.state === 'billedOnly').length)}
      </div>
      {panel === 'findings' && <FindingsList />}
      {panel === 'claim' && <div className="min-h-0 flex-1 overflow-y-auto"><ClaimPanel /></div>}
      {panel === 'interventions' && <div className="min-h-0 flex-1 overflow-y-auto"><InterventionsPanel /></div>}
      <div className="border-t border-line px-2.5 pt-[9px] pb-3">
        <Button className="w-full" onClick={() => setUi({ full: panel, card: null })}>
          <Icon.expand size={14} />Full notes <Kbd>F</Kbd>
        </Button>
      </div>
    </div>
  );
}
