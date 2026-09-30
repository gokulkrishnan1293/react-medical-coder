import { useMemo } from 'react';
import { useExtractionStore, KIND_LABEL } from '../store';
import { Icon } from '@/components/ui';

/** Pins in the margin beside a paragraph with extraction flags; each opens its flag. */
export function FlagPins({ block }: { block: string }) {
  const all = useExtractionStore((s) => s.flags);
  const flags = useMemo(() => all.filter((f) => f.block === block), [all, block]);
  const set = useExtractionStore((s) => s.set);
  if (!flags.length) return null;
  return (
    <span className="absolute top-0 -left-8 flex flex-col gap-0.5 max-[760px]:-left-5" data-add-finding>
      {flags.map((f) => (
        <button
          key={f.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            set({ draft: { mode: 'edit', id: f.id, x: r.left + 180, y: r.bottom } });
          }}
          title={`Extraction flag: ${KIND_LABEL[f.kind]}${f.shouldRead ? ` → ${f.shouldRead}` : ''}`}
          aria-label={`Extraction flag: ${KIND_LABEL[f.kind]}`}
          className="grid size-5 place-items-center rounded-md bg-flag-fill text-flag ring-1 ring-flag/40 hover:bg-flag hover:text-paper"
        >
          <Icon.flag size={12} />
        </button>
      ))}
    </span>
  );
}
