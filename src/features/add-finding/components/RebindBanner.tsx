import { motion } from 'motion/react';
import { Button, Kbd } from '@/components/ui';
import { useFindings } from '@/features/findings';
import { codeLabel } from '@/features/findings';
import { useAddFindingStore } from '../store';
import { cancelRebind } from '../rebind';

/** Prompt shown while the coder picks new evidence for a finding. */
export function RebindBanner() {
  const id = useAddFindingStore((s) => s.rebind);
  const f = useFindings().find((x) => x.id === id);
  if (!f) return null;
  return (
    <motion.div
      data-add-finding
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-[128px] left-1/2 z-70 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-[12.5px] text-paper shadow-float"
    >
      <span>
        Select the new evidence for <span className="font-mono font-semibold">{codeLabel(f)}</span> in the record
      </span>
      <Button onClick={cancelRebind} className="border-transparent bg-paper/15 py-1 text-paper hover:border-transparent">
        Cancel <Kbd>Esc</Kbd>
      </Button>
    </motion.div>
  );
}
