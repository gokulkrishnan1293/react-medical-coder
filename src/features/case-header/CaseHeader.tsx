import { CASE } from '@/data';
import { cn } from '@/lib/utils';
import { Icon, Kbd, ThemeToggle } from '@/components/ui';
import { useFindings } from '@/features/findings';
import { useNotepadStore } from '@/features/notepad';
import { useUiStore } from '@/stores/uiStore';
import { modLabel } from '@/lib/platform';
import { startTour } from '@/features/tour';
import { useAssistantStore } from '@/features/assistant';
import { Link } from 'react-router';

function Toggle({ pressed, onClick, title, children, className, tour }: { pressed?: boolean; onClick: () => void; title: string; children: React.ReactNode; className?: string; tour?: string }) {
  return (
    <button
      data-tour={tour}
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex h-[30px] items-center gap-1.5 rounded-[7px] border px-2.5 text-[12.5px]',
        pressed ? 'border-accent/30 bg-accent-soft text-accent' : 'border-transparent text-ink-2 hover:bg-chrome-2 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

const label = 'max-[1100px]:hidden';

/** Case identity, the downcode under review, and view controls. */
export function CaseHeader() {
  const count = useFindings().length;
  const view = useUiStore((s) => s.view);
  const { toggleSpot, toggleClean, set } = useUiStore.getState();
  const npMode = useNotepadStore((s) => s.mode);
  const toggleNp = useNotepadStore((s) => s.toggle);
  const asking = useAssistantStore((s) => s.open);

  return (
    <header className="flex flex-wrap items-center gap-x-[22px] gap-y-2.5 border-b border-line bg-chrome px-4 py-2.5 max-[760px]:gap-x-3 max-[760px]:gap-y-2 max-[760px]:py-2">
      <div data-tour="case" className="flex flex-wrap items-center gap-x-[22px] gap-y-2.5 max-[760px]:gap-x-3">
      <Link to="/" title="Back to the worklist" aria-label="Back to the worklist" className="-mr-2 grid size-[30px] place-items-center rounded-[7px] text-ink-2 hover:bg-chrome-2 hover:text-ink">
        <Icon.left size={16} />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="rounded bg-accent-soft px-1.5 py-1 font-mono text-[11px] leading-none font-semibold tracking-[0.03em] text-accent">{CASE.id}</span>
          <span className="text-[15px] font-bold tracking-tight">{CASE.stage}</span>
          <span className="text-xs text-ink-3">received {CASE.received}</span>
        </div>
      </div>
      <div className="grid grid-cols-[auto_auto_auto] items-baseline gap-x-2 gap-y-0.5 max-[760px]:hidden">
        <s className="font-mono text-sm font-semibold text-rej decoration-[1.5px]">{CASE.billed}</s>
        <span className="text-sm text-ink-3" aria-hidden="true">→</span>
        <span className="font-mono text-sm font-semibold">{CASE.paid}</span>
        <span className="text-center text-[8.5px] leading-none tracking-[0.08em] text-ink-3 uppercase">Billed</span>
        <span />
        <span className="text-center text-[8.5px] leading-none tracking-[0.08em] text-ink-3 uppercase">Paid</span>
      </div>
      </div>
      <div data-tour="lenses" className="ml-auto flex flex-wrap gap-1 max-[760px]:ml-0 max-[760px]:w-full max-[760px]:justify-between">
        <Toggle pressed={view.spot} onClick={toggleSpot} title="Spotlight (S): dim everything except marked evidence"><Icon.spot size={15} /><span className={label}>Spotlight</span></Toggle>
        <Toggle pressed={view.clean} onClick={toggleClean} title="Clean read (C): hide all marks"><Icon.eye size={15} /><span className={label}>Clean read</span></Toggle>
        <Toggle pressed={npMode === 'float' || npMode === 'dock'} onClick={toggleNp} title="Notepad (N)">
          <Icon.notes size={15} /><span className={label}>Notepad</span>
          <span className="rounded-full bg-ink px-1.5 py-[3px] font-mono text-[10.5px] leading-none font-semibold text-paper">{count}</span>
        </Toggle>
        <Toggle pressed={asking} onClick={useAssistantStore.getState().toggle} title="Ask CLAIRE about this case or the screen (Q)" tour="ask"><Icon.spark size={15} /><span className={label}>Ask</span></Toggle>
        <ThemeToggle />
        <Toggle onClick={() => startTour('case')} title="Take the tour (?)"><Icon.help size={15} /><span className={label}>Tour</span></Toggle>
        <Toggle onClick={() => set({ palette: true })} title="Command palette" className="border-line"><Icon.search size={15} /><Kbd>{modLabel('K')}</Kbd></Toggle>
      </div>
    </header>
  );
}
