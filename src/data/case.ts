import type { CaseInfo, Encounter, Patient } from '@/types';

/* Synthetic demo case. No real patient information. */

export const CASE: CaseInfo = {
  id: 'RC-2026-1187',
  stage: 'Reconsideration',
  received: 'Sep 18',
  due: 'Oct 18',
  daysLeft: 18,
  payer: 'Northstar Health Plan',
  billed: '99285',
  paid: '99284',
  carc: 'CARC 150',
  carcText: 'Payer deems the information submitted does not support this level of service.',
  levelCodes: ['99282', '99283', '99284', '99285'],
};

export const PATIENT: Patient = {
  name: 'DEMO, Jordan',
  memberId: 'NSH-4471-0928',
  mrn: 'ED-TEST-20931',
  dob: '11/19/1978',
  age: 47,
  sex: 'F',
  plan: 'Northstar PPO Gold',
};

export const ENCOUNTER: Encounter = {
  setting: 'Emergency department · facility',
  facility: 'Meridian Regional Medical Center',
  attending: 'Priya Raman, MD',
  dos: '05/02/2026',
  arrival: '02:14',
  departure: '08:05',
  disposition: 'Admitted to observation',
  reason: '"I can\'t keep anything down." Vomiting and abdominal pain for 2 days.',
};
