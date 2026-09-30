import { useMemo, useState } from 'react';
import { BLOCKS } from '@/data';
import { Button, Icon, IconButton } from '@/components/ui';
import { Table, Td, Th } from '@/components/ui/Table';
import { useReadOnly } from '@/features/findings';
import { KIND_LABEL, goToFlag, useExtractionStore } from '../store';
import { EXTRACTION_NOTE } from './ExtractionPanel';
import { downloadJson, downloadPdf } from '../report';

/** Full notes: every extraction flag as a table, for handing back to whoever maintains the extraction. */
export function ExtractionTab({ onClose }: { onClose: () => void }) {
  const flags = useExtractionStore((s) => s.flags);
  const remove = useExtractionStore((s) => s.remove);
  const readOnly = useReadOnly();
  const sorted = useMemo(() => [...flags].sort((a, b) => a.page - b.page || (BLOCKS[a.block ?? '']?.idx ?? 0) - (BLOCKS[b.block ?? '']?.idx ?? 0)), [flags]);
  const count = (k: string) => flags.filter((f) => f.kind === k).length;
  const [busy, setBusy] = useState<'pdf' | 'json' | null>(null);
  const run = (kind: 'pdf' | 'json') => {
    setBusy(kind);
    (kind === 'pdf' ? downloadPdf(flags) : downloadJson(flags)).finally(() => setBusy(null));
  };
  return (
    <>
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <p className="max-w-[80ch] flex-1 text-[12.5px] leading-normal text-ink-2">
          {flags.length ? `${count('formatting')} formatting, ${count('data')} wrong data, ${count('missing')} missed content. ` : 'Nothing flagged yet. '}
          {EXTRACTION_NOTE}
        </p>
        {/* a report to hand on: the PDF for people, the JSON for tools; each flag with its screenshot, if any */}
        <div className="flex gap-1.5">
          <Button onClick={() => run('pdf')} disabled={!flags.length || !!busy} title="Each flag with what was extracted, what the original shows, and its screenshot" className="disabled:opacity-50">
            <Icon.notes size={14} />{busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
          </Button>
          <Button onClick={() => run('json')} disabled={!flags.length || !!busy} title="The flags as data, with their screenshots as images" className="disabled:opacity-50">
            <Icon.copy size={14} />{busy === 'json' ? 'Preparing…' : 'Download JSON'}
          </Button>
        </div>
      </div>
      {sorted.length > 0 && (
        <Table>
          <thead><tr><Th>Kind</Th><Th>Page</Th><Th>Extracted text</Th><Th>Original shows</Th><Th>Comment</Th><Th>Screenshot</Th><Th>Flagged</Th><Th aria-label="Actions" /></tr></thead>
          <tbody>
            {sorted.map((f) => (
              <tr key={f.id} onClick={() => { onClose(); setTimeout(() => goToFlag(f), 60); }} className="cursor-pointer hover:[&>td]:bg-chrome">
                <Td><span className="inline-flex items-center gap-1.5 rounded bg-flag-fill px-1.5 py-[3px] text-[11px] leading-none font-semibold whitespace-nowrap text-flag"><Icon.flag size={11} />{KIND_LABEL[f.kind]}</span></Td>
                <Td className="font-mono tabular-nums">{f.page}</Td>
                <Td className="max-w-[300px] font-mono text-[11.5px]">{f.text ? `“${f.text}”` : <span className="font-sans text-ink-3">Missing near “{f.near}…”</span>}</Td>
                <Td className="max-w-[260px] font-mono text-[11.5px]">{f.shouldRead ?? <span className="text-ink-3">—</span>}</Td>
                <Td className="max-w-[240px] text-[12px] text-ink-2">{f.comment ?? <span className="text-ink-3">—</span>}</Td>
                <Td>{f.screenshot ? <img src={f.screenshot} alt="Screenshot" className="h-12 max-w-[120px] rounded border border-line object-cover object-top" /> : <span className="text-ink-3">—</span>}</Td>
                <Td className="text-[11.5px] whitespace-nowrap text-ink-3">{new Date(f.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  {!readOnly && <IconButton size="sm" tone="no" onClick={() => remove(f.id)} aria-label="Remove flag" title="Remove"><Icon.trash size={13} /></IconButton>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
