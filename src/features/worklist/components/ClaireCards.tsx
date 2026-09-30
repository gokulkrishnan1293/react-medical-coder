import type { ReactNode } from 'react';
import type { ClaireTally } from '@/types';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CardSpec {
  key: keyof Omit<ClaireTally, 'added'>;
  label: string;
  note: string;
  icon: ReactNode;
  /** Status colours of the evidence boxes, so a decision looks the same here as on the record. */
  tone: string;
}

/** What is left comes first; then what was done with the rest. */
const CARDS: CardSpec[] = [
  { key: 'pending', label: 'To review', note: 'still CLAIRE suggestions', icon: <Icon.spot size={14} />, tone: 'st-ai' },
  { key: 'accepted', label: 'Accepted', note: 'kept as CLAIRE suggested', icon: <Icon.check size={14} sw={2.4} />, tone: 'st-confirmed' },
  { key: 'modified', label: 'Modified', note: 'code changed or evidence moved', icon: <Icon.pencil size={14} />, tone: 'st-added' },
  { key: 'rejected', label: 'Rejected', note: 'not supported by the record', icon: <Icon.close size={14} sw={2.2} />, tone: 'st-rejected' },
];

/**
 * What happened to CLAIRE's suggestions across the cases: accepted, modified, rejected, still to review, each
 * with its share of all suggestions, plus the codes the reviewer added. Counted per code, as the review counts them.
 */
export function ClaireCards({ t, cases }: { t: ClaireTally; cases: number }) {
  const total = t.accepted + t.modified + t.rejected + t.pending;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <section aria-labelledby="claire-title" className="mt-5">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <h2 id="claire-title" className="text-[13.5px] font-semibold">CLAIRE's suggestions</h2>
        <span className="text-[12px] text-ink-3">{total} across your {cases} {cases === 1 ? 'case' : 'cases'}</span>
      </div>
      <div className="grid grid-cols-5 gap-3 max-[1200px]:grid-cols-3 max-[640px]:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.key} className={cn(c.tone, 'rounded-xl border border-line bg-paper p-4')}>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-st">{c.icon}{c.label}</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">{t[c.key]}</span>
              <span className="font-mono text-[12px] text-ink-3">{pct(t[c.key])}%</span>
            </div>
            <div className="mt-1 text-[12px] text-ink-2">{c.note}</div>
            <div aria-hidden className="mt-3 h-1 overflow-hidden rounded-full bg-chrome-2">
              <div className="h-full rounded-full bg-st" style={{ width: `${pct(t[c.key])}%` }} />
            </div>
          </div>
        ))}
        {/* not one of CLAIRE's suggestions, so no share of them: just how many codes CLAIRE missed */}
        <div className="rounded-xl border border-dashed border-accent/40 bg-paper p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent"><span className="text-[14px] leading-none">+</span>Added by you</div>
          <div className="mt-1.5 text-[28px] leading-none font-bold tracking-tight tabular-nums">{t.added}</div>
          <div className="mt-1 text-[12px] text-ink-2">new codes CLAIRE did not suggest</div>
        </div>
      </div>
    </section>
  );
}

/** The same counts, compact, for one case in the table. */
export function ClaireCounts({ t }: { t?: ClaireTally }) {
  if (!t) return <span className="text-ink-3">—</span>;
  const item = (tone: string, icon: ReactNode, n: number, label: string) => (
    <span className={cn(tone, 'inline-flex items-center gap-0.5 text-st', !n && 'opacity-35')} title={`${n} ${label}`}>
      {icon}<span className="font-mono text-[11.5px] font-semibold text-ink tabular-nums">{n}</span>
    </span>
  );
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1" aria-label={`${t.pending} to review, ${t.accepted} accepted, ${t.modified} modified, ${t.rejected} rejected`}>
      {t.pending > 0 && <span className="rounded-full bg-ai-fill px-1.5 py-px text-[10.5px] font-semibold whitespace-nowrap text-ai">{t.pending} to review</span>}
      {item('st-confirmed', <Icon.check size={12} sw={2.4} />, t.accepted, 'accepted')}
      {item('st-added', <Icon.pencil size={12} />, t.modified, 'modified')}
      {item('st-rejected', <Icon.close size={12} sw={2.2} />, t.rejected, 'rejected')}
      {t.added > 0 && <span className="inline-flex items-center gap-0.5 text-accent" title={`${t.added} added by you`}><span className="text-[12px] leading-none font-bold">+</span><span className="font-mono text-[11.5px] font-semibold text-ink tabular-nums">{t.added}</span></span>}
    </span>
  );
}
