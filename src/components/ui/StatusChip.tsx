import type { FindingStatus } from '@/types';
import { cn } from '@/lib/utils';
import { StatusDot } from './StatusDot';

export function StatusChip({ status, label }: { status: FindingStatus; label: string }) {
  return (
    <span className={cn('st-' + status, 'inline-flex items-center gap-1.5 rounded-full bg-st-fill py-0.5 pr-2 pl-1.5 text-[11px] font-semibold whitespace-nowrap text-st')}>
      <StatusDot status={status} className="size-[7px]" />
      {label}
    </span>
  );
}
