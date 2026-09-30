import type { Reviewer } from '@/types';
import { cn } from '@/lib/utils';

/** A reviewer's initials in a circle; the name is the tooltip. */
export function Avatar({ r, size = 24, className }: { r: Reviewer; size?: number; className?: string }) {
  return (
    <span
      title={r.name}
      aria-label={r.name}
      className={cn('inline-grid flex-none place-items-center rounded-full bg-chrome-2 font-semibold text-ink-2 ring-2 ring-paper', className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {r.initials}
    </span>
  );
}
