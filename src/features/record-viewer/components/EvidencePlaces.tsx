import { useMemo } from 'react';
import type { Finding } from '@/types';
import { cn } from '@/lib/utils';
import { Icon, IconButton } from '@/components/ui';
import { STATUS_LABEL, claimLocked, placesOf, reasonOf, useFindings, useFindingsStore, useReadOnly } from '@/features/findings';
import { startRebind } from '@/features/add-finding';
import { useUiStore } from '@/stores/uiStore';
import { jumpTo } from '../navigation';
import { RevisedEvidence } from './RevisedEvidence';

/* Tree branch drawn to the left of each row: an elbow into the row, and the trunk carrying on to the next one. */
const ELBOW = "before:absolute before:top-0 before:-left-3 before:h-[15px] before:w-2.5 before:rounded-bl-md before:border-b before:border-l before:border-line before:content-['']";
const TRUNK = "after:absolute after:top-0 after:bottom-0 after:-left-3 after:border-l after:border-line after:content-['']";

/**
 * Every place the record documents this code: the pages as a row of chips, then each place as a branch off
 * the finding, the one open highlighted. The code is accepted or rejected as a whole from the card; a single
 * place that does not document it can be dropped here, and the coder can tag another place.
 * Hover a branch to see its box in the record; click it or a page to go there.
 */
export function EvidencePlaces({ f }: { f: Finding }) {
  const findings = useFindings();
  const places = useMemo(() => placesOf(f, findings), [f, findings]);
  const why = reasonOf(f, places);
  const setPlaceStatus = useFindingsStore((s) => s.setPlaceStatus);
  const setUi = useUiStore((s) => s.set);
  const pages = [...new Set(places.filter((p) => p.status !== 'rejected').map((p) => p.page))];
  // on the claim the evidence stays as found: no moving it and no new places, only comments
  const readOnly = useReadOnly();
  const locked = claimLocked(f) || readOnly;
  const canTag = f.status !== 'rejected' && !locked;
  const goPage = (n: number) => {
    const at = places.find((p) => p.page === n && p.status !== 'rejected');
    if (at && at.id !== f.id) jumpTo(at.id);
  };

  return (
    <div className="mt-2.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Evidence</span>
        <span className="mr-0.5 text-[11px] text-ink-3">{pages.length === 1 ? 'Page' : 'Pages'}</span>
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => goPage(n)}
            title={n === f.page ? 'This page' : `Go to page ${n}`}
            className={cn(
              'rounded-md border px-1.5 py-px font-mono text-[11px] font-semibold',
              n === f.page ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink',
            )}
          >
            {n}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10.5px] text-ink-3">{places.length} {places.length === 1 ? 'place' : 'places'}</span>
      </div>
      <ul className="ml-2 pl-3" onMouseLeave={() => setUi({ hoverId: null })}>
        {places.map((p) => {
          const current = p.id === f.id;
          return (
            <li key={p.id} className={cn('relative pb-1', ELBOW, TRUNK)}>
              <div
                className={cn(
                  'st-' + p.status,
                  'group/place flex items-start gap-2 rounded-md border px-2 py-1.5',
                  current ? 'border-st bg-st-fill' : 'border-transparent hover:border-line hover:bg-chrome',
                  p.status === 'rejected' && 'opacity-55',
                )}
                onMouseEnter={() => setUi({ hoverId: p.id })}
              >
                <span className="mt-[5px] size-[7px] flex-none rounded-full bg-st" title={STATUS_LABEL[p.status]} />
                <button
                  type="button"
                  aria-current={current || undefined}
                  onClick={() => { if (!current) jumpTo(p.id); }}
                  title={current ? undefined : `Go to page ${p.page}`}
                  className={cn('min-w-0 flex-1 text-left', current && 'cursor-default')}
                >
                  <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                    <span className="font-mono">p. {p.page}</span>
                    {current ? <span className="font-medium text-ink-2">This one</span> : <span className="text-st">{STATUS_LABEL[p.status]}</span>}
                    {p.source === 'ai' && p.conf && <span className="font-mono">{Math.round(p.conf * 100)}%</span>}
                    <RevisedEvidence f={p} inButton />
                  </span>
                  <span className={cn('mt-0.5 block font-mono text-[11.5px] leading-snug text-ink', !current && 'line-clamp-2', p.status === 'rejected' && 'line-through')}>
                    “{p.text}”
                  </span>
                  {p.note && p.note !== why && <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">{p.note}</span>}
                  {!current && p.comment && <span className="mt-1 block border-l-2 border-line pl-1.5 text-[11px] leading-snug text-ink-2 italic">{p.comment}</span>}
                </button>
                {current && p.status !== 'rejected' && !locked && (
                  <button
                    type="button"
                    onClick={() => startRebind(p.id)}
                    title="Select different words in the record for this place"
                    className="inline-flex flex-none items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium text-ink-2 hover:bg-paper hover:text-ink"
                  >
                    <Icon.pencil size={12} />Change
                  </button>
                )}
                {!current && !readOnly && p.source === 'ai' && p.status !== 'rejected' && (
                  <IconButton
                    size="sm"
                    tone="no"
                    title="Not evidence for this code: drop this place only"
                    aria-label={`Drop page ${p.page} place`}
                    className="opacity-0 group-hover/place:opacity-100 focus-visible:opacity-100"
                    onClick={() => setPlaceStatus(p.id, 'rejected')}
                  >
                    <Icon.close size={13} />
                  </IconButton>
                )}
                {!current && !readOnly && p.status === 'rejected' && p.source === 'ai' && (
                  <IconButton size="sm" title="Restore this place" aria-label={`Restore page ${p.page} place`} onClick={() => setPlaceStatus(p.id, 'ai')}><Icon.undo size={13} /></IconButton>
                )}
              </div>
            </li>
          );
        })}
        {canTag && (
          <li className={cn('relative', ELBOW)}>
            <button
              type="button"
              onClick={() => startRebind(f.id, 'add')}
              title="Select other words in the record that document this code"
              className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-line px-2 py-1.5 text-left text-[12px] font-medium text-ink-2 hover:border-accent hover:bg-accent-soft hover:text-accent"
            >
              <span className="text-[13px] leading-none">+</span>Tag another place
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
