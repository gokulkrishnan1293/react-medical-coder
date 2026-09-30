import { cn } from '@/lib/utils';
import type { InterventionState } from '../derive';

export const STATE: Record<InterventionState, { label: string; className: string }> = {
  met: { label: 'Documented', className: 'text-ok bg-ok-fill' },
  pending: { label: 'Needs review', className: 'text-ai bg-ai-fill' },
  billedOnly: { label: 'Billed, not in record', className: 'text-rej bg-rej-fill' },
  none: { label: 'Not found', className: 'text-ink-3 bg-chrome-2' },
};

export function InterventionBadge({ state, className }: { state: InterventionState; className?: string }) {
  return (
    <span className={cn('rounded-[5px] px-1.5 py-[3px] text-[10.5px] leading-none font-semibold whitespace-nowrap', STATE[state].className, className)}>
      {STATE[state].label}
    </span>
  );
}

export const INTERVENTIONS_NOTE = 'Derived from the services and medications found, not marked on the record. Placeholder criteria.';

/** Only what this case's findings or claim point to; criteria nothing matches stay out of the way until asked for. */
export const relevant = <T extends { state: string }>(all: T[], showAll: boolean) => (showAll ? all : all.filter((d) => d.state !== 'none'));

/** The link under a list that shows or hides the criteria nothing in the case matches. */
export function NotFoundToggle({ hidden, showAll, onToggle }: { hidden: number; showAll: boolean; onToggle: () => void }) {
  if (!hidden) return null;
  return (
    <button type="button" onClick={onToggle} className="px-2.5 py-1.5 text-left text-[11.5px] text-ink-3 hover:text-ink">
      {showAll ? 'Hide criteria not found' : `Show ${hidden} more ${hidden === 1 ? 'criterion' : 'criteria'} not found in this case`}
    </button>
  );
}
