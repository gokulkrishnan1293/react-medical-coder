import type { Finding, RecordPage as Page } from '@/types';
import { PAGES, PRINT_FOOTER } from '@/data';
import { useUiStore } from '@/stores/uiStore';
import { Block } from './Block';

/** A record page drawn as paper, with EHR print footer. */
export function RecordPage({ page, byBlock }: { page: Page; byBlock: Record<string, Finding[]> }) {
  const hoverId = useUiStore((s) => s.hoverId);
  const activeId = useUiStore((s) => s.activeId);
  const flashId = useUiStore((s) => s.flashId);
  return (
    <section
      id={'page-' + page.n}
      data-page={page.n}
      aria-label={`Page ${page.n}`}
      className="page relative rounded-[2px] bg-paper px-[66px] pt-[60px] pb-[70px] font-mono text-[13px] leading-[2.5] text-ink shadow-page aspect-[8.5/11] max-[760px]:aspect-auto max-[760px]:px-[18px] max-[760px]:pt-[50px] max-[760px]:pb-[60px] max-[760px]:text-xs max-[760px]:leading-[2.2]"
    >
      <div>
        {page.blocks.map((b) => (
          <Block key={b.id} b={b} fs={byBlock[b.id] ?? []} hotId={hoverId} activeId={activeId} flashId={flashId} />
        ))}
      </div>
      <div className="absolute right-[66px] bottom-[22px] left-[66px] flex justify-between gap-3 border-t border-dashed border-line pt-[7px] text-[10px] leading-[1.4] text-ink-3 max-[760px]:right-[18px] max-[760px]:left-[18px]">
        <span>{PRINT_FOOTER}</span>
        <span>Page {page.n} of {PAGES.length}</span>
      </div>
    </section>
  );
}
