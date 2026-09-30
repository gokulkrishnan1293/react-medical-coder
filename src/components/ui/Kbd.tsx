import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-b-2 border-current/30 px-1 font-mono text-[10.5px] leading-normal font-medium opacity-80">
      {children}
    </kbd>
  );
}
