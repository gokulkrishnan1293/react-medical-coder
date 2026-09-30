import type { Finding } from '@/types';
import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/ui';
import { FindingActions, MarDetail, RouteTag, STATUS_LABEL, TypeBadge, codeLabel, mdmTag, titleOf } from '@/features/findings';

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

/** One finding in the notepad: badges, code and title, quoted evidence, actions. */
export function FindingCard({ f, active, hot, flash, onEnter, onLeave, onClick }: Props) {
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
        'group relative cursor-pointer rounded-lg border bg-paper py-2 pr-2 pl-3 transition-colors',
        'before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-st',
        active ? 'border-st/60 shadow-sm' : 'border-line hover:border-ink-3',
        hot && !active && 'border-ink-3',
        flash && 'animate-[row-in_.9s_ease-out]',
        rejected && 'opacity-70',
      )}
    >
      <div className="flex flex-wrap items-center gap-[5px]">
        <TypeBadge type={f.type} />
        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-st">
          <StatusDot status={f.status} className="size-1.5" />{STATUS_LABEL[f.status]}
        </span>
        <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-[760px]:opacity-100" style={active ? { opacity: 1 } : undefined}>
          <FindingActions f={f} stop />
        </span>
      </div>
      <div className="mt-1 flex min-w-0 items-baseline gap-[7px]">
        <span className="flex-none font-mono text-xs font-semibold text-st">{codeLabel(f)}</span>
        <span className={cn('min-w-0 truncate text-[12.5px] font-medium', rejected && 'text-ink-3 line-through')}>{titleOf(f)}</span>
      </div>
      {f.mar ? (
        <div className="mt-0.5"><MarDetail mar={f.mar} /></div>
      ) : (
        <div className={cn('mt-0.5 truncate font-mono text-[11.5px] leading-[1.45] text-ink-2', rejected && 'text-ink-3 line-through')}>“{f.text}”</div>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-[5px]">
        <RouteTag f={f} />
        {f.code && f.mdm && <span className={chip}>{mdmTag(f)}</span>}
        {f.replaces && <span className={chip}>replaces {f.replaces}</span>}
      </div>
      {f.comment && <div className="mt-1.5 border-l-2 border-line pl-2 text-[11.5px] leading-snug text-ink-2 italic">{f.comment}</div>}
    </div>
  );
}
