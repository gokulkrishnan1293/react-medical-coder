import { useEffect, useMemo, useRef, useState } from 'react';
import type { CodeKind, Finding } from '@/types';
import { CLAIM_CODES } from '@/data';
import { cn } from '@/lib/utils';
import { useFindingsStore } from '@/features/findings';
import { searchCodes } from '../utils/codeSearch';

const KIND: Partial<Record<Finding['type'], CodeKind>> = { dx: 'dx', svc: 'svc', mar: 'drug' };

/** The code system a finding's code comes from, if it has one that can be searched. */
export const codeKindOf = (f: Finding) => KIND[f.type];

/** Search box that replaces a finding's code; the list floats below it. Enter picks, Esc or blur cancels. */
export function CodePicker({ f, kind, onDone, className }: { f: Finding; kind: CodeKind; onDone: () => void; className?: string }) {
  const editCode = useFindingsStore((s) => s.editCode);
  const [q, setQ] = useState(f.code ?? f.desc ?? '');
  const [pick, setPick] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchCodes(q, kind), [q, kind]);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    const r = input.current?.getBoundingClientRect();
    if (r) setPos({ left: r.left, top: r.bottom + 4 });
    // the list floats over the table, so it cannot follow a scroll: close instead
    const close = () => done.current();
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, []);
  useEffect(() => setPick(0), [q]);

  const choose = (i: number) => {
    const o = results[i];
    if (o) editCode(f.id, o.code, o.per ? `${o.desc}, per ${o.per}` : o.desc);
    onDone();
  };

  return (
    <>
      <input
        ref={input}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={onDone}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onDone(); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setPick((p) => Math.min(p + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setPick((p) => Math.max(p - 1, 0)); }
          if (e.key === 'Enter') { e.preventDefault(); choose(pick); }
        }}
        aria-label="Search codes"
        className={cn('w-[120px] rounded-md border border-accent bg-paper px-1.5 py-0.5 font-mono text-[12px] outline-none', className)}
      />
      {pos && (
        <div
          role="listbox"
          className="fixed z-90 flex w-[360px] flex-col gap-px rounded-lg border border-line bg-paper p-1 shadow-float"
          style={pos}
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((o, i) => (
            <button
              key={o.code}
              role="option"
              aria-selected={i === pick}
              onMouseEnter={() => setPick(i)}
              onClick={() => choose(i)}
              className={cn('grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-[7px] py-1.5 text-left', i === pick && 'bg-accent-soft')}
            >
              <span className="font-mono text-[11.5px] font-semibold text-accent">{o.code}</span>
              <span className="text-[12px] leading-snug">{o.desc}{o.per && <span className="text-ink-3">, per {o.per}</span>}</span>
              {CLAIM_CODES.has(o.code) && <span className="rounded border border-line px-[5px] py-px text-[10px] text-ink-3">on claim</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
