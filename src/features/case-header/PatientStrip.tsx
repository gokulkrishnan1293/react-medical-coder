import { useMemo } from 'react';
import { CLAIM, ENCOUNTER, PATIENT } from '@/data';
import { HoverTip, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useFindings } from '@/features/findings';
import { goPage } from '@/features/record-viewer';
import { CompleteReview, ReviewStatusBadge, SaveStatus } from '@/features/review';
import { checkFields, type FieldCheck, type FieldState } from './fieldChecks';
import { ReviewProgress } from './ReviewProgress';

const STATE: Record<FieldState, { label: string; className: string; icon: React.ReactNode }> = {
  verified: { label: 'Verified', className: 'bg-ok text-on-tag', icon: <Icon.check size={10} sw={3} /> },
  mismatch: { label: 'Mismatch', className: 'bg-add text-on-tag', icon: <span className="text-[10px] leading-none font-bold">≠</span> },
  invalid: { label: 'Invalid', className: 'bg-rej text-on-tag', icon: <span className="text-[10px] leading-none font-bold">!</span> },
};

function Indicator({ c }: { c: FieldCheck }) {
  const s = STATE[c.state];
  return (
    <HoverTip
      tip={
        <>
          <span className="block font-semibold">{c.label}: {s.label}</span>
          <span className="mt-0.5 block opacity-85">{c.detail}</span>
          {c.claim !== undefined && <span className="mt-1.5 block font-mono text-[11px] opacity-85">Claim: {c.claim}</span>}
          {c.key !== 'age' && <span className="block font-mono text-[11px] opacity-85">Record: {c.key === 'reason' ? 'chief complaint' : c.value}{c.page ? ` · p. ${c.page}` : ''}</span>}
        </>
      }
    >
      <span tabIndex={0} role="img" aria-label={`${c.label} ${s.label.toLowerCase()}`} className={cn('grid size-[15px] flex-none place-items-center rounded-full outline-offset-2', s.className)}>
        {s.icon}
      </span>
    </HoverTip>
  );
}

function Field({ c, mono, wide }: { c: FieldCheck; mono?: boolean; wide?: boolean }) {
  const value = (
    <span className={cn('block truncate text-[12.5px]', mono && 'font-mono text-xs', c.key === 'name' && 'font-semibold', wide && 'max-w-[240px]')}>
      {c.value}
    </span>
  );
  return (
    <div className={cn('flex min-w-0 flex-none items-center gap-2', wide && 'flex-shrink')}>
      <div className="min-w-0">
        <span className="block text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{c.label}</span>
        {c.page ? (
          <button type="button" onClick={() => goPage(c.page!)} title={wide ? undefined : `Go to page ${c.page}`} className="block max-w-full min-w-0 text-left hover:text-accent">
            {wide ? <HoverTip tip={c.value} className="block min-w-0">{value}</HoverTip> : value}
          </button>
        ) : value}
      </div>
      <Indicator c={c} />
    </div>
  );
}

/** A plain field with nothing to check, e.g. the claim number. */
function Plain({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-none">
      <span className="block text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{label}</span>
      <span className="block font-mono text-xs whitespace-nowrap">{children}</span>
    </div>
  );
}

const Sep = () => <span aria-hidden="true" className="h-7 w-px flex-none bg-line" />;

/**
 * The claim, who the patient is and why they came, checked against the claim. Centered, with room on the
 * left and right for review checkpoints.
 */
export function PatientStrip() {
  const findings = useFindings();
  const checks = useMemo(() => checkFields(PATIENT, ENCOUNTER, CLAIM, findings), [findings]);
  const by = Object.fromEntries(checks.map((c) => [c.key, c])) as Record<FieldCheck['key'], FieldCheck>;
  return (
    <section
      aria-label="Patient and encounter"
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b border-line bg-chrome px-4 py-2 max-[1100px]:grid-cols-[minmax(0,1fr)_auto]"
    >
      {/* Left slot: review checkpoints */}
      <div data-slot="left" data-tour="progress" className="flex min-w-0 items-center gap-2 max-[1100px]:hidden">
        <ReviewProgress />
      </div>
      <div className="flex min-w-0 items-center justify-center gap-4 overflow-x-auto [scrollbar-width:none] max-[1100px]:justify-start">
        <Plain label="Claim">{CLAIM.id}</Plain>
        <Sep />
        <Field c={by.name} />
        <Field c={by.dob} mono />
        <Field c={by.age} mono />
        <Sep />
        <Field c={by.dos} mono />
        <Field c={by.reason} wide />
      </div>
      {/* Right slot: review checkpoints, the review status, and completing the review */}
      <div data-slot="right" className="flex min-w-0 items-center justify-end gap-2">
        <SaveStatus />
        <ReviewStatusBadge />
        <CompleteReview openIssues={checks.filter((c) => c.state !== 'verified').length} />
      </div>
    </section>
  );
}
