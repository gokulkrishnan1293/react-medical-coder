import { memo, type ReactNode } from 'react';
import type { Block as BlockT, BlockKind, Finding, TextSpan } from '@/types';
import { marCells } from '@/data';
import { cn } from '@/lib/utils';
import { segments, tagOf } from '@/features/findings';
import { hoverEvidence, leaveEvidence, pinEvidence } from '../navigation';
import { FlagPins } from '@/features/extraction';

const KIND: Record<BlockKind, string> = {
  org: 'font-semibold tracking-[0.08em]',
  sub: 'text-[11px] leading-[1.6] text-ink-2',
  title: 'mt-4 mb-1.5 border-b-[1.5px] border-ink pb-0.5 font-semibold tracking-[0.03em]',
  meta: 'whitespace-pre-wrap text-xs',
  h: 'mt-4 font-semibold underline decoration-1 underline-offset-4',
  h3: 'mt-3 font-semibold',
  p: '',
  li: 'pl-5 -indent-3.5',
  quote: 'my-1 border-l-2 border-ink-3 pl-3 text-ink-2 italic',
  hr: 'my-3',
  code: 'my-1 rounded bg-chrome px-3 py-1.5 text-xs leading-[1.6] whitespace-pre-wrap',
  marHead: 'mt-2 border-b border-ink/40 text-[10.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase',
  mar: 'pt-[13px] text-xs',
  thead: '',
  tr: '',
};

/** Time · medication · dose · route · given by. */
const MAR_GRID = 'grid grid-cols-[46px_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 leading-[1.5] py-[5px] px-1 max-[760px]:gap-x-1.5';

export interface Marks {
  hotId: string | null;
  activeId: string | null;
  flashId: string | null;
}

interface Props extends Marks {
  b: BlockT;
  fs: Finding[];
}

function evClass(f: Finding, m: Marks) {
  return cn('ev', 'st-' + f.status, m.hotId === f.id && 'hot', m.activeId === f.id && 'active', m.flashId === f.id && 'flash');
}

/** `t.slice(s, e)` with the formatting spans that fall on it: bold, italic, code, strike, links. */
function Rich({ t, s, e, spans }: { t: string; s: number; e: number; spans?: TextSpan[] }) {
  const on = (spans ?? []).filter((sp) => sp.s < e && sp.e > s);
  if (!on.length) return <>{t.slice(s, e)}</>;
  // cut the run wherever a span starts or ends, and wrap each piece in what applies to it
  const cuts = [...new Set([s, e, ...on.flatMap((sp) => [Math.max(s, sp.s), Math.min(e, sp.e)])])].sort((a, b) => a - b);
  const out: ReactNode[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const z = cuts[i + 1];
    if (a === z) continue;
    const here = on.filter((sp) => sp.s <= a && sp.e >= z);
    let node: ReactNode = t.slice(a, z);
    if (here.some((x) => x.code)) node = <code className="rounded bg-chrome-2 px-1 text-[0.92em]">{node}</code>;
    if (here.some((x) => x.strike)) node = <s>{node}</s>;
    if (here.some((x) => x.italic)) node = <em>{node}</em>;
    if (here.some((x) => x.bold)) node = <strong className="font-semibold">{node}</strong>;
    const link = here.find((x) => x.href)?.href;
    if (link) node = <a href={link} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2" onClick={(ev) => ev.stopPropagation()}>{node}</a>;
    out.push(<span key={a}>{node}</span>);
  }
  return <>{out}</>;
}

/**
 * The part of a block between `from` and `to`, with its formatting and the evidence boxes of findings on it.
 * A finding split by a cell edge is boxed in each piece; only its first piece carries its id and tag.
 */
export function Runs({ b, fs, from = 0, to = b.t.length, marks }: { b: BlockT; fs: Finding[]; from?: number; to?: number; marks: Marks }) {
  const out: ReactNode[] = [];
  let c = 0;
  for (const seg of segments(b.t, fs)) {
    const [s, e] = typeof seg === 'string' ? [c, c + seg.length] : [seg.s, seg.e];
    c = e;
    const a = Math.max(s, from);
    const z = Math.min(e, to);
    if (a >= z) continue;
    if (typeof seg === 'string') { out.push(<Rich key={a} t={b.t} s={a} e={z} spans={b.spans} />); continue; }
    const first = seg.s >= from;
    out.push(
      <mark
        key={a}
        id={first ? 'ev-' + seg.f.id : undefined}
        data-tag={first ? tagOf(seg.f) : undefined}
        className={evClass(seg.f, marks)}
        onMouseEnter={() => hoverEvidence(seg.f.id)}
        onMouseLeave={leaveEvidence}
        onClick={() => pinEvidence(seg.f.id)}
      >
        <Rich t={b.t} s={a} e={z} spans={b.spans} />
      </mark>,
    );
  }
  return <>{out}</>;
}

