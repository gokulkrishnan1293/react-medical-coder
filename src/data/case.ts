import type { CaseInfo, ClaimLine } from '@/types';

/* Synthetic demo case. No real patient information. */

export const CASE: CaseInfo = {
  id: 'APL-2026-0418',
  patient: 'DEMO, Alex',
  mrn: 'TEST-004417',
  payer: 'Northstar Health Plan',
  claim: 'NSH-88213-07',
  dos: '03/14/2026',
  billed: '99215',
  paid: '99214',
  carc: 'CARC 150',
  carcText: 'Payer deems the information submitted does not support this level of service.',
  stage: 'Reconsideration',
  due: 'Oct 23',
  daysLeft: 24,
  provider: 'Mei Chen, MD',
  practice: 'Riverbend Internal Medicine Associates',
};

export const CLAIM_LINES: ClaimLine[] = [
  { code: '99215', desc: 'Office visit, established patient, high MDM', paid: '99214' },
  { code: 'E11.65', desc: 'Type 2 diabetes mellitus with hyperglycemia', paid: 'E11.65' },
  { code: 'I10', desc: 'Essential (primary) hypertension', paid: 'I10' },
  { code: '83036', desc: 'Hemoglobin A1c', paid: '83036' },
];

export const CLAIM_CODES = new Set(CLAIM_LINES.map((c) => c.code));
