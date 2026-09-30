import type { ClaimLine, Finding, MdmSummary } from '@/types';
import { CASE, CLAIM_CODES, CLAIM_LINES } from '@/data';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/ui';
import { LEVELS, STATUS_LABEL, ScoreCard, isLive, routeOf, useOrderedFindings, useSummary } from '@/features/findings';
import { Table, Td, Th } from './Table';

type Verdict = { st: 'ok' | 'warn' | 'pend'; t: string; a: string };

const VERDICT_STYLE = { ok: 'text-ok bg-ok-fill', warn: 'text-add bg-add-fill', pend: 'text-ai bg-ai-fill' } as const;

function lineVerdict(l: ClaimLine, ordered: Finding[], s: MdmSummary): Verdict {
  if (l.code === CASE.billed) {
    return s.code === CASE.billed
      ? { st: 'ok', t: `Record supports ${s.code} on MDM (Problems ${LEVELS[s.prob]}, Risk ${LEVELS[s.risk]}).`, a: 'Supports billed level' }
      : { st: 'warn', t: `Accepted evidence supports ${s.code}. Level 5 needs two of three MDM elements at High.`, a: `Supports ${s.code}` };
  }
  const rep = ordered.find((f) => f.replaces === l.code && f.status !== 'rejected');
  if (rep) {
    return isLive(rep)
      ? { st: 'warn', t: `Record documents ${rep.desc?.toLowerCase()} (p. ${rep.page}).`, a: `Record shows ${rep.code}` }
      : { st: 'pend', t: `AI suggests ${rep.code} instead (p. ${rep.page}). Review pending.`, a: 'Review suggestion' };
  }
  const sup = ordered.filter((f) => f.code === l.code && isLive(f));
  if (sup.length) return { st: 'ok', t: `Supported on p. ${sup.map((f) => f.page).join(', ')}.`, a: 'Supported' };
  return { st: 'pend', t: 'No accepted evidence yet.', a: 'Review' };
}

/** Claim lines against the record, and codes found in the record that are not on the claim. */
export function ClaimTab({ onJump }: { onJump: (id: string) => void }) {
  const ordered = useOrderedFindings();
  const s = useSummary();
  const notOnClaim = ordered.filter((f) => f.code && !CLAIM_CODES.has(f.code) && (routeOf(f) === 'notOnClaim' || f.status === 'ai'));
  return (
    <div>
      <div className="max-w-[620px]"><ScoreCard s={s} /></div>
      <h3 className="mt-[22px] mb-2 text-sm font-semibold">Lines on the claim</h3>
      <Table>
        <thead><tr><Th>Billed</Th><Th>Paid as</Th><Th>Description</Th><Th>What the record shows</Th><Th>Status</Th></tr></thead>
        <tbody>
          {CLAIM_LINES.map((l) => {
            const v = lineVerdict(l, ordered, s);
            return (
              <tr key={l.code}>
                <Td className="font-mono font-semibold">{l.code}</Td>
                <Td className={cn('font-mono font-semibold', l.paid !== l.code && 'text-rej')}>{l.paid}</Td>
                <Td>{l.desc}</Td>
                <Td>{v.t}</Td>
                <Td><span className={cn('rounded-[5px] px-2 py-[3px] text-[11.5px] font-semibold whitespace-nowrap', VERDICT_STYLE[v.st])}>{v.a}</span></Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <h3 className="mt-[22px] mb-2 text-sm font-semibold">Found in the record, not on the claim</h3>
      <p className="mb-2.5 max-w-[70ch] text-[12.5px] leading-normal text-ink-2">
        Documented in the record but not billed. Use them to judge the complexity of the visit.
      </p>
      <Table>
        <thead><tr><Th>Code</Th><Th>Description</Th><Th>Page</Th><Th>Status</Th></tr></thead>
        <tbody>
          {notOnClaim.map((f) => (
            <tr key={f.id} onClick={() => onJump(f.id)} className="cursor-pointer hover:[&>td]:bg-chrome">
              <Td className="font-mono font-semibold">
                {f.code}
                {f.replaces && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">replaces {f.replaces}</div>}
              </Td>
              <Td>{f.desc}</Td>
              <Td className="font-mono tabular-nums">{f.page}</Td>
              <Td><StatusChip status={f.status} label={f.status === 'ai' ? 'Needs review' : STATUS_LABEL[f.status]} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
