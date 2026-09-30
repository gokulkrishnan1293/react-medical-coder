import { Fragment, memo } from 'react';
import type { Block as BlockT, BlockKind, Finding } from '@/types';
import { cn } from '@/lib/utils';
import { segments, tagOf } from '@/features/findings';
import { hoverEvidence, leaveEvidence, pinEvidence } from '../navigation';

const KIND: Record<BlockKind, string> = {
  org: 'font-semibold tracking-[0.08em]',
  sub: 'text-[11px] leading-[1.6] text-ink-2',
  title: 'mt-4 mb-1.5 border-b-[1.5px] border-ink pb-0.5 font-semibold tracking-[0.03em]',
  meta: 'whitespace-pre-wrap text-xs',
  h: 'mt-4 font-semibold underline decoration-1 underline-offset-4',
  p: '',
  li: "pl-5 -indent-3.5 before:text-ink-3 before:content-['–__']",
};

interface Props {
  b: BlockT;
  fs: Finding[];
  hotId: string | null;
  activeId: string | null;
  flashId: string | null;
}

/** One text block of the record, with evidence boxes drawn around finding anchors. */
export const Block = memo(function Block({ b, fs, hotId, activeId, flashId }: Props) {
  return (
    <div className={cn('blk relative', KIND[b.k])} data-block={b.id}>
      {segments(b.t, fs).map((s, i) =>
        typeof s === 'string' ? (
          <Fragment key={i}>{s}</Fragment>
        ) : (
          <mark
            key={s.f.id}
            id={'ev-' + s.f.id}
            data-tag={tagOf(s.f)}
            className={cn('ev', 'st-' + s.f.status, hotId === s.f.id && 'hot', activeId === s.f.id && 'active', flashId === s.f.id && 'flash')}
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
