import type { Claim, Encounter, Finding, Patient } from '@/types';
import { SOURCE_PAGES } from '@/data';

export type FieldState = 'verified' | 'mismatch' | 'invalid';

export interface FieldCheck {
  key: 'name' | 'dob' | 'age' | 'dos' | 'reason';
  label: string;
  /** What the record shows; this is what the strip displays. */
  value: string;
  state: FieldState;
  /** One line on what was compared and what was found. */
  detail: string;
  claim?: string;
  /** Record page the value comes from. */
  page?: number;
}

/** Parses MM/DD/YYYY. Returns null for anything malformed or not a real date. */
export function parseDate(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[1] - 1, +m[2]);
  return d.getMonth() === +m[1] - 1 && d.getDate() === +m[2] ? d : null;
}

/** Whole years from birth to a date. */
export function ageOn(dob: Date, on: Date): number {
  const a = on.getFullYear() - dob.getFullYear();
  const before = on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate());
  return before ? a - 1 : a;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');

/**
 * Checks the patient and encounter fields the claim and record must agree on.
 * verified: claim matches record · mismatch: they disagree · invalid: the value itself is malformed or impossible.
 */
export function checkFields(p: Patient, e: Encounter, claim: Claim, findings: Finding[]): FieldCheck[] {
  const dob = parseDate(p.dob);
  const dos = parseDate(e.dos);

  const name: FieldCheck = norm(p.name) === norm(claim.patient.name)
    ? { key: 'name', label: 'Patient', value: p.name, state: 'verified', detail: 'Name on the claim matches the record.', claim: claim.patient.name, page: SOURCE_PAGES.name }
    : { key: 'name', label: 'Patient', value: p.name, state: 'mismatch', detail: 'Name on the claim differs from the record.', claim: claim.patient.name, page: SOURCE_PAGES.name };

  const dobCheck: FieldCheck = !dob
    ? { key: 'dob', label: 'DOB', value: p.dob, state: 'invalid', detail: 'Not a valid date.', claim: claim.patient.dob, page: SOURCE_PAGES.dob }
    : dos && dob > dos
      ? { key: 'dob', label: 'DOB', value: p.dob, state: 'invalid', detail: 'Date of birth is after the date of service.', claim: claim.patient.dob, page: SOURCE_PAGES.dob }
      : p.dob !== claim.patient.dob
        ? { key: 'dob', label: 'DOB', value: p.dob, state: 'mismatch', detail: 'Date of birth on the claim differs from the record.', claim: claim.patient.dob, page: SOURCE_PAGES.dob }
        : { key: 'dob', label: 'DOB', value: p.dob, state: 'verified', detail: 'Date of birth on the claim matches the record.', claim: claim.patient.dob, page: SOURCE_PAGES.dob };

  const expected = dob && dos ? ageOn(dob, dos) : null;
  const age: FieldCheck = expected === null
    ? { key: 'age', label: 'Age', value: `${p.age}y`, state: 'invalid', detail: 'Cannot be checked: date of birth or service is not valid.' }
    : expected !== p.age
      ? { key: 'age', label: 'Age', value: `${p.age}y`, state: 'invalid', detail: `Date of birth and date of service give ${expected}, not ${p.age}.` }
      : { key: 'age', label: 'Age', value: `${p.age}y`, state: 'verified', detail: `Consistent with date of birth and date of service (${expected}).` };

  const dosCheck: FieldCheck = !dos
    ? { key: 'dos', label: 'DOS', value: e.dos, state: 'invalid', detail: 'Not a valid date.', claim: claim.dos, page: SOURCE_PAGES.dos }
    : e.dos !== claim.dos
      ? { key: 'dos', label: 'DOS', value: e.dos, state: 'mismatch', detail: 'Date of service on the claim differs from the record.', claim: claim.dos, page: SOURCE_PAGES.dos }
      : { key: 'dos', label: 'DOS', value: e.dos, state: 'verified', detail: 'Date of service on the claim matches the record.', claim: claim.dos, page: SOURCE_PAGES.dos };

  const supported = findings.some((f) => f.type === 'dx' && f.code === claim.reasonDx && f.status !== 'rejected');
  const reason: FieldCheck = !claim.reasonDx
    ? { key: 'reason', label: 'Reason for visit', value: e.reason, state: 'invalid', detail: 'The claim has no reason-for-visit diagnosis.', page: SOURCE_PAGES.reason }
    : supported
      ? { key: 'reason', label: 'Reason for visit', value: e.reason, state: 'verified', detail: `Claim reason ${claim.reasonDx} is supported by the record.`, claim: claim.reasonDx, page: SOURCE_PAGES.reason }
      : { key: 'reason', label: 'Reason for visit', value: e.reason, state: 'mismatch', detail: `Claim reason ${claim.reasonDx} is not among the diagnoses found in the record.`, claim: claim.reasonDx, page: SOURCE_PAGES.reason };

  return [name, dobCheck, age, dosCheck, reason];
}
