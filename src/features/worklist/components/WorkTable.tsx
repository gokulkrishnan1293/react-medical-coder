import { useNavigate } from 'react-router';
import type { WorkItem } from '@/types';
import { ME, reviewerById } from '@/data';
import { Avatar, Icon } from '@/components/ui';
import { Table, Td, Th } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { lockedFor } from '../filter';
import { ago } from './bits';
import { ClaireCounts } from './ClaireCards';

const STATUS: Record<WorkItem['status'], { label: string; className: string }> = {
  new: { label: 'To do', className: 'bg-chrome-2 text-ink-2' },
  inProgress: { label: 'In progress', className: 'bg-ai-fill text-ai' },
  completed: { label: 'Completed', className: 'bg-ok-fill text-ok' },
};

/** Status, or who has the case open when it is locked. */
function StatusCell({ w }: { w: WorkItem }) {
  const locked = lockedFor(w, ME.id);
  const by = reviewerById(w.openBy?.reviewer);
  if (locked && by) {
    return (
      <span className="flex items-center gap-2">
        <Avatar r={by} size={22} />
        <span className="leading-tight">
          <span className="flex items-center gap-1 text-[12px] font-semibold text-ink"><Icon.lock size={11} />Locked</span>
          <span className="block text-[11px] text-ink-3">{by.name.split(' ')[0]} is reviewing · {ago(w.openBy!.since)}</span>
        </span>
      </span>
    );
  }
  const s = STATUS[w.status];
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={cn('rounded-full px-2 py-[3px] text-[11px] leading-none font-semibold whitespace-nowrap', s.className)}>{s.label}</span>
    </span>
  );
}

/**
 * The worklist. A row opens its case; a case another reviewer has open is locked and cannot be opened.
 * Cases whose data is not loaded in this prototype open a notice instead of the workbench.
 */
export function WorkTable({ items }: { items: WorkItem[] }) {
  const navigate = useNavigate();
  const open = (w: WorkItem) => { if (!lockedFor(w, ME.id)) navigate(`/cases/${w.id}`); };

  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[13px] text-ink-2">No cases match. Clear the search or pick another view.</div>;
  }
  return (
    <Table>
      <thead>
        <tr>
          <Th>Case</Th><Th>Patient</Th><Th>Document no.</Th><Th>Claim no.</Th><Th>Billed → paid</Th>
          <Th>Status</Th><Th>CLAIRE's suggestions</Th><Th aria-label="Open" />
        </tr>
      </thead>
      <tbody>
        {items.map((w) => {
          const locked = lockedFor(w, ME.id);
          return (
            <tr
              key={w.id}
              onClick={() => open(w)}
              aria-disabled={locked || undefined}
              className={cn(locked ? 'cursor-not-allowed [&>td]:bg-chrome/60' : 'cursor-pointer hover:[&>td]:bg-chrome')}
            >
              <Td>
                <span className="block font-mono text-[12.5px] font-semibold whitespace-nowrap">{w.id}</span>
                <span className="block text-[11px] text-ink-3">{w.stage}</span>
              </Td>
              <Td className="font-medium whitespace-nowrap">{w.patient}</Td>
              <Td className="font-mono text-[12px] whitespace-nowrap text-ink-2">{w.documentId}</Td>
              <Td className="font-mono text-[12px] whitespace-nowrap text-ink-2">{w.claimId}</Td>
              <Td className="font-mono text-[12.5px] whitespace-nowrap">
                <s className="text-rej decoration-[1.5px]">{w.billed}</s> <span className="text-ink-3">→</span> {w.paid}
              </Td>
              <Td><StatusCell w={w} /></Td>
              <Td><ClaireCounts t={w.claire} /></Td>
              <Td className="text-right">
                {locked ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-ink-3" title="Another reviewer has this case open"><Icon.lock size={13} />Locked</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); open(w); }}
                    className="inline-flex items-center gap-1 rounded-[7px] border border-line bg-paper px-2.5 py-1 text-[12px] font-medium whitespace-nowrap hover:border-ink-3"
                  >
                    {w.status === 'completed' ? 'View' : w.status === 'inProgress' && w.assignee === ME.id ? 'Continue' : 'Open'}
                    <Icon.right size={12} />
                  </button>
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
