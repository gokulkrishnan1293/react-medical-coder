import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { CodeKind, DocKind, MarEntry } from '@/types';
import { BLOCKS, CLAIM_CODES, DOC_KINDS, marCells } from '@/data';
import { scrollerRef } from '@/lib/dom';
import { clamp, cn } from '@/lib/utils';
import { MOD, isModKey } from '@/lib/platform';
import { useScrollTick } from '@/hooks/useScrollTick';
import { Button, Icon, Kbd, SegmentedTabs } from '@/components/ui';
import { billingUnits, searchCodes } from '../utils/codeSearch';
import { ELEMENT_LABEL } from '@/features/findings';
import { addFinding } from '../addFinding';
import { useAddFindingStore, type ComposeType, type TextSelection } from '../store';

const TABS: { key: ComposeType; label: string }[] = [
  { key: 'dx', label: 'Diagnosis' },
  { key: 'svc', label: 'Service' },
  { key: 'mar', label: 'MAR' },
  { key: 'doc', label: 'Doc' },
  { key: 'note', label: 'Note' },
];

const KIND: Record<Exclude<ComposeType, 'note' | 'doc'>, CodeKind> = { dx: 'dx', svc: 'svc', mar: 'drug' };
const DOCS = Object.keys(DOC_KINDS) as DocKind[];
const PLACEHOLDER: Record<CodeKind, string> = { dx: 'Search ICD-10-CM', svc: 'Search CPT / HCPCS', drug: 'Search HCPCS drug codes' };

/** MAR details from a selected MAR row, or just the selected words as the drug. */
function marFromSelection(sel: TextSelection): MarEntry {
  const b = BLOCKS[sel.block];
  if (b?.k === 'mar') {
    const [time, drug, dose, route] = marCells(b.t);
    return { time, drug, dose, route };
  }
  return { time: '', drug: sel.text, dose: '', route: '' };
}

