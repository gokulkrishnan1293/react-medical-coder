import { useState } from 'react';
import type { FindingStatus, FindingType } from '@/types';
import { cn } from '@/lib/utils';
import { StatusChip, StatusDot } from '@/components/ui';
import { Table, Td, Th } from '@/components/ui/Table';
import { CommentField, FindingActions, MarDetail, RouteTag, STATUS_LABEL, TYPE_LABEL, TypeBadge, codeLabel, mdmTag, titleOf, useOrderedFindings } from '@/features/findings';

const TYPES: FindingType[] = ['dx', 'svc', 'mar', 'intervention', 'mdm', 'note'];
const STATUSES: FindingStatus[] = ['ai', 'confirmed', 'added', 'rejected'];

const chip = (on: boolean) => cn('inline-flex items-center gap-1.5 rounded-full border bg-paper px-[11px] py-[5px] text-xs', on ? 'border-ink font-semibold' : 'border-line');
const count = 'font-mono text-[11px] text-ink-3';

/** Full view of every finding: filter by type and status, see evidence and details, comment. */
export function FindingsTab({ onJump }: { onJump: (id: string) => void }) {
  const ordered = useOrderedFindings();
  const [type, setType] = useState<FindingType | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const byType = ordered.filter((f) => type === 'all' || f.type === type);
  const rows = byType.filter((f) => status === 'all' || f.status === status);
  const types = TYPES.filter((t) => ordered.some((f) => f.type === t));

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 w-12 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Type</span>
        <button className={chip(type === 'all')} onClick={() => setType('all')}>All <span className={count}>{ordered.length}</span></button>
        {types.map((t) => (
          <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
            {TYPE_LABEL[t]} <span className={count}>{ordered.filter((f) => f.type === t).length}</span>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 w-12 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Status</span>
        <button className={chip(status === 'all')} onClick={() => setStatus('all')}>All <span className={count}>{byType.length}</span></button>
        {STATUSES.map((s) => (
          <button key={s} className={chip(status === s)} onClick={() => setStatus(s)}>
            <StatusDot status={s} />{STATUS_LABEL[s]} <span className={count}>{byType.filter((f) => f.status === s).length}</span>
          </button>
        ))}
      </div>
      <Table>
        <thead>
          <tr><Th>Type</Th><Th>Status</Th><Th>Pg</Th><Th>Code</Th><Th>Description</Th><Th>Evidence in record</Th><Th>Goes to</Th><Th className="w-[220px]">Comment</Th><Th aria-label="Actions" /></tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} onClick={() => onJump(f.id)} className={cn('cursor-pointer hover:[&>td]:bg-chrome', f.status === 'rejected' && 'text-ink-3')}>
              <Td><TypeBadge type={f.type} /></Td>
              <Td><StatusChip status={f.status} label={STATUS_LABEL[f.status]} /></Td>
              <Td className="font-mono tabular-nums">{f.page}</Td>
              <Td className="font-mono font-semibold whitespace-nowrap">
                {codeLabel(f)}
                {f.code && f.mdm && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">{mdmTag(f)}</div>}
                {f.replaces && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">replaces {f.replaces}</div>}
              </Td>
              <Td>
                {titleOf(f)}
                {f.note && f.type !== 'note' && <div className="mt-0.5 text-[11.5px] text-ink-3">{f.note}</div>}
              </Td>
              <Td className="max-w-[260px] font-mono text-[11.5px] text-ink-2">
                {f.mar ? <MarDetail mar={f.mar} /> : <>“{f.text}”</>}
              </Td>
              <Td><RouteTag f={f} /></Td>
              <Td onClick={(e) => e.stopPropagation()}><CommentField f={f} rows={1} /></Td>
              <Td className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}><FindingActions f={f} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
