import { cn } from '@/lib/utils';
import type { ClaimCheck, ClaimState } from '../utils/claimStatus';

const STYLE: Record<ClaimState, string> = {
  supported: 'text-ok bg-ok-fill',
  partial: 'text-add bg-add-fill',
  short: 'text-add bg-add-fill',
  replaced: 'text-add bg-add-fill',
  pending: 'text-ai bg-ai-fill',
  notFound: 'text-rej bg-rej-fill',
};

export function ClaimStateBadge({ c, className }: { c: ClaimCheck; className?: string }) {
  return (
    <span className={cn('rounded-[5px] px-1.5 py-[3px] text-[10.5px] leading-none font-semibold whitespace-nowrap', STYLE[c.state], className)}>
      {c.label}
    </span>
  );
}
