import { useEffect, useRef, useState } from 'react';
import { Button, HoverTip, Icon, Kbd } from '@/components/ui';
import { MOD, isModKey } from '@/lib/platform';
import { useFindings } from '@/features/findings';
import { useReviewStore } from './store';

/** Checkpoint-bar control: finish the review with a closing comment, or reopen it. */
export function CompleteReview({ openIssues }: { openIssues: number }) {
  const { status, comment, completedAt, complete, reopen } = useReviewStore();
  const pending = useFindings().filter((f) => f.status === 'ai').length;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(comment);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    box.current?.querySelector('textarea')?.focus();
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', down);
    return () => window.removeEventListener('mousedown', down);
  }, [open]);

  if (status === 'completed') {
    const when = completedAt?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return (
      <div className="flex items-center gap-1.5">
        <HoverTip tip={<><span className="block font-semibold">Completed {when}</span><span className="mt-0.5 block opacity-85">{comment || 'No comment.'}</span></>}>
          <span tabIndex={0} className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] bg-ok-fill px-2.5 text-[12.5px] font-semibold text-ok">
            <Icon.check size={14} sw={2.4} />Review completed
            {comment && <Icon.notes size={13} className="opacity-70" />}
          </span>
        </HoverTip>
        <Button onClick={() => { setDraft(comment); reopen(); }} className="py-1">Reopen</Button>
      </div>
    );
  }

  const submit = () => { complete(draft); setOpen(false); };
  return (
    <div ref={box} className="relative">
      <Button variant="primary" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="py-1">
        <Icon.check size={14} sw={2.2} />Complete review
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Complete review"
          className="absolute top-full right-0 z-80 mt-2 flex w-[340px] flex-col gap-2.5 rounded-xl border border-line bg-paper p-3 shadow-float"
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
            if (e.key === 'Enter' && isModKey(e)) { e.preventDefault(); submit(); }
          }}
        >
          <div className="text-[13px] font-semibold">Complete review</div>
          {(pending > 0 || openIssues > 0) && (
            <ul className="flex flex-col gap-1 rounded-lg bg-add-fill px-2.5 py-2 text-[12px] text-add">
              {pending > 0 && <li className="flex items-center gap-1.5"><Icon.alert size={13} />{pending} AI suggestion{pending > 1 ? 's' : ''} not reviewed yet</li>}
              {openIssues > 0 && <li className="flex items-center gap-1.5"><Icon.alert size={13} />{openIssues} claim field{openIssues > 1 ? 's' : ''} not verified</li>}
            </ul>
          )}
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Closing comment: outcome, what to send the payer, anything left open"
            aria-label="Review comment"
            className="resize-y rounded-lg border border-line bg-chrome px-2.5 py-2 text-[13px] leading-normal outline-none focus:border-accent"
          />
          <div className="flex items-center gap-1.5">
            <span className="mr-auto inline-flex items-center gap-[3px] text-[11px] text-ink-3"><Kbd>{MOD}</Kbd><Kbd>↵</Kbd> to complete</span>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>{pending > 0 || openIssues > 0 ? 'Complete anyway' : 'Complete'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
