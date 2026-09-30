import { HoverTip, Icon } from '@/components/ui';
import { TYPE_LABEL, groupPlaces, useOrderedFindings } from '@/features/findings';
import { nextAiSuggestion } from '@/features/shortcuts';
import type { FindingType } from '@/types';

/**
 * Checkpoint on the left of the bar: how many findings are still AI suggestions nobody has reviewed.
 * Counted per code, as the full notes rows are, since accepting a code covers all its places. Click to go
 * to the next one.
 */
export function ReviewProgress() {
  const rows = groupPlaces(useOrderedFindings());
  const open = rows.filter(({ places }) => places.some((p) => p.status === 'ai'));
  const done = rows.length - open.length;
  const byType = open.reduce<Partial<Record<FindingType, number>>>((m, { lead }) => ({ ...m, [lead.type]: (m[lead.type] ?? 0) + 1 }), {});

  if (!open.length) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-ok-fill px-2.5 py-1.5 text-[12px] font-semibold text-ok">
        <Icon.check size={13} sw={2.4} />All {rows.length} findings reviewed
      </span>
    );
  }
  return (
    <HoverTip
      tip={
        <>
          <span className="block font-semibold">{open.length} not reviewed yet</span>
          {(Object.entries(byType) as [FindingType, number][]).map(([t, n]) => <span key={t} className="block opacity-85">{TYPE_LABEL[t]}: {n}</span>)}
          <span className="mt-1 block opacity-75">Click to go to the next one</span>
        </>
      }
    >
      <button
        type="button"
        onClick={nextAiSuggestion}
        aria-label={`${open.length} findings not reviewed. Go to the next one`}
        className="group flex items-center gap-2.5 rounded-[7px] px-2 py-1 text-left hover:bg-chrome-2"
      >
        <span>
          <span className="block text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Findings</span>
          <span className="block text-[12.5px] whitespace-nowrap">
            <b className="font-semibold text-ai tabular-nums">{open.length}</b> to review <span className="text-ink-3">· {done} of {rows.length} done</span>
          </span>
        </span>
        <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-chrome-2">
          <span className="block h-full rounded-full bg-ok" style={{ width: `${(done / rows.length) * 100}%` }} />
        </span>
        <Icon.right size={13} className="text-ink-3 group-hover:text-ink" />
      </button>
    </HoverTip>
  );
}
