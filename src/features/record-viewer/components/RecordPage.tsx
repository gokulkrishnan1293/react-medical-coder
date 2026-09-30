import type { Block as BlockT, Finding, RecordPage as Page } from '@/types';
import { PAGES, PRINT_FOOTER } from '@/data';
import { useUiStore } from '@/stores/uiStore';
import { Block, TableBlock, type Marks } from './Block';

/** Blocks in order, with the rows of each table drawn as one table. */
function Blocks({ blocks, byBlock, marks }: { blocks: BlockT[]; byBlock: Record<string, Finding[]>; marks: Marks }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if ((b.k === 'thead' || b.k === 'tr') && b.table) {
      const rows = [b];
      while (blocks[i + 1]?.table === b.table) rows.push(blocks[++i]);
      out.push(<TableBlock key={b.id} rows={rows} byBlock={byBlock} marks={marks} />);
    } else {
      out.push(<Block key={b.id} b={b} fs={byBlock[b.id] ?? []} {...marks} />);
    }
  }
  return <>{out}</>;
}

/** Blocks laid out in columns side by side, as the original's multi-column sections are. */
function Columns({ blocks, byBlock, marks }: { blocks: BlockT[]; byBlock: Record<string, Finding[]>; marks: Marks }) {
  const of = blocks[0].cols!.of;
  return (
    <div className="my-1 grid gap-x-8 max-[760px]:grid-cols-1" style={{ gridTemplateColumns: `repeat(${of}, minmax(0, 1fr))` }}>
      {Array.from({ length: of }, (_, col) => (
        <div key={col} className="min-w-0">
          <Blocks blocks={blocks.filter((b) => b.cols!.col === col)} byBlock={byBlock} marks={marks} />
        </div>
      ))}
    </div>
  );
}

/** A record page drawn as paper, with EHR print footer. */
export function RecordPage({ page, byBlock }: { page: Page; byBlock: Record<string, Finding[]> }) {
  const hoverId = useUiStore((s) => s.hoverId);
  const activeId = useUiStore((s) => s.activeId);
  const flashId = useUiStore((s) => s.flashId);
  const marks = { hotId: hoverId, activeId, flashId };
  // runs of blocks: in the page's normal flow, or in one column group
  const runs: { group: string | null; blocks: BlockT[] }[] = [];
  for (const b of page.blocks) {
    const g = b.cols?.group ?? null;
    const last = runs[runs.length - 1];
    if (last && last.group === g) last.blocks.push(b);
    else runs.push({ group: g, blocks: [b] });
  }
  return (
    <section
      id={'page-' + page.n}
      data-page={page.n}
      aria-label={`Page ${page.n}`}
      className="page relative rounded-[2px] bg-paper px-[66px] pt-[60px] pb-[70px] font-mono text-[13px] leading-[2.5] text-ink shadow-page aspect-[8.5/11] max-[760px]:aspect-auto max-[760px]:px-[18px] max-[760px]:pt-[50px] max-[760px]:pb-[60px] max-[760px]:text-xs max-[760px]:leading-[2.2]"
    >
      <div>
        {runs.map((r) => (r.group
          ? <Columns key={r.blocks[0].id} blocks={r.blocks} byBlock={byBlock} marks={marks} />
          : <Blocks key={r.blocks[0].id} blocks={r.blocks} byBlock={byBlock} marks={marks} />))}
      </div>
      <div className="absolute right-[66px] bottom-[22px] left-[66px] flex justify-between gap-3 border-t border-dashed border-line pt-[7px] text-[10px] leading-[1.4] text-ink-3 max-[760px]:right-[18px] max-[760px]:left-[18px]">
        <span>{PRINT_FOOTER}</span>
        <span>Page {page.n} of {PAGES.length}</span>
      </div>
    </section>
  );
}
