import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';

/** Opens or closes the original document beside the record. */
export function CompareToggle() {
  const on = useUiStore((s) => s.source === 'compare');
  const toggle = useUiStore((s) => s.toggleSource);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={toggle}
      title={on ? 'Close original (O)' : 'Compare with original (O)'}
      className={cn(
        'flex h-6 items-center gap-1.5 rounded-full px-2 text-[11.5px] font-medium',
        on ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:bg-line',
      )}
    >
      <Icon.compare size={14} />
      Original
    </button>
  );
}
