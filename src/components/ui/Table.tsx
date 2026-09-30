import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[9px] border border-line bg-paper">
      <table className="w-full min-w-[760px] border-collapse text-[12.5px]">{children}</table>
    </div>
  );
}

export const Th = ({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('sticky top-0 border-b border-line bg-chrome px-3 py-[9px] text-left text-[10.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase', className)} {...rest} />
);

export const Td = ({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('border-b border-line px-3 py-[9px] align-top leading-[1.45] [tr:last-child>&]:border-b-0', className)} {...rest} />
);
