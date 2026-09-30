import type { Finding } from '@/types';
import { HoverTip } from '@/components/ui';

/**
 * "Revised" mark on evidence the coder moved; hover it for where CLAIRE first found it.
 * Inside a button, pass `inButton` so the mark is not a second focus stop.
 */
export function RevisedEvidence({ f, inButton }: { f: Finding; inButton?: boolean }) {
  if (!f.movedFrom) return null;
  return (
    <HoverTip tip={<><span className="block font-semibold">CLAIRE's evidence · p. {f.movedFrom.page}</span><span className="mt-0.5 block font-mono text-[11px] opacity-85">“{f.movedFrom.text}”</span></>}>
      <span tabIndex={inButton ? undefined : 0} className="rounded bg-add-fill px-1.5 py-[3px] font-sans text-[10.5px] leading-none font-semibold text-add">Revised</span>
    </HoverTip>
  );
}
