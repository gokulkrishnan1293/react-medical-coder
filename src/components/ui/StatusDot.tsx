import type { FindingStatus } from '@/types';
import { cn } from '@/lib/utils';

/** Filled dot for decided findings, ring for AI suggestions. */
export function StatusDot({ status, className }: { status: FindingStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'st-' + status,
        'inline-block size-2 flex-none rounded-full',
        status === 'ai' ? 'shadow-[inset_0_0_0_2px_var(--c)]' : 'bg-st',
        className,
      )}
    />
  );
}
