import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/ui';
import { STATUS_LABEL, TypeBadge } from '@/features/findings';
import { Table, Td, Th } from '@/components/ui/Table';
import { useClaimChecks } from '../hooks';
import { ClaimStateBadge } from './ClaimStateBadge';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/** Full view: claim lines, diagnoses and not-on-claim codes against the record. */
export function ClaimTables({ onJump }: { onJump: (id: string) => void }) {
  const { lines, dx, extra } = useClaimChecks();
  const row = (id?: string) => (id ? { onClick: () => onJump(id), className: 'cursor-pointer hover:[&>td]:bg-chrome' } : {});
  const h3 = 'mt-[22px] mb-2 text-sm font-semibold first:mt-0';
  return (
    <div>
      <h3 className={h3}>Service lines</h3>
      <Table>
        <thead>
          <tr><Th>Ln</Th><Th>Rev</Th><Th>Code</Th><Th>Description</Th><Th>Units</Th><Th>Dx</Th><Th>Charge</Th><Th>Paid as</Th><Th>What the record shows</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {lines.map(({ l, c }) => (
            <tr key={l.line} {...row(c.evidence[0]?.id)}>
              <Td className="font-mono text-ink-3">{l.line}</Td>
              <Td className="font-mono">{l.rev}</Td>
              <Td className="font-mono font-semibold">{l.code}</Td>
              <Td>{l.desc}</Td>
              <Td className="font-mono tabular-nums">{l.units}</Td>
              <Td className="font-mono">{l.dxPointers.split('').join(',')}</Td>
              <Td className="font-mono tabular-nums">{money(l.charge)}</Td>
              <Td className={cn('font-mono font-semibold', l.paidCode !== l.code && 'text-rej')}>{l.paidCode}{l.paidUnits !== l.units && ` ×${l.paidUnits}`}</Td>
              <Td>{c.detail}</Td>
              <Td><ClaimStateBadge c={c} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <h3 className={h3}>Diagnoses</h3>
      <Table>
        <thead><tr><Th>Ptr</Th><Th>Code</Th><Th>Description</Th><Th>What the record shows</Th><Th>Status</Th></tr></thead>
        <tbody>
          {dx.map(({ d, c }) => (
            <tr key={d.code} {...row(c.evidence[0]?.id)}>
              <Td className="font-mono">{d.pointer}</Td>
              <Td className="font-mono font-semibold">{d.code}{d.principal && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">principal</div>}</Td>
              <Td>{d.desc}</Td>
              <Td>{c.detail}</Td>
              <Td><ClaimStateBadge c={c} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <h3 className={h3}>Found in the record, not on the claim</h3>
      <p className="mb-2.5 max-w-[70ch] text-[12.5px] leading-normal text-ink-2">Documented but not billed. Use them to judge the complexity of the visit.</p>
      <Table>
        <thead><tr><Th>Type</Th><Th>Code</Th><Th>Description</Th><Th>Page</Th><Th>Status</Th></tr></thead>
        <tbody>
          {extra.map((f) => (
            <tr key={f.id} {...row(f.id)}>
              <Td><TypeBadge type={f.type} /></Td>
              <Td className="font-mono font-semibold">{f.code}{f.replaces && <div className="mt-0.5 text-[10.5px] font-medium text-ink-3">replaces {f.replaces}</div>}</Td>
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
