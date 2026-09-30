import { Fragment, memo } from 'react';
import type { Block as BlockT, BlockKind, Finding } from '@/types';
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
  p: '',
  li: "pl-5 -indent-3.5 before:text-ink-3 before:content-['–__']",
  marHead: 'mt-2 border-b border-ink/40 text-[10.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase',
  mar: 'pt-[13px] text-xs',
};

/** Time · medication · dose · route · given by. */
const MAR_GRID = 'grid grid-cols-[46px_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 leading-[1.5] py-[5px] px-1 max-[760px]:gap-x-1.5';

interface Props {
  b: BlockT;
  fs: Finding[];
  hotId: string | null;
  activeId: string | null;
  flashId: string | null;
}

function evClass(f: Finding, hotId: string | null, activeId: string | null, flashId: string | null) {
  return cn('ev', 'st-' + f.status, hotId === f.id && 'hot', activeId === f.id && 'active', flashId === f.id && 'flash');
}

const Cells = ({ t }: { t: string }) => (
  <>{marCells(t).map((c, i) => <span key={i} className="min-w-0 [overflow-wrap:anywhere]">{c}</span>)}</>
);

/** One text block of the record, with evidence boxes drawn around finding anchors. MAR rows are boxed whole. */
export const Block = memo(function Block({ b, fs, hotId, activeId, flashId }: Props) {
  if (b.k === 'marHead' || b.k === 'mar') {
    const f = b.k === 'mar' ? fs.find((x) => x.text === b.t) : undefined;
    return (
      <div className={cn('blk relative', KIND[b.k])} data-block={b.id}>
        <FlagPins block={b.id} />
        {f ? (
          <mark
            id={'ev-' + f.id}
            data-tag={tagOf(f)}
            className={cn(evClass(f, hotId, activeId, flashId), MAR_GRID, 'rounded')}
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
  return (
    <div className={cn('blk relative', KIND[b.k])} data-block={b.id}>
      <FlagPins block={b.id} />
      {segments(b.t, fs).map((s, i) =>
        typeof s === 'string' ? (
          <Fragment key={i}>{s}</Fragment>
        ) : (
          <mark
            key={s.f.id}
            id={'ev-' + s.f.id}
            data-tag={tagOf(s.f)}
            className={evClass(s.f, hotId, activeId, flashId)}
            onMouseEnter={() => hoverEvidence(s.f.id)}
            onMouseLeave={leaveEvidence}
            onClick={() => pinEvidence(s.f.id)}
          >
            {b.t.slice(s.s, s.e)}
          </mark>
        ),
      )}
    </div>
  );
});
