import { motion } from 'motion/react';
import { notesTargetRef } from '@/lib/dom';
import { Icon } from '@/components/ui';
import { groupPlaces, useFindings, useOrderedFindings } from '@/features/findings';
import { useNotepadStore } from '../store';

/** Minimized notepad: a pill with the finding count and what is left to review. */
export function NotesBubble() {
  const findings = useFindings();
  const reopen = useNotepadStore((s) => s.reopen);
  // per code, as the checkpoint bar counts: accepting a code covers all its places
  const pending = groupPlaces(useOrderedFindings()).filter(({ places }) => places.some((p) => p.status === 'ai')).length;
  return (
    <motion.button
      ref={(el) => { notesTargetRef.current = el; }}
      onClick={reopen}
      aria-label="Open notepad"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed right-9 bottom-[calc(22px+env(safe-area-inset-bottom,0px))] z-40 inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2.5 text-[13px] font-semibold text-paper shadow-float max-[760px]:right-6"
    >
      <Icon.notes size={16} />
      <span>Notes</span>
      <span className="rounded-full bg-paper px-1.5 py-[3px] font-mono text-[10.5px] leading-none text-ink">{findings.length}</span>
      {pending > 0 && <span className="text-[11.5px] font-normal opacity-75">{pending} to review</span>}
    </motion.button>
  );
}
