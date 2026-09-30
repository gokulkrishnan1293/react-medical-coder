import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useFindings } from '@/features/findings';
import { Icon } from '@/components/ui';

/** Title row shared by the floating and docked notepad. */
export function NotepadHeader({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  const count = useFindings().length;
  return (
    <div className={cn('flex items-center gap-[7px] border-b border-line bg-chrome py-[7px] pr-2 pl-2.5 select-none', className)} {...rest}>
      {rest.onPointerDown && <span className="grid text-ink-3"><Icon.grip size={14} /></span>}
      <span className="text-[13px] font-bold">Notepad</span>
      <span className="rounded-full bg-ink px-1.5 py-[3px] font-mono text-[10.5px] leading-none font-semibold text-paper">{count}</span>
      <span className="flex-1" />
      {children}
    </div>
  );
}
