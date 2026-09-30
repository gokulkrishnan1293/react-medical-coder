import { motion } from 'motion/react';
import { scrollerRef } from '@/lib/dom';
import { clamp } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { useAddFindingStore, type ComposeType, type TextSelection } from '../store';
import { useReadOnly } from '@/features/findings';
import { applyRebind, cancelRebind, rebindLabel } from '../rebind';
import { Icon } from '@/components/ui';
import { useExtractionStore } from '@/features/extraction';

const ITEMS: [ComposeType, string][] = [['dx', 'Diagnosis'], ['svc', 'Service'], ['mar', 'MAR'], ['doc', 'Doc'], ['note', 'Note']];

/** Floating "Add …" bar above selected record text. */
export function SelectionToolbar({ sel }: { sel: TextSelection }) {
  useScrollTick(scrollerRef);
  const set = useAddFindingStore((s) => s.set);
  const rebind = useAddFindingStore((s) => s.rebind);
  const adding = useAddFindingStore((s) => s.rebindMode === 'add');
  const readOnly = useReadOnly();
  const r = sel.range.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const W = sel.overlap ? 330 : rebind ? 330 : 470;
  // flag what the extraction got wrong, even inside a finding's evidence
  const flag = (
    <button
      type="button"
      onClick={() => useExtractionStore.getState().set({ draft: { mode: 'words', page: sel.page, block: sel.block, text: sel.text, x: r.left + r.width / 2, y: r.bottom } })}
      title="Flag an extraction problem: formatting, wrong data or missed content"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-paper/15"
    >
      <Icon.flag size={13} />Flag
    </button>
  );
  const left = clamp(r.left + r.width / 2 - W / 2, 8, window.innerWidth - W - 8);
  const top = r.top > 120 ? r.top - 46 : r.bottom + 8;
  const base = 'fixed z-70 rounded-[9px] bg-ink text-paper shadow-float';
  const anim = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.12 } };

  if (readOnly) {
    return (
      <motion.div data-add-finding {...anim} className={base + ' px-3 py-2 text-xs'} style={{ left, top, width: 270 }} onMouseDown={(e) => e.preventDefault()}>
        Review completed. Reopen it to add findings.
      </motion.div>
    );
  }
  if (sel.overlap) {
    return (
      <motion.div data-add-finding {...anim} className={base + ' flex items-center gap-2 py-1 pr-1 pl-3 text-xs'} style={{ left, top, width: W }} onMouseDown={(e) => e.preventDefault()}>
        <span className="flex-1">Part of this is already a finding.</span>
        <span className="h-4 w-px bg-paper/25" />
        {flag}
      </motion.div>
    );
  }
  if (rebind) {
    return (
      <motion.div data-add-finding {...anim} role="toolbar" aria-label="Change evidence" className={base + ' flex items-center gap-0.5 p-1 whitespace-nowrap'} style={{ left, top }} onMouseDown={(e) => e.preventDefault()}>
        <button onClick={applyRebind} className="rounded-md bg-accent px-2.5 py-1.5 text-[12.5px] font-medium text-accent-ink hover:brightness-110">
          {adding ? 'Tag as another place for' : 'Use as evidence for'} <span className="font-mono">{rebindLabel()}</span>
        </button>
        <button onClick={cancelRebind} className="rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-paper/15">Cancel</button>
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
      <span className="mx-1 h-4 w-px bg-paper/25" />
      {flag}
    </motion.div>
  );
}
