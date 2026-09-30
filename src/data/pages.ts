import type { Block, BlockKind, RecordPage } from '@/types';

/* Synthetic demo record. No real patient information. */

type Raw = [BlockKind, string];

const page = (n: number, label: string, blocks: Raw[]): RecordPage => ({
  n,
  label,
  blocks: blocks.map(([k, t], idx) => ({ id: `p${n}b${idx}`, k, t, idx, page: n })),
});

export const PAGES: RecordPage[] = [
  page(1, 'History', [
    ['org', 'RIVERBEND INTERNAL MEDICINE ASSOCIATES'],
    ['sub', '1200 Harbor Road, Suite 4 · Tel (555) 010-4420 · Fax (555) 010-4421'],
    ['title', 'OFFICE VISIT — ESTABLISHED PATIENT'],
    ['meta', 'Patient: DEMO, ALEX     MRN: TEST-004417     DOB: 06/02/1961     Sex: M'],
    ['meta', 'Date of service: 03/14/2026     Provider: Mei Chen, MD     Dept: Internal Medicine'],
    ['h', 'CHIEF COMPLAINT'],
    ['p', '"My sugars are really high and I feel weak." Duration 5 days.'],
    ['h', 'HISTORY OF PRESENT ILLNESS'],
    ['p', '64-year-old man with type 2 diabetes, hypertension and chronic kidney disease presents with 5 days of polyuria, polydipsia and fatigue. Reports home glucose readings 380–450 mg/dL over the past 4 days. Ran out of metformin 2 weeks ago and did not refill.'],
    ['p', 'Also reports lightheadedness on standing since yesterday. Denies chest pain, dyspnea, abdominal pain, vomiting or confusion. Seen in Mercy General ED on 02/28/2026 after a mechanical fall; no fracture.'],
    ['h', 'CURRENT MEDICATIONS'],
    ['li', 'Metformin 1000 mg PO BID (not taking for 2 weeks)'],
    ['li', 'Lisinopril 20 mg PO daily'],
    ['li', 'Atorvastatin 40 mg PO daily'],
    ['h', 'ALLERGIES'],
    ['p', 'No known drug allergies.'],
  ]),
  page(2, 'Exam', [
    ['h', 'VITAL SIGNS'],
    ['meta', 'BP 108/66 seated · 92/58 standing     HR 98 seated · 118 standing'],
    ['meta', 'Temp 98.4 °F     RR 18     SpO2 98% RA     Wt 81.2 kg (84.0 kg on 02/10/2026)'],
    ['h', 'REVIEW OF SYSTEMS'],
    ['p', 'Constitutional: fatigue, 3 kg weight loss over one month. Eyes: blurred vision when sugars are high. Cardiovascular: no chest pain, no palpitations. Respiratory: no cough or shortness of breath. GI: increased thirst, no nausea or vomiting. GU: urinary frequency and nocturia x4. Neuro: lightheaded on standing, no syncope. All other systems reviewed and negative.'],
    ['h', 'PHYSICAL EXAMINATION'],
    ['p', 'General: tired-appearing, alert and oriented x3, no acute distress.'],
    ['p', 'HEENT: dry mucous membranes, no oral lesions.'],
    ['p', 'Patient is clinically dehydrated with a positive orthostatic drop in blood pressure and rise in heart rate.'],
    ['p', 'Cardiovascular: tachycardic, regular rhythm, no murmur. Lungs: clear to auscultation bilaterally. Abdomen: soft, non-tender. Extremities: no edema. Neuro: nonfocal. Feet: monofilament sensation intact bilaterally.'],
  ]),
  page(3, 'Results & data', [
    ['h', 'IN-OFFICE RESULTS'],
    ['p', 'Point-of-care glucose: 412 mg/dL.'],
    ['p', 'HbA1c (point of care): 11.2% (8.1% on 10/06/2025).'],
    ['p', '12-lead ECG performed in office: sinus tachycardia, rate 104, normal axis, no acute ST-T changes. No prior tracing for comparison.'],
    ['h', 'EXTERNAL RECORDS'],
    ['p', 'Reviewed Mercy General ED discharge summary dated 02/28/2026: creatinine 1.3 mg/dL, eGFR 55, head CT negative.'],
    ['h', 'TESTS ORDERED'],
    ['p', 'Ordered basic metabolic panel, stat, to assess renal function, potassium and anion gap.'],
    ['p', 'BMP resulted 16:10: Na 131, K 4.9, Cl 97, CO2 22, BUN 34, Cr 1.5, eGFR 48, glucose 398. Anion gap 12. No evidence of DKA.'],
  ]),
  page(4, 'Assessment & plan', [
    ['h', 'ASSESSMENT AND PLAN'],
    ['p', '1. Type 2 diabetes mellitus with severe hyperglycemia. A1c 11.2%, up from 8.1%, off metformin for two weeks. No DKA (anion gap 12).'],
    ['li', 'Start insulin glargine 10 units subcutaneously at bedtime; titrate by 2 units every 3 days to fasting glucose under 150.'],
    ['li', 'Resume metformin at 500 mg BID given eGFR 48. Glucometer log; diabetes education referral placed.'],
    ['p', '2. Type 2 diabetes with diabetic kidney disease, CKD stage 3a. eGFR 48 from baseline 55, likely prerenal component from volume depletion.'],
    ['li', 'Hold lisinopril for 3 days. Repeat BMP in 3 days.'],
    ['p', '3. Hypertension with CKD. Low blood pressure today with orthostasis; lisinopril held as above.'],
    ['p', '4. Volume depletion with orthostasis. Oral rehydration 2–3 L/day; fall precautions reviewed.'],
    ['p', 'Discussed direct hospital admission for IV fluids and insulin initiation; patient declined after risks and benefits were reviewed and prefers close outpatient follow-up.'],
    ['p', 'Return precautions given for vomiting, confusion or glucose over 500. Nurse telephone check in 24 hours. Follow-up office visit in 3 days.'],
  ]),
  page(5, 'Attestation', [
    ['h', 'TIME AND ATTESTATION'],
    ['p', 'Total time on the date of the encounter: 34 minutes, including review of external records, examination, counseling and documentation.'],
    ['p', 'I personally performed the services described in this note.'],
    ['p', 'Electronically signed by Mei Chen, MD on 03/14/2026 at 17:42.'],
  ]),
];

export const BLOCKS: Record<string, Block> = Object.fromEntries(
  PAGES.flatMap((p) => p.blocks.map((b) => [b.id, b] as const)),
);

export const PRINT_FOOTER = 'Printed from EHR 03/19/2026 09:14 · Riverbend IMA';
