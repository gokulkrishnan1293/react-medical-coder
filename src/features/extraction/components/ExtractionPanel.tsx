import { useMemo } from 'react';
import type { ExtractionFlag } from '@/types';
import { BLOCKS } from '@/data';
import { Icon, IconButton } from '@/components/ui';
import { useReadOnly } from '@/features/findings';
import { KIND_LABEL, goToFlag, useExtractionStore } from '../store';

export const EXTRACTION_NOTE = 'Problems with how the original was extracted to text. Saved separately (extraction.json); they never count toward the claim.';

/** One flag in a list: kind, the words or where content is missing, what it should read, the comment. */
export function FlagSummary({ f }: { f: ExtractionFlag }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5 text-[11px]">
        <span className="rounded bg-flag-fill px-1.5 py-[3px] font-semibold leading-none text-flag">{KIND_LABEL[f.kind]}</span>
        <span className="font-mono text-ink-3">p. {f.page}</span>
      </span>
      {f.text ? (
        <span className="mt-1 block truncate font-mono text-[11.5px] text-ink">“{f.text}”</span>
      ) : (
        <span className="mt-1 block truncate text-[11.5px] text-ink-2">Missing near “{f.near ?? (f.block ? BLOCKS[f.block]?.t.slice(0, 40) : '')}…”</span>
      )}
      {f.shouldRead && <span className="mt-0.5 block truncate text-[11.5px] text-ink-2">→ <span className="font-mono">{f.shouldRead}</span></span>}
      {f.comment && <span className="mt-0.5 block truncate text-[11.5px] text-ink-3 italic">{f.comment}</span>}
      {f.screenshot && <span className="mt-1 block"><img src={f.screenshot} alt="Your screenshot" className="h-10 rounded border border-line object-cover object-top" /></span>}
    </span>
  );
}

/** Notepad section: the extraction flags on this case, in page order. Click to go there; hover to remove. */
export function ExtractionPanel() {
  const flags = useExtractionStore((s) => s.flags);
  const remove = useExtractionStore((s) => s.remove);
  const readOnly = useReadOnly();
  const sorted = useMemo(() => [...flags].sort((a, b) => a.page - b.page || (BLOCKS[a.block ?? '']?.idx ?? 0) - (BLOCKS[b.block ?? '']?.idx ?? 0)), [flags]);
  return (
    <div className="flex flex-col gap-1 px-1.5 pt-2 pb-2">
      <p className="px-1.5 pb-1 text-[11px] leading-snug text-ink-3">{EXTRACTION_NOTE}</p>
      {!sorted.length && (
        <p className="mx-1.5 rounded-lg border border-dashed border-line px-3 py-3 text-[12px] leading-snug text-ink-2">
          Nothing flagged. Select words that came out wrong and choose <b className="font-semibold text-flag">⚑ Flag</b>, or right-click where
          something is missing, on the record or the original.
        </p>
      )}
      {sorted.map((f) => (
        <div key={f.id} className="group flex items-start gap-1 rounded-lg hover:bg-chrome-2">
          <button type="button" onClick={() => goToFlag(f)} className="flex min-w-0 flex-1 gap-2 py-1.5 pl-2.5 text-left" title="Go to it in the record">
            <Icon.flag size={13} className="mt-0.5 flex-none text-flag" />
            <FlagSummary f={f} />
          </button>
          {!readOnly && (
            <IconButton size="sm" tone="no" onClick={() => remove(f.id)} aria-label="Remove flag" title="Remove" className="mt-1 mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
              <Icon.trash size={13} />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
}
