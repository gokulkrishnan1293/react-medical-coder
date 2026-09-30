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
  ai('f1', 4, 'Type 2 diabetes mellitus with severe hyperglycemia', {
    type: 'dx', code: 'E11.65', desc: 'Type 2 diabetes mellitus with hyperglycemia',
    mdm: { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation' },
    status: 'confirmed', conf: 0.96,
  }),
  ai('f2', 1, 'home glucose readings 380–450 mg/dL', {
    type: 'mdm', desc: 'Severity of exacerbation: sustained glucose 380–450',
    mdm: { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation' },
    status: 'ai', conf: 0.81,
  }),
  ai('f10', 3, '12-lead ECG performed in office', {
    type: 'px', code: '93000', desc: 'Electrocardiogram, 12-lead, with interpretation and report',
    note: 'Performed and interpreted in office but not on the claim.', status: 'ai', conf: 0.84,
  }),
  ai('f7', 3, 'HbA1c (point of care): 11.2%', {
    type: 'px', code: '83036', desc: 'Hemoglobin A1c',
    mdm: { el: 'data', cat: 1, label: 'Ordering of unique test (HbA1c)' },
    status: 'confirmed', conf: 0.95,
  }),
  ai('f6', 3, 'Reviewed Mercy General ED discharge summary dated 02/28/2026', {
    type: 'mdm', desc: 'Review of prior external note',
    mdm: { el: 'data', cat: 1, label: 'Review of prior external note' },
    status: 'confirmed', conf: 0.9,
  }),
  ai('f8', 3, 'Ordered basic metabolic panel', {
    type: 'mdm', desc: 'Ordering of unique test (BMP)',
    mdm: { el: 'data', cat: 1, label: 'Ordering of unique test (BMP)' },
    status: 'ai', conf: 0.86,
  }),
  ai('f9', 4, 'Start insulin glargine 10 units subcutaneously at bedtime', {
    type: 'mdm', desc: 'Prescription drug management',
    mdm: { el: 'risk', level: 2, label: 'Prescription drug management' },
    status: 'confirmed', conf: 0.94,
  }),
  ai('f3', 4, 'diabetic kidney disease', {
    type: 'dx', code: 'E11.22', desc: 'Type 2 diabetes mellitus with diabetic chronic kidney disease',
    status: 'ai', conf: 0.9,
  }),
  ai('f4', 4, 'CKD stage 3a', {
    type: 'dx', code: 'N18.31', desc: 'Chronic kidney disease, stage 3a', status: 'ai', conf: 0.93,
  }),
  ai('f5', 4, 'Hypertension with CKD', {
    type: 'dx', code: 'I12.9', desc: 'Hypertensive CKD with stage 1–4 or unspecified CKD',
    note: 'Replaces billed I10. ICD-10-CM guideline I.C.9.a.2 presumes a causal link between hypertension and CKD.',
    replaces: 'I10', status: 'ai', conf: 0.88,
  }),
  ai('f11', 5, 'Total time on the date of the encounter: 34 minutes', {
    type: 'time', desc: 'Time supports 99214 only (99215 needs 40+ minutes). Level rests on MDM.',
    status: 'ai', conf: 0.99,
  }),
];
