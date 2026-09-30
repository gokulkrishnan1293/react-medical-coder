import type { MarEntry } from '@/types';

/** Time · dose · route · billing units for a MAR finding. */
export function MarDetail({ mar }: { mar: MarEntry }) {
  return (
    <span className="font-mono text-[11px] text-ink-2 tabular-nums">
      {mar.time} · {mar.dose} · {mar.route}
      {mar.units != null && <> · <b className="font-semibold text-ink">{mar.units} {mar.units === 1 ? 'unit' : 'units'}</b></>}
    </span>
  );
}
