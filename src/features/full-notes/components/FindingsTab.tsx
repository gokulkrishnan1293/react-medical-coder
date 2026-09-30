import { useState } from 'react';
import type { Finding, FindingStatus, FindingType } from '@/types';
import { cn } from '@/lib/utils';
import { HoverTip, StatusChip, StatusDot } from '@/components/ui';
import { Table, Td, Th } from '@/components/ui/Table';
import { CommentField, FindingActions, MarDetail, RouteTag, STATUS_LABEL, TYPE_LABEL, TypeBadge, claimLocked, groupPlaces, reasonOf, titleOf, useOrderedFindings } from '@/features/findings';
import { CodeCell } from './CodeCell';
import { Icon } from '@/components/ui';
import { startRebind } from '@/features/add-finding';

const TYPES: FindingType[] = ['dx', 'svc', 'mar', 'doc', 'note'];
const STATUSES: FindingStatus[] = ['ai', 'confirmed', 'added', 'rejected'];

const chip = (on: boolean) => cn('inline-flex items-center gap-1.5 rounded-full border bg-paper px-[11px] py-[5px] text-xs', on ? 'border-ink font-semibold' : 'border-line');
const count = 'font-mono text-[11px] text-ink-3';

/**
 * Full view of every finding: filter by type and status, see evidence, AI confidence and details, comment.
 * The places documenting one code share a row: its pages are listed, each previewing its evidence on hover
 * and going there on click. Codes not on the claim can be changed in place; codes on the claim are locked.
 */
export function FindingsTab({ onJump }: { onJump: (id: string) => void }) {
  const all = groupPlaces(useOrderedFindings());
  const [type, setType] = useState<FindingType | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const byType = all.filter(({ lead }) => type === 'all' || lead.type === type);
  const rows = byType.filter(({ lead }) => status === 'all' || lead.status === status);
  const types = TYPES.filter((t) => all.some(({ lead }) => lead.type === t));

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 w-12 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Type</span>
        <button className={chip(type === 'all')} onClick={() => setType('all')}>All <span className={count}>{all.length}</span></button>
        {types.map((t) => (
          <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
            {TYPE_LABEL[t]} <span className={count}>{all.filter(({ lead }) => lead.type === t).length}</span>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <label htmlFor="status-filter" className="mr-1 w-12 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Status</label>
        <div className="relative inline-flex items-center">
          {status !== 'all' && <StatusDot status={status} className="pointer-events-none absolute left-[11px]" />}
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as FindingStatus | 'all')}
            className={cn(
              'appearance-none rounded-full border bg-paper py-[5px] pr-8 text-xs outline-none focus-visible:border-accent',
              status === 'all' ? 'border-line pl-[11px]' : 'border-ink pl-[26px] font-semibold',
            )}
          >
            <option value="all">All statuses ({byType.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]} ({byType.filter(({ lead }) => lead.status === s).length})</option>
            ))}
          </select>
          <Icon.down size={12} className="pointer-events-none absolute right-[11px] text-ink-3" />
        </div>
        {status !== 'all' && (
          <button onClick={() => setStatus('all')} className="text-xs text-ink-3 underline-offset-2 hover:text-ink hover:underline">Clear</button>
        )}
      </div>
      <Table>
        <thead>
          <tr><Th>Type · status</Th><Th>Page</Th><Th>Code</Th><Th>Description</Th><Th>Evidence in record</Th><Th>AI confidence</Th><Th>Goes to</Th><Th className="w-[220px]">Comment</Th><Th aria-label="Actions" /></tr>
        </thead>
        <tbody>
          {rows.map(({ lead: f, places }) => (
            <tr key={f.id} onClick={() => onJump(f.id)} className={cn('cursor-pointer hover:[&>td]:bg-chrome', f.status === 'rejected' && 'text-ink-3')}>
              <Td><span className="flex items-center gap-1.5 whitespace-nowrap"><TypeBadge type={f.type} /><StatusChip status={f.status} label={STATUS_LABEL[f.status]} /></span></Td>
              <Td onClick={(e) => e.stopPropagation()}><PageList places={places} onJump={onJump} /></Td>
              <Td><CodeCell f={f} /></Td>
              <Td>
                {titleOf(f)}
                {reasonOf(f, places) && <div className="mt-0.5 text-[11.5px] text-ink-3">{reasonOf(f, places)}</div>}
              </Td>
              <Td className="group/ev max-w-[260px] font-mono text-[11.5px] text-ink-2">
                {f.mar ? <MarDetail mar={f.mar} /> : <>“{f.text}”</>}
                {places.length > 1 && <div className="mt-0.5 font-sans text-[11px] text-ink-3">+{places.length - 1} more {places.length === 2 ? 'place' : 'places'}: hover a page</div>}
                {f.status !== 'rejected' && !claimLocked(f) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startRebind(f.id); }}
                    className="mt-1 flex items-center gap-1 font-sans text-[11px] font-medium text-ink-3 opacity-0 group-hover/ev:opacity-100 hover:text-accent focus-visible:opacity-100"
                  >
                    <Icon.pencil size={11} />Change evidence
                  </button>
                )}
              </Td>
              <Td><Confidence f={f} /></Td>
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

/** How sure the AI was of a suggestion. Coder-added findings have none. */
function Confidence({ f }: { f: Finding }) {
  if (f.source !== 'ai' || f.conf === undefined) return <span className="text-ink-3">—</span>;
  const pct = Math.round(f.conf * 100);
  return (
    <div className="flex items-center gap-1.5" title={f.editedFrom ? `AI was ${pct}% sure of ${f.editedFrom}` : undefined}>
      <span className="h-1 w-10 overflow-hidden rounded-full bg-chrome-2">
        <span className={cn('block h-full rounded-full', pct >= 90 ? 'bg-ok' : pct >= 80 ? 'bg-ai' : 'bg-add')} style={{ width: pct + '%' }} />
      </span>
      <span className="font-mono text-[11.5px] tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * The pages a code is documented on, as a row of numbers. Hover one to read its evidence; click to go there.
 * A dropped place stays listed, struck through.
 */
function PageList({ places, onJump }: { places: Finding[]; onJump: (id: string) => void }) {
  const pages = [...new Set(places.map((p) => p.page))];
  return (
    <div className="flex gap-1">
      {pages.map((n) => {
        const here = places.filter((p) => p.page === n);
        const open = here.find((p) => p.status !== 'rejected') ?? here[0];
        const dropped = here.every((p) => p.status === 'rejected');
        return (
          <HoverTip
            key={n}
            tip={
              <>
                <span className="block font-semibold">Page {n}{here.length > 1 ? ` · ${here.length} places` : ''}</span>
                {here.map((p) => (
                  <span key={p.id} className="mt-1 block">
                    <span className="font-mono text-[11px]">“{p.text}”</span>
                    <span className="block text-[11px] opacity-75">{STATUS_LABEL[p.status]}{p.source === 'ai' && p.conf ? ` · ${Math.round(p.conf * 100)}%` : ''}</span>
                  </span>
                ))}
              </>
            }
          >
            <button
              type="button"
              onClick={() => onJump(open.id)}
              aria-label={`Go to page ${n}`}
              className={cn(
                'st-' + open.status,
                'min-w-[26px] rounded-md border border-st/40 bg-st-fill px-1.5 py-0.5 font-mono text-[11.5px] font-semibold tabular-nums hover:border-st',
                dropped && 'line-through opacity-60',
              )}
            >
              {n}
            </button>
          </HoverTip>
        );
      })}
    </div>
  );
}
