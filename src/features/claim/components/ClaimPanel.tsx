import type { ReactNode } from 'react';
import { CLAIM } from '@/data';
import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/ui';
import { TypeBadge } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useClaimChecks } from '../hooks';
import { ClaimStateBadge } from './ClaimStateBadge';
import type { ClaimCheck } from '../utils/claimStatus';

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section>
      <h3 className="sticky top-0 z-1 flex items-baseline gap-1.5 bg-chrome px-1.5 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        {title}<span className="font-mono tracking-normal">{count}</span>
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function Item({ c, children }: { c: ClaimCheck; children: ReactNode }) {
  const target = c.evidence[0];
  return (
    <button
      disabled={!target}
      onClick={() => target && jumpTo(target.id)}
      title={c.detail}
      className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg border border-line bg-paper px-2.5 py-2 text-left', target ? 'hover:border-ink-3' : 'cursor-default')}
    >
      <div className="min-w-0">{children}</div>
      <ClaimStateBadge c={c} className="mt-px" />
    </button>
  );
}

/** Notepad half view: the claim from ERDM, each line and diagnosis checked against the record. */
export function ClaimPanel() {
  const { lines, dx, extra } = useClaimChecks();
  return (
    <div className="flex flex-col gap-1 px-1.5 pb-2">
      <div className="px-1.5 pt-2 text-[11.5px] text-ink-2">
        <span className="font-mono font-semibold text-ink">{CLAIM.id}</span> · {CLAIM.form} · TOB {CLAIM.billType} · from {CLAIM.source}
      </div>
      <Section title="Service lines" count={lines.length}>
        {lines.map(({ l, c }) => (
          <Item key={l.line} c={c}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold">{l.code}</span>
              {l.paidCode !== l.code && <span className="font-mono text-[11px] text-rej">paid {l.paidCode}</span>}
              <span className="ml-auto font-mono text-[10.5px] text-ink-3">rev {l.rev} · ×{l.units}</span>
            </div>
            <div className="truncate text-[11.5px] text-ink-2">{l.desc}</div>
          </Item>
        ))}
      </Section>
      <Section title="Diagnoses" count={dx.length}>
        {dx.map(({ d, c }) => (
          <Item key={d.code} c={c}>
            <div className="flex items-baseline gap-2">
              <span className="grid size-4 place-items-center rounded bg-chrome-2 font-mono text-[10px] font-semibold text-ink-2">{d.pointer}</span>
              <span className="font-mono text-xs font-semibold">{d.code}</span>
              {d.principal && <span className="text-[10px] text-ink-3">principal</span>}
            </div>
            <div className="truncate text-[11.5px] text-ink-2">{d.desc}</div>
          </Item>
        ))}
      </Section>
      <Section title="In record, not on claim" count={extra.length}>
        {extra.map((f) => (
          <button key={f.id} onClick={() => jumpTo(f.id)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-chrome-2">
            <StatusDot status={f.status} />
            <span className="font-mono text-xs font-semibold">{f.code}</span>
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-2">{f.desc}</span>
            <TypeBadge type={f.type} />
          </button>
        ))}
      </Section>
    </div>
  );
}
