import { useState } from 'react';
import type { Finding } from '@/types';
import { HoverTip, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { claimLocked, codeLabel, mdmTag, useReadOnly } from '@/features/findings';
import { CodePicker, codeKindOf } from '@/features/add-finding';

/**
 * The code of a finding. Codes that are on the claim are locked: they are what was billed.
 * Any other diagnosis, service or MAR code can be changed by searching for the right one.
 */
export function CodeCell({ f }: { f: Finding }) {
  const kind = codeKindOf(f);
  const locked = claimLocked(f);
  const readOnly = useReadOnly();
  const editable = !!kind && !locked && !readOnly && f.status !== 'rejected';
  const [open, setOpen] = useState(false);

  return (
    <div className="group/code relative" onClick={(e) => editable && e.stopPropagation()}>
      {open && kind ? (
        <CodePicker f={f} kind={kind} onDone={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          disabled={!editable}
          onClick={() => setOpen(true)}
          title={locked ? 'On the claim, so it cannot be changed here' : editable ? 'Change code' : undefined}
          className={cn('flex items-center gap-1.5 font-mono font-semibold whitespace-nowrap', editable ? 'cursor-text rounded hover:text-accent' : 'cursor-default')}
        >
          {codeLabel(f)}
          {locked && <Icon.lock size={11} className="text-ink-3" />}
          {editable && <Icon.pencil size={12} className="text-ink-3 opacity-0 group-hover/code:opacity-100" />}
        </button>
      )}
      {f.code && mdmTag(f) && <div className="mt-0.5 font-mono text-[10.5px] font-medium text-ink-3">{mdmTag(f)}</div>}
      {f.editedFrom && (
        <HoverTip tip={<><span className="block font-semibold">CLAIRE's code: {f.editedFrom}</span>{f.editedFromDesc && <span className="mt-0.5 block opacity-85">{f.editedFromDesc}</span>}</>}>
          <span tabIndex={0} className="mt-0.5 block font-mono text-[10.5px] font-medium text-add">was {f.editedFrom}</span>
        </HoverTip>
      )}
      {f.replaces && <div className="mt-0.5 font-mono text-[10.5px] font-medium text-ink-3">replaces {f.replaces}</div>}
    </div>
  );
}