const Cells = ({ t }: { t: string }) => (
  <>{marCells(t).map((c, i) => <span key={i} className="min-w-0 [overflow-wrap:anywhere]">{c}</span>)}</>
);

/** A list item's marker: its number, a bullet, or a checkbox. */
function Marker({ list }: { list: NonNullable<BlockT['list']> }) {
  if (list.checked !== undefined) {
    return <span aria-label={list.checked ? 'Done' : 'Not done'} className="mr-1.5 inline-block w-3.5 text-center text-ink-2">{list.checked ? '☑' : '☐'}</span>;
  }
  return <span aria-hidden className="mr-1.5 inline-block min-w-3.5 text-right text-ink-3">{list.ordered ? `${list.n}.` : list.depth % 2 ? '◦' : '–'}</span>;
}

/** One text block of the record, with its formatting and evidence boxes around finding anchors. MAR rows are boxed whole. */
export const Block = memo(function Block({ b, fs, hotId, activeId, flashId }: Props) {
  const marks = { hotId, activeId, flashId };
  if (b.k === 'marHead' || b.k === 'mar') {
    const f = b.k === 'mar' ? fs.find((x) => x.text === b.t) : undefined;
    return (
      <div className={cn('blk relative', KIND[b.k])} data-block={b.id}>
        <FlagPins block={b.id} />
        {f ? (
          <mark
            id={'ev-' + f.id}
            data-tag={tagOf(f)}
            className={cn(evClass(f, marks), MAR_GRID, 'rounded')}
            onMouseEnter={() => hoverEvidence(f.id)}
            onMouseLeave={leaveEvidence}
            onClick={() => pinEvidence(f.id)}
          >
            <Cells t={b.t} />
          </mark>
        ) : (
          <div className={MAR_GRID}><Cells t={b.t} /></div>
        )}
      </div>
    );
  }
  if (b.k === 'hr') {
    return <div className={cn('blk relative', KIND.hr)} data-block={b.id} role="separator"><hr className="border-t border-line" /></div>;
  }
  return (
    <div
      className={cn('blk relative', KIND[b.k], b.list && 'indent-0 pl-0')}
      style={b.list ? { paddingLeft: `${1.25 + b.list.depth * 1.5}em`, textIndent: '-1.25em' } : undefined}
      data-block={b.id}
    >
      <FlagPins block={b.id} />
      {b.list && <Marker list={b.list} />}
      <Runs b={b} fs={fs} marks={marks} />
    </div>
  );
});

/** Consecutive rows of one table, drawn as a table: header row, body rows, each cell aligned as written. */
export function TableBlock({ rows, byBlock, marks }: { rows: BlockT[]; byBlock: Record<string, Finding[]>; marks: Marks }) {
  // a row spans the table when its cells, with their column spans, add up to the widest row
  const width = Math.max(...rows.map((r) => (r.cells ?? [{ colSpan: 1 }]).reduce((n, c) => n + (c.colSpan ?? 1), 0)));
  // rowspans leave later rows short on purpose, so only pad rows when nothing spans rows
  const pad = !rows.some((r) => r.cells?.some((c) => c.rowSpan));
  return (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs leading-[1.6]">
        <tbody>
          {rows.map((r) => {
            const head = r.k === 'thead';
            const Cell = head ? 'th' : 'td';
            const cells = r.cells ?? [{ s: 0, e: r.t.length }];
            const used = cells.reduce((n, c) => n + (c.colSpan ?? 1), 0);
            const slots = pad ? [...cells, ...Array.from({ length: Math.max(0, width - used) }, () => undefined)] : cells;
            return (
              <tr key={r.id} className="blk relative" data-block={r.id}>
                {slots.map((c, i) => {
                  // an evidence box's tag sits above its words: give the cell room so it clears the row above
                  const boxed = !!c && (byBlock[r.id] ?? []).some((f) => { const j = r.t.indexOf(f.text); return j >= 0 && j < c.e && j + f.text.length > c.s; });
                  return (
                    <Cell
                      key={i}
                      colSpan={c?.colSpan}
                      rowSpan={c?.rowSpan}
                      className={cn('border border-line px-2 py-1 align-top', boxed && 'pt-4', head ? 'bg-chrome font-semibold text-ink' : 'font-normal', c?.colSpan ? 'text-center' : false)}
                      style={c?.align ? { textAlign: c.align } : undefined}
                    >
                      {i === 0 && <FlagPins block={r.id} />}
                      {c && <Runs b={r} fs={byBlock[r.id] ?? []} from={c.s} to={c.e} marks={marks} />}
                    </Cell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
