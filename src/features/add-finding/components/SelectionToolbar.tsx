import { motion } from 'motion/react';
import { scrollerRef } from '@/lib/dom';
import { clamp } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { useAddFindingStore, type ComposeType, type TextSelection } from '../store';

const ITEMS: [ComposeType, string][] = [['dx', 'Diagnosis'], ['px', 'Procedure'], ['mdm', 'MDM element'], ['note', 'Note']];

/** Floating "Add …" bar above selected record text. */
export function SelectionToolbar({ sel }: { sel: TextSelection }) {
  useScrollTick(scrollerRef);
  const set = useAddFindingStore((s) => s.set);
  const r = sel.range.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const W = sel.overlap ? 250 : 380;
  const left = clamp(r.left + r.width / 2 - W / 2, 8, window.innerWidth - W - 8);
  const top = r.top > 120 ? r.top - 46 : r.bottom + 8;
  const base = 'fixed z-70 rounded-[9px] bg-ink text-paper shadow-float';
  const anim = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.12 } };

  if (sel.overlap) {
    return (
      <motion.div data-add-finding {...anim} className={base + ' px-3 py-2 text-xs'} style={{ left, top, width: W }} onMouseDown={(e) => e.preventDefault()}>
        Part of this is already marked. Hover the box to edit it.
      </motion.div>
    );
  }
  return (
    <motion.div data-add-finding {...anim} role="toolbar" aria-label="Add finding" className={base + ' flex items-center gap-0.5 p-1 whitespace-nowrap'} style={{ left, top }} onMouseDown={(e) => e.preventDefault()}>
      <span className="px-2 pr-1.5 text-[10.5px] tracking-[0.08em] uppercase opacity-60">Add</span>
      {ITEMS.map(([k, l]) => (
        <button key={k} onClick={() => set({ compose: k })} className="rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-paper/15">
          + {l}
        </button>
      ))}
    </motion.div>
  );
}
