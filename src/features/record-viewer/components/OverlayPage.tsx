import { memo } from 'react';
import type { Finding, RecordPage as Page } from '@/types';
import { BLOCKS, PAGE_H, PAGE_IMAGES, PAGE_LAYOUT, PAGE_W, SCAN_FONT, type LayoutLine } from '@/data';
import { cn } from '@/lib/utils';
import { segments, tagOf } from '@/features/findings';
import { useUiStore } from '@/stores/uiStore';
import { hoverEvidence, leaveEvidence, pinEvidence } from '../navigation';

/** Where the baseline sits in a Courier line box at line-height 1, in em. */
const BASELINE = 0.766;

interface Props { page: Page; byBlock: Record<string, Finding[]> }

/**
 * A record page drawn on the scan's own line boxes, with the scan laid over it up to the divider.
 * Left of the divider is the original; right of it is the extracted text, word for word in the same place.
 */
export function OverlayPage({ page, byBlock }: Props) {
  const divider = useUiStore((s) => (s.peek ? 1 : s.divider));
  const hoverId = useUiStore((s) => s.hoverId);
  const activeId = useUiStore((s) => s.activeId);
  const flashId = useUiStore((s) => s.flashId);
  return (
    <section
      id={'page-' + page.n}
      data-page={page.n}
      aria-label={`Page ${page.n}`}
      className="page ov relative rounded-[2px] bg-paper text-ink shadow-page [container-type:inline-size]"
      style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, fontFamily: SCAN_FONT }}
    >
      {PAGE_LAYOUT[page.n].map((l, i) => (
        <Line key={i} l={l} fs={byBlock[l.block] ?? []} hotId={hoverId} activeId={activeId} flashId={flashId} />
      ))}
      <img
        src={PAGE_IMAGES[page.n]}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full rounded-[2px] select-none"
        style={{ clipPath: `inset(0 ${(1 - divider) * 100}% 0 0)` }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-accent" style={{ left: divider * 100 + '%' }} />
    </section>
  );
}

interface LineProps {
  l: LayoutLine;
  fs: Finding[];
  hotId: string | null;
  activeId: string | null;
  flashId: string | null;
}

/** One line of extracted text, placed on its OCR box, with the parts of evidence boxes that fall on it. */
const Line = memo(function Line({ l, fs, hotId, activeId, flashId }: LineProps) {
  const b = BLOCKS[l.block];
  const end = l.start + l.text.length;
  const parts: Array<string | { s: number; e: number; f: Finding; first: boolean }> = [];
  const segs = b.k === 'mar'
    ? (fs.find((f) => f.text === b.t) ? [{ s: 0, e: b.t.length, f: fs.find((f) => f.text === b.t)! }] : [b.t])
    : segments(b.t, fs);
  let c = 0;
  for (const s of segs) {
    const [ss, se] = typeof s === 'string' ? [c, c + s.length] : [s.s, s.e];
    c = se;
    const a = Math.max(ss, l.start);
    const z = Math.min(se, end);
    if (a >= z) continue;
    parts.push(typeof s === 'string' ? b.t.slice(a, z) : { s: a, e: z, f: s.f, first: s.s >= l.start });
  }
  return (
    <div
      className={cn('blk absolute leading-none whitespace-pre', b.k === 'marHead' && 'text-ink-2')}
      data-block={b.id}
      style={{
        left: (l.x / PAGE_W) * 100 + '%',
        top: ((l.y - BASELINE * l.size) / PAGE_H) * 100 + '%',
        fontSize: (l.size / PAGE_W) * 100 + 'cqw',
        fontWeight: l.bold ? 700 : undefined,
        transform: l.center ? 'translateX(-50%)' : undefined,
      }}
    >
      {l.bullet && <span aria-hidden className="absolute select-none" style={{ left: (l.bullet.x - l.x) / l.size + 'em' }}>-</span>}
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <mark
            key={i}
            id={p.first ? 'ev-' + p.f.id : undefined}
            data-tag={p.first ? tagOf(p.f) : undefined}
            className={cn('ev', 'st-' + p.f.status, hotId === p.f.id && 'hot', activeId === p.f.id && 'active', flashId === p.f.id && 'flash', !p.first && 'cont')}
            onMouseEnter={() => hoverEvidence(p.f.id)}
            onMouseLeave={leaveEvidence}
            onClick={() => pinEvidence(p.f.id)}
          >
            {b.t.slice(p.s, p.e)}
          </mark>
        ),
      )}
    </div>
  );
});
