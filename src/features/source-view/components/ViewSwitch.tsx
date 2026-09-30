import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUiStore, type SourceMode } from '@/stores/uiStore';
import { setSourceMode, VIEW_LABEL } from '../actions';

const VIEWS: { mode: SourceMode; icon: keyof typeof Icon }[] = [
  { mode: 'stage', icon: 'stage' },
  { mode: 'compare', icon: 'compare' },
  { mode: 'overlay', icon: 'overlay' },
];

/** Reading, side by side, or overlay: how the original shows next to the record. */
export function ViewSwitch() {
  const source = useUiStore((s) => s.source);
  return (
    <div role="radiogroup" aria-label="Original document view" className="flex items-center gap-0.5">
      {VIEWS.map(({ mode, icon }) => {
        const I = Icon[icon];
        const on = source === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={VIEW_LABEL[mode]}
            title={`${VIEW_LABEL[mode]} (O to cycle)`}
            onClick={() => setSourceMode(mode)}
            className={cn('grid size-6 place-items-center rounded-full', on ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:bg-line')}
          >
            <I size={14} />
          </button>
        );
      })}
    </div>
  );
}
