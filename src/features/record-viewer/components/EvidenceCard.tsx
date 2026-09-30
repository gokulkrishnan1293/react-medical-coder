import { useState } from 'react';
import { motion } from 'motion/react';
import type { Finding } from '@/types';
import { mdmOf } from '@/data';
import { scrollerRef, evidenceEl } from '@/lib/dom';
import { clamp, cn } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { Button, HoverTip, Icon, IconButton, Kbd, StatusChip } from '@/components/ui';
import { CommentField, ELEMENT_LABEL, LEVELS, MarDetail, RouteTag, STATUS_LABEL, TypeBadge, canHavePlaces, claimLocked, codeLabel, placesOf, reasonOf, titleOf, useFindings, useFindingsStore } from '@/features/findings';
import { closeCard, keepCardOpen, scheduleCardClose } from '../navigation';
import { CodePicker, codeKindOf, startRebind } from '@/features/add-finding';
import { EvidencePlaces } from './EvidencePlaces';
import { RevisedEvidence } from './RevisedEvidence';
import { useUiStore } from '@/stores/uiStore';

/** Card width: room for the code beside its description, evidence quotes on fewer lines, and the actions in one row. */
const CARD_W = 480;

/** Evidence details shown on hover or click of a box: status and where it lands, code, every place it is documented, and review actions. */
export function EvidenceCard({ f }: { f: Finding }) {
  const mdm = mdmOf(f);
  useScrollTick(scrollerRef);
  const setStatus = useFindingsStore((s) => s.setStatus);
  const remove = useFindingsStore((s) => s.remove);
  const pinned = useUiStore((s) => s.card?.pinned);
  // accept and reject act on the code: every place CLAIRE found it in the same state goes along
  const places = placesOf(f, useFindings());
  const group = places.filter((x) => x.id === f.id || (x.source === 'ai' && x.status === f.status)).length;
  const why = reasonOf(f, places);
  const all = group > 1 ? ` all ${group}` : '';
  const locked = claimLocked(f);
  const el = evidenceEl(f.id);
  const sc = scrollerRef.current;
  if (!el || !sc) return null;
  const r = el.getBoundingClientRect();
  const sr = sc.getBoundingClientRect();
  if (r.bottom < sr.top + 4 || r.top > sr.bottom - 4) return null;
  const W = Math.min(CARD_W, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  // open on the side with more room, and scroll inside if even that is short
  const room = { below: window.innerHeight - r.bottom - 18, above: r.top - 22 };
  const below = room.below > 420 || room.below >= room.above;
  const style = below
    ? { left, top: r.bottom + 10, width: W, maxHeight: room.below }
    : { left, bottom: window.innerHeight - r.top + 14, width: W, maxHeight: room.above };

  return (
    <motion.div
      role="dialog"
      aria-label="Finding details"
      className={cn('st-' + f.status, 'fixed z-60 flex flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-float')}
      style={style}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      onMouseEnter={keepCardOpen}
      onMouseLeave={() => { if (!pinned) scheduleCardClose(); }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <TypeBadge type={f.type} />
          <StatusChip status={f.status} label={STATUS_LABEL[f.status]} />
          <RouteTag f={f} />
          {f.source === 'ai' && f.conf && <span className="font-mono text-[11px] text-ink-3" title="CLAIRE's confidence">{Math.round(f.conf * 100)}%<span className="max-[480px]:hidden"> confidence</span></span>}
          <IconButton size="sm" className="ml-auto" onClick={closeCard} aria-label="Close"><Icon.close size={14} /></IconButton>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <CodeLine f={f} />
          <span className="min-w-0 text-[13.5px] leading-snug font-medium text-balance">{titleOf(f)}</span>
        </div>
        {mdm && (
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            <span className="mr-1.5 rounded bg-chrome-2 px-[5px] py-[3px] font-mono text-[10px] leading-none font-semibold">MDM</span>
            <span className="font-medium text-ink">{ELEMENT_LABEL[mdm.el]} · {mdm.el === 'data' ? `Category ${mdm.cat}` : LEVELS[mdm.level ?? 0]}</span>
            {f.code ? ` · ${mdm.label}` : ''}
          </p>
        )}
        {f.replaces && (
          <div className="mt-1.5"><span className="rounded bg-add-fill px-1.5 py-[3px] font-mono text-[10.5px] leading-none text-add">replaces {f.replaces} on claim</span></div>
        )}
        {f.mar && <div className="mt-2"><MarDetail mar={f.mar} /></div>}
        {why && (
          <div className="mt-2.5 rounded-lg bg-ai-fill px-3 py-2 text-xs leading-normal text-ink-2">
            <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] text-ai uppercase"><Icon.spot size={11} />Why CLAIRE suggests this code</span>
            {why}
          </div>
        )}
        {canHavePlaces(f) ? (
          <EvidencePlaces f={f} />
        ) : (
          <>
            <blockquote className="mt-2.5 rounded-r-[5px] border-l-2 border-st bg-chrome px-2.5 py-[7px] font-mono text-xs leading-normal">“{f.text}”</blockquote>
            <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-3">Page {f.page}<RevisedEvidence f={f} /></div>
          </>
        )}
        {locked && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-3">
            <Icon.lock size={12} className="mt-px flex-none" />
            On the claim, so the code and evidence stay as billed. If the evidence is wrong, say so in a comment.
          </p>
        )}
        {pinned && <CommentField f={f} className="mt-2" />}
      </div>

      {/* actions stay in view when the card scrolls */}
      <div className="flex flex-none flex-wrap items-center gap-1.5 border-t border-line bg-chrome px-4 py-2.5">
        {f.status === 'ai' && (
          <>
            <Button variant="ok" onClick={() => setStatus(f.id, 'confirmed')} title={all && `Accept ${codeLabel(f)} at all ${group} places`}><Icon.check size={14} />Accept{all} <Kbd>A</Kbd></Button>
            <Button onClick={() => setStatus(f.id, 'rejected')} title={all && `Reject ${codeLabel(f)} at all ${group} places`}><Icon.close size={14} />Reject{all} <Kbd>R</Kbd></Button>
          </>
        )}
        {f.source === 'ai' && f.status === 'confirmed' && (
          <>
            <Button onClick={() => setStatus(f.id, 'ai')}><Icon.undo size={14} />Unaccept{all}</Button>
            <Button onClick={() => setStatus(f.id, 'rejected')}><Icon.close size={14} />Reject{all} <Kbd>R</Kbd></Button>
          </>
        )}
        {f.source === 'ai' && f.status === 'rejected' && (
          <Button onClick={() => setStatus(f.id, 'ai')}><Icon.undo size={14} />Restore{all}</Button>
        )}
        {f.source === 'coder' && (
          <Button onClick={() => remove(f.id)}><Icon.trash size={14} />Remove <Kbd>R</Kbd></Button>
        )}
        {/* with a places list, changing evidence sits on the place itself */}
        {f.status !== 'rejected' && !canHavePlaces(f) && !locked && (
          <Button onClick={() => startRebind(f.id)} className="ml-auto" title="Select different words in the record for this finding"><Icon.pencil size={14} />Change evidence</Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * The finding's code, changed in place by searching when it is not on the claim. A changed code is marked
 * revised: hover the mark for CLAIRE's original, or go back to it.
 */
function CodeLine({ f }: { f: Finding }) {
  const [editing, setEditing] = useState(false);
  const editCode = useFindingsStore((s) => s.editCode);
  const kind = codeKindOf(f);
  const locked = claimLocked(f);
  const editable = !!kind && !locked && f.status !== 'rejected';

  if (editing && kind) return <CodePicker f={f} kind={kind} onDone={() => setEditing(false)} className="w-[150px] py-1 text-[15px]" />;
  return (
    <span className="inline-flex items-center gap-1.5 self-center">
      <button
        type="button"
        disabled={!editable}
        onClick={() => setEditing(true)}
        title={editable ? 'Change code' : undefined}
        className={cn('group/code inline-flex items-center gap-1.5 rounded-md font-mono text-[19px] font-semibold tracking-tight', editable && 'cursor-text hover:text-accent')}
      >
        {codeLabel(f)}
        {editable && <Icon.pencil size={13} className="text-ink-3 opacity-0 group-hover/code:opacity-100" />}
      </button>
      {locked && <HoverTip tip="On the claim: the billed code is not changed in review."><Icon.lock size={13} className="text-ink-3" /></HoverTip>}
      {f.editedFrom && (
        <>
          <HoverTip
            tip={<><span className="block font-semibold">CLAIRE's code: {f.editedFrom}</span>{f.editedFromDesc && <span className="mt-0.5 block opacity-85">{f.editedFromDesc}</span>}</>}
          >
            <span tabIndex={0} className="rounded bg-add-fill px-1.5 py-[3px] font-sans text-[10.5px] leading-none font-semibold text-add">Revised</span>
          </HoverTip>
          {editable && (
            <IconButton size="sm" title={`Back to CLAIRE's code, ${f.editedFrom}`} aria-label="Back to the original code" onClick={() => editCode(f.id, f.editedFrom!, f.editedFromDesc ?? '')}>
              <Icon.undo size={13} />
            </IconButton>
          )}
        </>
      )}
    </span>
  );
}