/** Panel for adding a finding from selected text: diagnosis, service, MAR entry, code-less documentation, or free note. */
export function ComposePanel({ sel, type }: { sel: TextSelection; type: ComposeType }) {
  useScrollTick(scrollerRef);
  const { set, cancel } = useAddFindingStore();
  const mar = useMemo(() => marFromSelection(sel), [sel]);
  const [q, setQ] = useState(() => (type === 'mar' ? mar.drug : sel.text.slice(0, 80)));
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState('');
  const [doc, setDoc] = useState(0);
  const [units, setUnits] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const kind = type === 'note' || type === 'doc' ? null : KIND[type];
  const results = useMemo(() => (kind ? searchCodes(q, kind) : []), [q, kind]);
  const cur = results[pick];
  const autoUnits = cur ? billingUnits(mar.dose, cur.per) : 1;

  useEffect(() => setPick(0), [type, q]);
  useEffect(() => setUnits(null), [cur?.code]);
  useEffect(() => { if (type === 'mar') setQ(mar.drug); }, [type, mar.drug]);
  useEffect(() => {
    boxRef.current?.querySelector<HTMLElement>(type === 'note' ? 'textarea' : type === 'doc' ? '[role=listbox]' : 'input[type=search]')?.focus({ preventScroll: true });
  }, [type]);

  const add = (i = pick) => {
    const o = results[i];
    if (!o || !kind) return;
    const desc = o.per ? `${o.desc}, per ${o.per}` : o.desc;
    if (type === 'mar') addFinding({ type: 'mar', code: o.code, desc, mar: { ...mar, units: units ?? billingUnits(mar.dose, o.per) } });
    else addFinding({ type: type as 'dx' | 'svc', code: o.code, desc });
  };
  const submit = () => {
    if (type === 'note') addFinding({ type: 'note', note: note.trim() || 'Reviewer note', desc: 'Reviewer note' });
    else if (type === 'doc') addFinding({ type: 'doc', docKind: DOCS[doc], desc: DOC_KINDS[DOCS[doc]].label });
    else add();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
    if (type === 'note') {
      if (e.key === 'Enter' && isModKey(e)) { e.preventDefault(); submit(); }
      return;
    }
    if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'number') return;
    const n = type === 'doc' ? DOCS.length : results.length;
    const move = type === 'doc' ? setDoc : setPick;
    if (e.key === 'ArrowDown') { e.preventDefault(); move((p) => Math.min(p + 1, n - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move((p) => Math.max(p - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  const r = sel.range.getBoundingClientRect();
  const W = Math.min(380, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  const below = window.innerHeight - r.bottom > 420;
  const style = below ? { left, top: r.bottom + 10, width: W } : { left, bottom: Math.max(8, window.innerHeight - r.top + 12), width: W };
  const field = 'rounded-lg border border-line bg-chrome px-2.5 text-[13px] text-ink outline-none focus-within:border-accent focus:border-accent';

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
      <SegmentedTabs tabs={TABS} value={type} onChange={(k) => set({ compose: k })} className="grid grid-cols-5" />

      {type === 'mar' ? (
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-r-[5px] border-l-2 border-add bg-chrome px-2.5 py-[7px] font-mono text-xs leading-normal">
          <span className="text-ink-3">Time</span><span>{mar.time || '—'}</span>
          <span className="text-ink-3">Drug</span><span>{mar.drug}</span>
          <span className="text-ink-3">Dose</span><span>{mar.dose || '—'}</span>
          <span className="text-ink-3">Route</span><span>{mar.route || '—'}</span>
        </div>
      ) : (
        <blockquote className="max-h-16 overflow-hidden rounded-r-[5px] border-l-2 border-add bg-chrome px-2.5 py-[7px] font-mono text-xs leading-normal">“{sel.text}”</blockquote>
      )}

      {kind && (
        <>
          <label className={cn(field, 'flex items-center gap-[7px] text-ink-3')}>
            <Icon.search size={14} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={PLACEHOLDER[kind]}
              aria-label="Search codes"
              className="min-w-0 flex-1 bg-transparent py-[7px] text-ink outline-none"
            />
          </label>
          <div role="listbox" className="flex max-h-[200px] flex-col gap-px overflow-y-auto">
            {results.map((o, i) => (
              <button
                key={o.code}
                role="option"
                aria-selected={i === pick}
                onMouseEnter={() => setPick(i)}
                onClick={() => add(i)}
                className={cn('grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-[7px] py-1.5 text-left', i === pick && 'bg-accent-soft')}
              >
                <span className="font-mono text-[11.5px] font-semibold text-accent">{o.code}</span>
                <span className="text-[12.5px] leading-snug">{o.desc}{o.per && <span className="text-ink-3">, per {o.per}</span>}</span>
                {CLAIM_CODES.has(o.code) && <span className="rounded border border-line px-[5px] py-px text-[10px] text-ink-3">on claim</span>}
              </button>
            ))}
          </div>
          {type === 'mar' && cur && (
            <label className="flex items-center gap-2 px-0.5 text-[12px] text-ink-2">
              Billing units
              <input
                type="number"
                min={1}
                value={units ?? autoUnits}
                onChange={(e) => setUnits(Math.max(1, Number(e.target.value) || 1))}
                className={cn(field, 'w-16 py-1 font-mono tabular-nums')}
              />
              <span className="text-ink-3">{cur.per ? `${mar.dose || 'dose'} at ${cur.per} per unit` : ''}</span>
            </label>
          )}
          {cur && (
            <div className="px-0.5 text-[11.5px] text-ink-2">
              {CLAIM_CODES.has(cur.code) ? 'On the claim. Adds supporting evidence.' : 'New: not on the claim. Listed under "In record, not on claim".'}
            </div>
          )}
        </>
      )}

      {type === 'doc' && (
        <>
          <div className="px-0.5 text-[11.5px] leading-snug text-ink-2">What the record states, when there is no code for it. Counts toward MDM.</div>
          <div role="listbox" tabIndex={-1} aria-label="Documentation kind" className="flex flex-col gap-px outline-none">
            {DOCS.map((k, i) => {
              const m = DOC_KINDS[k].mdm;
              return (
                <button
                  key={k}
                  role="option"
                  aria-selected={i === doc}
                  onMouseEnter={() => setDoc(i)}
                  onClick={() => addFinding({ type: 'doc', docKind: k, desc: DOC_KINDS[k].label })}
                  className={cn('flex items-center gap-2 rounded-md px-[7px] py-1.5 text-left text-[12.5px]', i === doc && 'bg-accent-soft')}
                >
                  <span className="flex-1">{DOC_KINDS[k].label}</span>
                  {m && <span className="font-mono text-[10.5px] text-ink-3">{ELEMENT_LABEL[m.el]}{m.el === 'data' ? ` · cat ${m.cat}` : ''}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {type === 'note' && (
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for the review file"
          className={cn(field, 'resize-y py-2 leading-normal')}
        />
      )}

      <div className="flex items-center gap-1.5 border-t border-line pt-2">
        <span className="mr-auto inline-flex items-center gap-[3px] text-[11px] text-ink-3">
          {type === 'note' ? <><Kbd>{MOD}</Kbd><Kbd>↵</Kbd> to add</> : <><Kbd>↑</Kbd><Kbd>↓</Kbd> choose · <Kbd>↵</Kbd> add</>}
        </span>
        <Button onClick={cancel}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Add to notes</Button>
      </div>
    </motion.div>
  );
}
