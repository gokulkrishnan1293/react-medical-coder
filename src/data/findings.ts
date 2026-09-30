import type { Finding } from '@/types';
import { PAGES } from './pages';

/* CLAIRE's starting findings for the demo case. */

function locate(page: number, text: string): string {
  const p = PAGES.find((x) => x.n === page);
  const b = p?.blocks.find((x) => x.t.includes(text));
  if (!b) throw new Error(`Anchor not found on page ${page}: ${text}`);
  return b.id;
}

type Spec = Omit<Finding, 'id' | 'page' | 'text' | 'block' | 'source'>;

const ai = (id: string, page: number, text: string, spec: Spec): Finding => ({
  id, page, text, block: locate(page, text), source: 'ai', ...spec,
});

export const INITIAL_FINDINGS: Finding[] = [
  // Diagnoses
  ai('d1', 1, 'nausea, repeated vomiting', {
    type: 'dx', code: 'R11.2', desc: 'Nausea with vomiting, unspecified',
    status: 'confirmed', conf: 0.9,
  }),
  ai('d2', 5, 'Diabetic ketoacidosis without coma, type 2 diabetes', {
    type: 'dx', code: 'E11.10', desc: 'Type 2 diabetes mellitus with ketoacidosis without coma',
    replaces: 'E11.65', note: 'Record documents DKA (anion gap 23, pH 7.21, beta-hydroxybutyrate 5.9). Claim lists E11.65.',
    status: 'ai', conf: 0.94,
  }),
  ai('d3', 5, 'Acute kidney injury, prerenal', {
    type: 'dx', code: 'N17.9', desc: 'Acute kidney failure, unspecified', note: 'Creatinine 1.9 from baseline 0.9.', status: 'ai', conf: 0.91,
  }),
  ai('d4', 5, 'Hyperkalemia', { type: 'dx', code: 'E87.5', desc: 'Hyperkalemia', status: 'ai', conf: 0.89 }),
  ai('d5', 5, 'Dehydration', { type: 'dx', code: 'E86.0', desc: 'Dehydration', status: 'confirmed', conf: 0.93 }),

  // Services
  ai('s1', 3, 'comprehensive metabolic panel', {
    type: 'svc', code: '80053', desc: 'Comprehensive metabolic panel', status: 'confirmed', conf: 0.95,
  }),
  ai('s2', 3, 'beta-hydroxybutyrate', {
    type: 'svc', code: '82010', desc: 'Ketone bodies, quantitative (beta-hydroxybutyrate)', status: 'confirmed', conf: 0.92,
  }),
  ai('s3', 3, 'venous blood gas', {
    type: 'svc', code: '82803', desc: 'Blood gases', status: 'confirmed', conf: 0.9,
  }),
  ai('s4', 3, '12-lead ECG independently interpreted by me', {
    type: 'svc', code: '93005', desc: 'Electrocardiogram, tracing only', status: 'ai', conf: 0.9,
  }),
  ai('s5', 4, 'Ondansetron given by IV push over 2 minutes', {
    type: 'svc', code: '96374', desc: 'IV push, single or initial drug', status: 'confirmed', conf: 0.93,
  }),
  ai('s6', 4, 'Normal saline bolus infused 02:40–03:30 (50 minutes)', {
    type: 'svc', code: '96360', desc: 'IV hydration, initial 31 min to 1 hour', status: 'confirmed', conf: 0.88,
  }),
  ai('s7', 4, 'Insulin infusion started 03:50 and continued until transfer at 08:05', {
    type: 'svc', code: '96365', desc: 'IV infusion, therapy, initial, up to 1 hour',
    note: 'Insulin infusion ran 4 h 15 min. Would also support 96366 × 3.', status: 'ai', conf: 0.87,
  }),

  // Medication administration record
  ai('m1', 4, '02:40 | Sodium chloride 0.9% bolus | 1000 mL | IV | K. Ortiz, RN', {
    type: 'mar', code: 'J7030', desc: 'Normal saline solution infusion, 1000 cc',
    mar: { time: '02:40', drug: 'Sodium chloride 0.9% bolus', dose: '1000 mL', route: 'IV', units: 1 }, status: 'confirmed', conf: 0.96,
  }),
  ai('m2', 4, '02:42 | Ondansetron | 4 mg | IV push | K. Ortiz, RN', {
    type: 'mar', code: 'J2405', desc: 'Ondansetron HCl injection, per 1 mg',
    mar: { time: '02:42', drug: 'Ondansetron', dose: '4 mg', route: 'IV push', units: 4 }, status: 'confirmed', conf: 0.97,
  }),
  ai('m3', 4, '03:35 | Sodium chloride 0.9% bolus | 1000 mL | IV | K. Ortiz, RN', {
    type: 'mar', code: 'J7030', desc: 'Normal saline solution infusion, 1000 cc',
    mar: { time: '03:35', drug: 'Sodium chloride 0.9% bolus', dose: '1000 mL', route: 'IV', units: 1 }, status: 'confirmed', conf: 0.96,
  }),
  ai('m4', 4, '03:50 | Insulin regular infusion | 8 units/hr | IV continuous | K. Ortiz, RN', {
    type: 'mar', code: 'J1815', desc: 'Insulin injection, per 5 units',
    mar: { time: '03:50', drug: 'Insulin regular infusion', dose: '8 units/hr', route: 'IV continuous', units: 7 },
    note: '32 units total per nursing note = 7 billing units.', status: 'ai', conf: 0.9,
  }),
  ai('m5', 4, '04:20 | Potassium chloride | 20 mEq | IV piggyback | L. Park, RN', {
    type: 'mar', code: 'J3480', desc: 'Potassium chloride injection, per 2 mEq',
    mar: { time: '04:20', drug: 'Potassium chloride', dose: '20 mEq', route: 'IV piggyback', units: 10 }, status: 'ai', conf: 0.88,
  }),

  // Services performed that are not billed on their own line. They count toward the ED level as interventions.
  ai('i1', 5, 'Placed on continuous cardiac monitoring', { type: 'svc', desc: 'Continuous cardiac monitoring', status: 'confirmed', conf: 0.95 }),
  ai('i2', 5, 'Hourly point-of-care glucose and neuro checks', { type: 'svc', desc: 'Serial point-of-care glucose and neuro checks', status: 'ai', conf: 0.9 }),
  ai('i3', 5, 'Insulin infusion titrated per DKA protocol', { type: 'svc', desc: 'Titrated IV infusion', status: 'ai', conf: 0.88 }),
  ai('i4', 5, 'Reassessed at 04:30 and 06:30', { type: 'svc', desc: 'Serial reassessments', status: 'ai', conf: 0.84 }),
  ai('i5', 3, 'Serial basic metabolic panels ordered every 2 hours', { type: 'svc', desc: 'Serial lab monitoring', status: 'ai', conf: 0.82 }),

  // Documentation: what the record states that has no code. Counts toward MDM.
  ai('r1', 5, 'Decision made to admit to the observation step-down unit', {
    type: 'doc', docKind: 'hospitalization', desc: 'Decision regarding hospitalization', status: 'ai', conf: 0.92,
  }),
  ai('r3', 5, 'Discussed management with Dr. Evans', {
    type: 'doc', docKind: 'externalDiscussion', desc: 'Discussion of management with external physician', status: 'ai', conf: 0.86,
  }),
];
