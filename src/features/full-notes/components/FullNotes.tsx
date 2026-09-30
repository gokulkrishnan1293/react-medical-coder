import { CASE } from '@/data';
import { Icon, IconButton, Modal, SegmentedTabs } from '@/components/ui';
import { jumpTo } from '@/features/record-viewer';
import { useUiStore, type FullNotesTab } from '@/stores/uiStore';
import { FindingsTab } from './FindingsTab';
import { ClaimTables } from '@/features/claim';
import { InterventionsTab } from '@/features/interventions';

const TABS: { key: FullNotesTab; label: string }[] = [
  { key: 'findings', label: 'Findings' },
  { key: 'claim', label: 'Claim' },
  { key: 'interventions', label: 'Interventions' },
];

/** Full view of the review: every finding, the claim against the record, and the interventions derived from both. */
export function FullNotes({ tab }: { tab: FullNotesTab }) {
  const set = useUiStore((st) => st.set);
  const close = () => set({ full: null });
  const onJump = (id: string) => { close(); setTimeout(() => jumpTo(id), 60); };
  return (
    <Modal onClose={close} label="Full notes" className="flex h-[min(88vh,900px)] w-[min(1120px,100%)] flex-col overflow-hidden rounded-[14px] bg-chrome shadow-float">
      <div className="flex flex-wrap items-center gap-4 border-b border-line py-3.5 pr-4 pl-[22px] max-[760px]:px-4 max-[760px]:py-3">
        <div>
          <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-3 uppercase">{CASE.id} · {CASE.stage}</div>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight">Full notes</h2>
        </div>
        <SegmentedTabs tabs={TABS} value={tab} onChange={(k) => set({ full: k })} size="lg" className="ml-auto" />
        <IconButton onClick={close} aria-label="Close full notes"><Icon.close size={18} /></IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-4 pb-7 max-[760px]:px-4">
        {tab === 'findings' && <FindingsTab onJump={onJump} />}
        {tab === 'claim' && <ClaimTables onJump={onJump} />}
        {tab === 'interventions' && <InterventionsTab onJump={onJump} />}
      </div>
    </Modal>
  );
}
