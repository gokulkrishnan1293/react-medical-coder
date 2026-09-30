import type { MdmSummary } from '@/types';
import { CASE } from '@/data';
import { cn } from '@/lib/utils';
import { LEVELS } from '../utils/labels';

/** MDM element levels and the visit code they support. */
export function ScoreCard({ s, compact }: { s: MdmSummary; compact?: boolean }) {
  const cells = [['prob', 'Problems'], ['data', 'Data'], ['risk', 'Risk']] as const;
  const ok = s.code === CASE.billed;
  const box = 'min-w-0 rounded-[7px] border px-2 py-[5px]';
  const k = 'block text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase';
  const v = cn('block truncate font-semibold', compact ? 'text-[11.5px]' : 'text-xs');
  return (
    <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.35fr)] gap-1.5 max-[760px]:grid-cols-2">
      {cells.map(([key, label]) => (
        <div key={key} className={cn(box, 'border-line bg-paper')}>
          <span className={k}>{label}</span>
          <span className={cn(v, s[key] >= 3 && 'text-ok')}>{LEVELS[s[key]]}</span>
        </div>
      ))}
      <div className={cn(box, ok ? 'border-ok/45 bg-ok-fill' : 'border-add/45 bg-add-fill')}>
        <span className={k}>Supports</span>
        <span className={v}>
          <b className="font-mono">{s.code}</b> <span className="text-[11px] font-normal text-ink-2">of {CASE.billed}</span>
        </span>
      </div>
    </div>
  );
}
