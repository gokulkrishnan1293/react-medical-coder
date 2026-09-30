import type { Finding } from '@/types';
import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/ui';
import { FindingActions, RouteTag, codeLabel, mdmTag, titleOf } from '@/features/findings';

interface Props {
  f: Finding;
  active: boolean;
  hot: boolean;
  flash: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const chip = 'rounded bg-chrome-2 px-[5px] py-[3px] font-mono text-[10px] leading-none font-semibold tracking-[0.02em] text-ink-2';

/** One finding in the notepad list. */
export function NoteRow({ f, active, hot, flash, onEnter, onLeave, onClick }: Props) {
  const rejected = f.status === 'rejected';
  return (
    <div
      data-row={f.id}
      role="button"
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className={cn(
        'st-' + f.status,
        'group grid cursor-pointer grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-[9px] rounded-[7px] border p-2 transition-colors',
        active ? 'border-st/45 bg-paper' : 'border-transparent hover:bg-chrome-2',
        hot && !active && 'bg-chrome-2',
        flash && 'animate-[row-in_.9s_ease-out]',
      )}
    >
      <StatusDot status={f.status} className="mt-[5px]" />
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-[7px]">
          <span className="flex-none font-mono text-xs font-semibold text-st">{codeLabel(f)}</span>
          <span className={cn('min-w-0 truncate text-[12.5px] font-medium', rejected && 'text-ink-3 line-through')}>{titleOf(f)}</span>
        </div>
        <div className={cn('mt-0.5 truncate font-mono text-[11.5px] leading-[1.45] text-ink-2', rejected && 'text-ink-3 line-through')}>“{f.text}”</div>
        <div className="mt-[5px] flex flex-wrap gap-[5px]">
          {f.code && f.mdm && <span className={chip}>{mdmTag(f)}</span>}
          <RouteTag f={f} />
          {f.replaces && <span className={chip}>replaces {f.replaces}</span>}
        </div>
      </div>
      <div className={cn('flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100', active && 'opacity-100')}>
        <FindingActions f={f} stop />
      </div>
    </div>
  );
}
