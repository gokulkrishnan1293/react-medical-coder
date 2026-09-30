import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CLAIM_CODES } from '@/data';
import { scrollerRef } from '@/lib/dom';
import { clamp, cn } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { Button, Icon, Kbd, SegmentedTabs } from '@/components/ui';
import { ELEMENT_SHORT, LEVELS_SHORT } from '@/features/findings';
import { rankMdm, searchCodes, type RankedMdm } from '../utils/codeSearch';
import { addFinding } from '../addFinding';
import { useAddFindingStore, type ComposeType, type TextSelection } from '../store';

const TABS: { key: ComposeType; label: string }[] = [
  { key: 'dx', label: 'Diagnosis' },
  { key: 'px', label: 'Procedure' },
  { key: 'mdm', label: 'MDM' },
  { key: 'note', label: 'Note' },
];

const addMdm = (o: RankedMdm) => addFinding({ type: 'mdm', desc: o.label, mdm: { el: o.el, level: o.level ?? 0, cat: o.cat, label: o.label } });

/** Panel for adding a finding from selected text: code search, MDM descriptor, or free note. */
export function ComposePanel({ sel, type }: { sel: TextSelection; type: ComposeType }) {
  useScrollTick(scrollerRef);
  const { set, cancel } = useAddFindingStore();
  const [q, setQ] = useState(sel.text.slice(0, 80));
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const codeKind = type === 'dx' || type === 'px' ? type : null;
  const results = useMemo(() => (codeKind ? searchCodes(q, codeKind) : []), [q, codeKind]);
  const mdm = useMemo(() => rankMdm(sel.text), [sel.text]);

  useEffect(() => setPick(0), [type, q]);
  useEffect(() => {
    const t = boxRef.current?.querySelector<HTMLElement>(type === 'note' ? 'textarea' : type === 'mdm' ? '[role=listbox]' : 'input');
    t?.focus({ preventScroll: true });
  }, [type]);

  const count = type === 'mdm' ? mdm.length : results.length;
  const submit = () => {
    if (type === 'note') return addFinding({ type: 'note', note: note.trim() || 'Reviewer note', desc: 'Reviewer note' });
    if (type === 'mdm') { if (mdm[pick]) addMdm(mdm[pick]); return; }
    const o = results[pick];
    if (o && codeKind) addFinding({ type: codeKind, code: o.code, desc: o.desc });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
    if (type === 'note') {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setPick((p) => Math.min(p + 1, count - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setPick((p) => Math.max(p - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  const r = sel.range.getBoundingClientRect();
  const W = Math.min(360, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  const below = window.innerHeight - r.bottom > 400;
  const style = below ? { left, top: r.bottom + 10, width: W } : { left, bottom: Math.max(8, window.innerHeight - r.top + 12), width: W };
  const cur = codeKind ? results[pick] : undefined;
  const opt = (on: boolean) => cn('grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-[7px] py-1.5 text-left', on && 'bg-accent-soft');

  return (
    <motion.div
      data-add-finding
      ref={boxRef}
      role="dialog"
      aria-label="Add finding"
      onKeyDown={onKey}
      className="fixed z-70 flex flex-col gap-2 rounded-xl border border-line bg-paper p-2.5 shadow-float"
      style={style}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14 }}
    >
      <SegmentedTabs tabs={TABS} value={type} onChange={(k) => set({ compose: k })} className="grid grid-cols-4" />
      <blockquote className="max-h-16 overflow-hidden rounded-r-[5px] border-l-2 border-add bg-chrome px-2.5 py-[7px] font-mono text-xs leading-normal">“{sel.text}”</blockquote>

      {codeKind && (
        <>
          <label className="flex items-center gap-[7px] rounded-lg border border-line bg-chrome px-2.5 text-ink-3 focus-within:border-accent">
            <Icon.search size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={codeKind === 'dx' ? 'Search ICD-10-CM' : 'Search CPT / HCPCS'}
              aria-label="Search codes"
              className="min-w-0 flex-1 bg-transparent py-[7px] text-[13px] text-ink outline-none"
            />
          </label>
          <div role="listbox" className="flex max-h-[210px] flex-col gap-px overflow-y-auto">
            {results.map((o, i) => (
              <button key={o.code} role="option" aria-selected={i === pick} className={opt(i === pick)} onMouseEnter={() => setPick(i)} onClick={() => addFinding({ type: codeKind, code: o.code, desc: o.desc })}>
                <span className="font-mono text-[11.5px] font-semibold text-accent">{o.code}</span>
                <span className="text-[12.5px] leading-snug">{o.desc}</span>
                {CLAIM_CODES.has(o.code) && <span className="rounded border border-line px-[5px] py-px text-[10px] text-ink-3">on claim</span>}
              </button>
            ))}
          </div>
          {cur && (
            <div className="px-0.5 text-[11.5px] text-ink-2">
              {CLAIM_CODES.has(cur.code) ? 'On the claim. Adds supporting evidence.' : 'Not on the claim. Listed under "not on claim".'}
            </div>
          )}
        </>
      )}

      {type === 'mdm' && (
        <div role="listbox" tabIndex={-1} className="flex max-h-[260px] flex-col gap-px overflow-y-auto outline-none">
          {mdm.map((o, i) => (
            <button key={o.label} role="option" aria-selected={i === pick} className={opt(i === pick)} onMouseEnter={() => setPick(i)} onClick={() => addMdm(o)}>
              <span className="font-mono text-[11.5px] font-semibold text-add">{o.el === 'data' ? `DATA·C${o.cat}` : `${ELEMENT_SHORT[o.el]}·${LEVELS_SHORT[o.level ?? 0]}`}</span>
              <span className="text-[12.5px] leading-snug">{o.label}</span>
              {o.suggested && <span className="rounded border border-add/45 bg-add-fill px-[5px] py-px text-[10px] text-add">Suggested</span>}
            </button>
          ))}
        </div>
      )}

      {type === 'note' && (
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for the review file"
          className="resize-y rounded-lg border border-line bg-chrome px-2.5 py-2 text-[13px] leading-normal text-ink outline-none focus:border-accent"
        />
      )}

      <div className="flex items-center gap-1.5 border-t border-line pt-2">
        <span className="mr-auto inline-flex items-center gap-[3px] text-[11px] text-ink-3">
          {type === 'note' ? <><Kbd>⌘</Kbd><Kbd>↵</Kbd> to add</> : <><Kbd>↑</Kbd><Kbd>↓</Kbd> choose · <Kbd>↵</Kbd> add</>}
        </span>
        <Button onClick={cancel}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Add to notes</Button>
      </div>
    </motion.div>
  );
}
