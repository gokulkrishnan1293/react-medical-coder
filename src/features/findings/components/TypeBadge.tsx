import type { FindingType } from '@/types';
import { cn } from '@/lib/utils';
import { TYPE_LABEL } from '../utils/labels';

const TYPE_STYLE: Record<FindingType, string> = {
  dx: 'text-t-dx bg-t-dx/12',
  svc: 'text-t-svc bg-t-svc/12',
  mar: 'text-t-mar bg-t-mar/12',
  doc: 'text-ink-2 bg-chrome-2',
  time: 'text-ink-2 bg-chrome-2',
  note: 'text-ink-2 bg-chrome-2',
};

/** What kind of finding this is: Diagnosis, Service, MAR, Documentation, Note. */
export function TypeBadge({ type, className }: { type: FindingType; className?: string }) {
  return (
    <span className={cn('rounded px-1.5 py-[3px] text-[10px] leading-none font-semibold tracking-[0.03em] whitespace-nowrap uppercase', TYPE_STYLE[type], className)}>
      {TYPE_LABEL[type]}
    </span>
  );
}
