import type { ReactNode } from 'react';
import { ENCOUNTER, PATIENT } from '@/data';

function Field({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex flex-none flex-col gap-0.5">
      <span className="text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{k}</span>
      <span className="text-[12.5px] whitespace-nowrap">{children}</span>
    </div>
  );
}

const Sep = () => <span aria-hidden="true" className="h-7 w-px flex-none bg-line" />;

/** Who the patient is and what the encounter was. */
export function PatientStrip() {
  return (
    <section aria-label="Patient and encounter" className="flex items-center gap-4 overflow-x-auto border-b border-line bg-chrome px-4 py-2 [scrollbar-width:none]">
      <Field k="Patient">
        <b className="font-semibold">{PATIENT.name}</b>
        <span className="text-ink-2"> · {PATIENT.sex} · {PATIENT.age}y</span>
      </Field>
      <Field k="DOB"><span className="font-mono text-xs">{PATIENT.dob}</span></Field>
      <Field k="Member ID"><span className="font-mono text-xs">{PATIENT.memberId}</span></Field>
      <Field k="Plan">{PATIENT.plan}</Field>
      <Sep />
      <Field k="Date of service"><span className="font-mono text-xs">{ENCOUNTER.dos}</span></Field>
      <Field k="Facility">{ENCOUNTER.facility}</Field>
      <Field k="Attending">{ENCOUNTER.attending}</Field>
      <Field k="Arrival → departure"><span className="font-mono text-xs">{ENCOUNTER.arrival} → {ENCOUNTER.departure}</span></Field>
      <Field k="Disposition">{ENCOUNTER.disposition}</Field>
    </section>
  );
}
