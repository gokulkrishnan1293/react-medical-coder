import type { Block, BlockKind, RecordPage } from '@/types';

/* Synthetic ED record. No real patient information. */

type Raw = [BlockKind, string];

const page = (n: number, label: string, blocks: Raw[]): RecordPage => ({
  n,
  label,
  blocks: blocks.map(([k, t], idx) => ({ id: `p${n}b${idx}`, k, t, idx, page: n })),
});

export const PAGES: RecordPage[] = [
  page(1, 'Triage & history', [
    ['org', 'MERIDIAN REGIONAL MEDICAL CENTER'],
    ['sub', 'Emergency Department · 400 Lakeview Parkway · Tel (555) 013-2200'],
    ['title', 'EMERGENCY DEPARTMENT PHYSICIAN RECORD'],
    ['meta', 'Patient: DEMO, JORDAN     MRN: ED-TEST-20931     DOB: 11/19/1978     Sex: F'],
    ['meta', 'Date of service: 05/02/2026     Arrival: 02:14     Attending: Priya Raman, MD'],
    ['h', 'TRIAGE'],
    ['meta', 'ESI 2 · BP 96/58 · HR 124 · RR 26 · Temp 99.1 °F · SpO2 97% RA · POC glucose HI (>500)'],
    ['h', 'CHIEF COMPLAINT'],
    ['p', '"I can\'t keep anything down." Vomiting and abdominal pain for 2 days.'],
    ['h', 'HISTORY OF PRESENT ILLNESS'],
    ['p', '47-year-old woman with type 2 diabetes on metformin and glipizide presents with 2 days of nausea, repeated vomiting, diffuse abdominal pain, polyuria and increasing thirst. Unable to tolerate oral intake or medications for 36 hours. Husband reports she has been more drowsy since last evening.'],
    ['p', 'No fever, chest pain, dysuria or diarrhea. No recent medication changes. Last A1c 9.4% three months ago.'],
    ['h', 'PAST HISTORY'],
    ['li', 'Type 2 diabetes mellitus (diagnosed 2016)'],
    ['li', 'Hypertension'],
    ['li', 'Medications: metformin 1000 mg BID, glipizide 10 mg daily, lisinopril 10 mg daily'],
    ['li', 'Allergies: sulfa (rash)'],
  ]),
  page(2, 'Exam', [
    ['h', 'PHYSICAL EXAMINATION'],
    ['p', 'General: ill-appearing, drowsy but arousable and oriented x3. Kussmaul respirations noted.'],
    ['p', 'HEENT: dry mucous membranes, sunken eyes.'],
    ['p', 'Cardiovascular: tachycardic, regular rhythm. Capillary refill 3 seconds.'],
    ['p', 'Abdomen: soft, diffusely tender without guarding or rebound. No peritoneal signs.'],
    ['p', 'Neuro: GCS 14 (E3 V5 M6), no focal deficits.'],
    ['p', 'Skin: poor turgor, no rash.'],
    ['h', 'REVIEW OF SYSTEMS'],
    ['p', 'Positive for nausea, vomiting, abdominal pain, polyuria, polydipsia and fatigue. All other systems reviewed and negative.'],
  ]),
  page(3, 'Results', [
    ['h', 'LABORATORY RESULTS (collected 02:31)'],
    ['meta', 'Glucose 612 mg/dL · Na 128 · K 5.6 · Cl 92 · CO2 13 · BUN 38 · Cr 1.9 (baseline 0.9)'],
    ['meta', 'Anion gap 23 · Beta-hydroxybutyrate 5.9 mmol/L · VBG pH 7.21 · Lactate 2.1'],
    ['meta', 'WBC 15.8 · Hgb 14.6 · Lipase 42 · Urinalysis: glucose 3+, ketones 3+'],
    ['p', 'Ordered comprehensive metabolic panel, CBC, beta-hydroxybutyrate, venous blood gas, lipase and urinalysis on arrival.'],
    ['p', 'Serial basic metabolic panels ordered every 2 hours to follow potassium and anion gap closure.'],
    ['h', 'ECG'],
    ['p', '12-lead ECG independently interpreted by me: sinus tachycardia at 122, peaked T waves in V2–V4, no ST elevation. Consistent with hyperkalemia; repeat after insulin.'],
    ['h', 'POINT-OF-CARE GLUCOSE'],
    ['meta', '02:20 HI · 03:30 548 · 04:30 471 · 05:30 402 · 06:30 344 · 07:30 288'],
  ]),
  page(4, 'Medication administration', [
    ['h', 'MEDICATION ADMINISTRATION RECORD'],
    ['marHead', 'Time | Medication | Dose | Route | Given by'],
    ['mar', '02:40 | Sodium chloride 0.9% bolus | 1000 mL | IV | K. Ortiz, RN'],
    ['mar', '02:42 | Ondansetron | 4 mg | IV push | K. Ortiz, RN'],
    ['mar', '03:35 | Sodium chloride 0.9% bolus | 1000 mL | IV | K. Ortiz, RN'],
    ['mar', '03:50 | Insulin regular infusion | 8 units/hr | IV continuous | K. Ortiz, RN'],
    ['mar', '04:20 | Potassium chloride | 20 mEq | IV piggyback | L. Park, RN'],
    ['mar', '05:45 | Dextrose 5% / 0.45% NaCl | 150 mL/hr | IV continuous | L. Park, RN'],
    ['h', 'NURSING NOTES'],
    ['p', 'IV access established 02:35, 20 g right antecubital. Ondansetron given by IV push over 2 minutes.'],
    ['p', 'Normal saline bolus infused 02:40–03:30 (50 minutes).'],
    ['p', 'Insulin infusion started 03:50 and continued until transfer at 08:05; total 32 units given in the ED.'],
  ]),
  page(5, 'ED course & disposition', [
    ['h', 'ED COURSE AND MEDICAL DECISION MAKING'],
    ['p', 'Diabetic ketoacidosis, moderate, with acute kidney injury and hyperkalemia. This illness poses a threat to bodily function.'],
    ['p', 'Placed on continuous cardiac monitoring because of hyperkalemia with ECG changes.'],
    ['p', 'Hourly point-of-care glucose and neuro checks per DKA protocol. Insulin infusion titrated per DKA protocol.'],
    ['p', 'Reassessed at 04:30 and 06:30: mental status improved, vomiting resolved, anion gap 19 then 15.'],
    ['p', 'Discussed management with Dr. Evans (hospitalist, Lakeview Medicine Group), who agrees with observation admission.'],
    ['p', 'Decision made to admit to the observation step-down unit for continued insulin infusion and electrolyte replacement.'],
    ['h', 'DIAGNOSES'],
    ['li', 'Diabetic ketoacidosis without coma, type 2 diabetes'],
    ['li', 'Acute kidney injury, prerenal'],
    ['li', 'Hyperkalemia'],
    ['li', 'Dehydration'],
    ['h', 'DISPOSITION'],
    ['p', 'Admitted to observation at 08:05 in stable condition.'],
    ['p', 'Electronically signed by Priya Raman, MD on 05/02/2026 at 08:40.'],
  ]),
];

export const BLOCKS: Record<string, Block> = Object.fromEntries(
  PAGES.flatMap((p) => p.blocks.map((b) => [b.id, b] as const)),
);

/** Splits a MAR row into its cells. */
export const marCells = (t: string) => t.split(' | ');

export const PRINT_FOOTER = 'Printed from EHR 05/03/2026 06:12 · Meridian Regional MC';
