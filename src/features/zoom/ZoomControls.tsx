import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUiStore, type ZoomSide } from '@/stores/uiStore';
import { setZoom, stepZoom, useZoom, ZOOM_MAX, ZOOM_MIN } from './zoom';

const btn = 'grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[13px] leading-none text-ink-2 hover:bg-line disabled:opacity-40 disabled:hover:bg-transparent';

/** − 100% + and fit-width for one column. */
export function ZoomControls({ side }: { side: ZoomSide }) {
  const zoom = useZoom(side);
  const fit = useUiStore((s) => s.zoom[side] === 'fit');
  const what = side === 'record' ? 'record' : 'original';
  return (
    <div role="group" aria-label={`Zoom ${what}`} className="flex items-center gap-0.5 font-mono text-[11.5px] font-medium">
      <button type="button" className={btn} aria-label={`Zoom out ${what}`} title="Zoom out" disabled={zoom <= ZOOM_MIN + 0.005} onClick={() => stepZoom(side, -1)}>−</button>
      <button type="button" className={cn(btn, 'w-11 tabular-nums')} aria-label="Actual size" title="Actual size (100%)" onClick={() => setZoom(side, 1)}>
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" className={btn} aria-label={`Zoom in ${what}`} title="Zoom in" disabled={zoom >= ZOOM_MAX - 0.005} onClick={() => stepZoom(side, 1)}>+</button>
      <button
        type="button"
        className={cn(btn, fit && 'bg-accent-soft text-accent hover:bg-accent-soft')}
        aria-pressed={fit}
        aria-label="Fit width"
        title="Fit page to width"
        onClick={() => setZoom(side, 'fit')}
      >
        <Icon.fitWidth size={14} />
      </button>
    </div>
  );
}
