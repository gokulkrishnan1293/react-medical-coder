import { useState } from 'react';
import type { FindingStatus } from '@/types';
import { cn } from '@/lib/utils';
import { StatusChip, StatusDot } from '@/components/ui';
import { FindingActions, RouteTag, STATUS_LABEL, mdmTag, titleOf, useOrderedFindings } from '@/features/findings';
import { Table, Td, Th } from './Table';

type Filter = 'all' | FindingStatus;

const FILTERS: [Filter, string][] = [['all', 'All'], ['ai', 'AI suggested'], ['confirmed', 'Accepted'], ['added', 'Coder added'], ['rejected', 'Rejected']];

/** Every finding in one table, filterable by status. */
export function FindingsTab({ onJump }: { onJump: (id: string) => void }) {
  const ordered = useOrderedFindings();
  const [filter, setFilter] = useState<Filter>('all');
  const rows = ordered.filter((f) => filter === 'all' || f.status === filter);
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn('inline-flex items-center gap-1.5 rounded-full border bg-paper px-[11px] py-[5px] text-xs', filter === k ? 'border-ink font-semibold' : 'border-line')}
          >
            {k !== 'all' && <StatusDot status={k} />}
            {l}
            <span className="font-mono text-[11px] text-ink-3">{k === 'all' ? ordered.length : ordered.filter((f) => f.status === k).length}</span>
          </button>
        ))}
      </div>
      <Table>
        <thead>
          <tr><Th>Status</Th><Th>Page</Th><Th>Code</Th><Th>Description</Th><Th>Evidence in record</Th><Th>Goes to</Th><Th aria-label="Actions" /></tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} onClick={() => onJump(f.id)} className={cn('cursor-pointer hover:[&>td]:bg-chrome', f.status === 'rejected' && 'text-ink-3')}>
              <Td><StatusChip status={f.status} label={STATUS_LABEL[f.status]} /></Td>
              <Td className="font-mono tabular-nums">{f.page}</Td>
              <Td className="font-mono font-semibold whitespace-nowrap">
                {f.code || mdmTag(f) || f.type.toUpperCase()}
                {f.code && f.mdm && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">{mdmTag(f)}</div>}
              </Td>
              <Td>{titleOf(f)}</Td>
              <Td className="max-w-[300px] font-mono text-[11.5px] text-ink-2">“{f.text}”</Td>
              <Td><RouteTag f={f} /></Td>
              <Td className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}><FindingActions f={f} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
