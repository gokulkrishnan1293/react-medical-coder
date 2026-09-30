import { motion } from 'motion/react';
import type { Finding } from '@/types';
import { scrollerRef, evidenceEl } from '@/lib/dom';
import { clamp, cn } from '@/lib/utils';
import { useScrollTick } from '@/hooks/useScrollTick';
import { Button, Icon, IconButton, Kbd, StatusChip } from '@/components/ui';
import { CommentField, ELEMENT_LABEL, LEVELS, MarDetail, RouteTag, STATUS_LABEL, TypeBadge, codeLabel, titleOf, useFindingsStore } from '@/features/findings';
import { closeCard, keepCardOpen, scheduleCardClose } from '../navigation';
import { useUiStore } from '@/stores/uiStore';

/** Evidence details shown on hover or click of a box: status, code, quote, and review actions. */
export function EvidenceCard({ f }: { f: Finding }) {
  useScrollTick(scrollerRef);
  const setStatus = useFindingsStore((s) => s.setStatus);
  const pinned = useUiStore((s) => s.card?.pinned);
  const el = evidenceEl(f.id);
  const sc = scrollerRef.current;
  if (!el || !sc) return null;
  const r = el.getBoundingClientRect();
  const sr = sc.getBoundingClientRect();
  if (r.bottom < sr.top + 4 || r.top > sr.bottom - 4) return null;
  const W = Math.min(320, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  const below = window.innerHeight - r.bottom > 280;
  const style = below ? { left, top: r.bottom + 10, width: W } : { left, bottom: window.innerHeight - r.top + 14, width: W };

  return (
    <motion.div
      role="dialog"
      aria-label="Finding details"
      className={cn('st-' + f.status, 'fixed z-60 rounded-[11px] border border-line bg-paper px-3.5 py-3 shadow-float')}
      style={style}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      onMouseEnter={keepCardOpen}
      onMouseLeave={() => { if (!pinned) scheduleCardClose(); }}
    >
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge type={f.type} />
        <StatusChip status={f.status} label={STATUS_LABEL[f.status]} />
        {f.source === 'ai' && f.conf && <span className="font-mono text-[11px] text-ink-3">{Math.round(f.conf * 100)}% confidence</span>}
        <IconButton size="sm" className="ml-auto" onClick={closeCard} aria-label="Close"><Icon.close size={14} /></IconButton>
      </div>
      <div className="font-mono text-[17px] font-semibold tracking-tight">{codeLabel(f)}</div>
      <div className="mt-0.5 text-[13px] leading-snug font-medium text-balance">{titleOf(f)}</div>
      {f.mdm && (f.code || f.type === 'mdm') && (
        <div className="mt-[7px] flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
          <span className="rounded bg-chrome-2 px-[5px] py-[3px] font-mono text-[10px] leading-none font-semibold">MDM</span>
          {ELEMENT_LABEL[f.mdm.el]} · {f.mdm.el === 'data' ? `Category ${f.mdm.cat}` : LEVELS[f.mdm.level ?? 0]}
          {f.code ? ` · ${f.mdm.label}` : ''}
        </div>
      )}
      {f.mar && <div className="mt-1.5"><MarDetail mar={f.mar} /></div>}
      {f.note && f.type !== 'note' && <div className="mt-[7px] text-xs leading-normal text-ink-2">{f.note}</div>}
      <blockquote className="mt-2.5 rounded-r-[5px] border-l-2 border-st bg-chrome px-2.5 py-[7px] font-mono text-xs leading-normal">“{f.text}”</blockquote>
      <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-3">Page {f.page} · <RouteTag f={f} /></div>
      {pinned && <CommentField f={f} className="mt-2.5" />}
      <div className="mt-[11px] flex flex-wrap gap-1.5">
        {f.status === 'ai' && (
          <>
            <Button variant="ok" onClick={() => setStatus(f.id, 'confirmed')}><Icon.check size={14} />Accept <Kbd>A</Kbd></Button>
            <Button onClick={() => setStatus(f.id, 'rejected')}><Icon.close size={14} />Reject <Kbd>R</Kbd></Button>
          </>
        )}
        {(f.status === 'confirmed' || f.status === 'added') && (
          <>
            {f.source === 'ai' && <Button onClick={() => setStatus(f.id, 'ai')}><Icon.undo size={14} />Unaccept</Button>}
            <Button onClick={() => setStatus(f.id, 'rejected')}><Icon.close size={14} />Reject <Kbd>R</Kbd></Button>
          </>
        )}
        {f.status === 'rejected' && (
          <Button onClick={() => setStatus(f.id, f.source === 'ai' ? 'ai' : 'added')}><Icon.undo size={14} />Restore</Button>
        )}
      </div>
    </motion.div>
  );
}
