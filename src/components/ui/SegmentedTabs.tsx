import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab<K extends string> {
  key: K;
  label: ReactNode;
  count?: number;
}

/** Pill-style tab switcher. */
export function SegmentedTabs<K extends string>({ tabs, value, onChange, size = 'sm', className }: {
  tabs: Tab<K>[];
  value: K;
  onChange: (k: K) => void;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-[7px] bg-chrome-2 p-0.5', className)}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[5px]',
              size === 'lg' ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-1 text-xs',
              on ? 'bg-paper font-semibold text-ink shadow-sm' : 'text-ink-2',
            )}
          >
            {t.label}
            {t.count != null && <span className="font-mono text-[10.5px] font-medium text-ink-3">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
