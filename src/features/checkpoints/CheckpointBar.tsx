import { motion } from 'motion/react';
import { CASE } from '@/data';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';
import { useCheckpoints } from './useCheckpoints';

/** Live progress toward the billed level. */
export function CheckpointBar() {
  const cps = useCheckpoints();
  const met = cps.filter((c) => c.met).length;
  return (
    <nav aria-label="Review checkpoints" className="flex items-center gap-2 overflow-x-auto border-b border-line bg-chrome px-4 py-2 [scrollbar-width:none]">
      <span className="mr-1 text-[11.5px] whitespace-nowrap text-ink-3 max-[760px]:hidden">
        <b className="font-mono text-ink">{met}/{cps.length}</b> · {CASE.billed} needs 2 of 3 at High
      </span>
      {cps.map((c) => (
        <button
          key={c.k}
          onClick={c.go}
          className={cn(
            'inline-flex h-7 flex-none items-center gap-[7px] rounded-full border pr-[11px] pl-[5px] text-xs transition-colors',
            c.met ? 'border-ok/45 bg-ok-fill' : 'border-line bg-paper hover:border-ink-3',
          )}
        >
          {c.met ? (
            <motion.span
              key="met"
              aria-hidden="true"
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="grid size-[18px] flex-none place-items-center rounded-full bg-ok text-on-tag"
            >
              <Icon.check size={11} sw={3} />
            </motion.span>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                'size-[18px] flex-none rounded-full',
                c.part ? 'border-[1.5px] border-ai bg-[linear-gradient(90deg,var(--ai)_50%,transparent_50%)]' : 'border-[1.5px] border-dashed border-ink-3',
              )}
            />
          )}
          <span className="text-ink-2">{c.label}</span>
          <span className="font-semibold tabular-nums">{c.val}</span>
          {!c.met && c.part && ['prob', 'data', 'risk'].includes(c.k) && (
            <span className="rounded-full bg-ai-fill px-1.5 py-0.5 text-[10.5px] text-ai">AI has more</span>
          )}
        </button>
      ))}
    </nav>
  );
}
