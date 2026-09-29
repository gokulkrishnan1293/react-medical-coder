/* Synthetic demo data. No real patient information. */

export const CASE = {
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
  stake: '$52.36',
  level: 'Reconsideration',
  due: 'Oct 23',
  daysLeft: 24,
  provider: 'Mei Chen, MD',
  practice: 'Riverbend Internal Medicine Associates',
};

export const CLAIM_LINES = [
  { code: '99215', desc: 'Office visit, established patient, high MDM', paid: '99214' },
  { code: 'E11.65', desc: 'Type 2 diabetes mellitus with hyperglycemia', paid: 'E11.65' },
  { code: 'I10', desc: 'Essential (primary) hypertension', paid: 'I10' },
  { code: '83036', desc: 'Hemoglobin A1c', paid: '83036' },
];
export const CLAIM_CODES = new Set(CLAIM_LINES.map((c) => c.code));

const P = (n, dos, label, blocks) => ({
  n,
  dos,
  label,
  blocks: blocks.map((b, i) => ({ id: `p${n}b${i}`, k: b[0], t: b[1], idx: i, page: n })),
});

export const PAGES = [
  P(1, '03/14/2026', 'History', [
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
  P(2, '03/14/2026', 'Exam', [
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
  P(3, '03/14/2026', 'Results & data', [
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
  P(4, '03/14/2026', 'Assessment & plan', [
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
  P(5, '03/14/2026', 'Attestation', [
    ['h', 'TIME AND ATTESTATION'],
    ['p', 'Total time on the date of the encounter: 34 minutes, including review of external records, examination, counseling and documentation.'],
    ['p', 'I personally performed the services described in this note.'],
    ['p', 'Electronically signed by Mei Chen, MD on 03/14/2026 at 17:42.'],
  ]),
  P(6, '01/09/2026', 'Prior visit', [
    ['org', 'RIVERBEND INTERNAL MEDICINE ASSOCIATES'],
    ['title', 'OFFICE VISIT — ESTABLISHED PATIENT'],
    ['meta', 'Patient: DEMO, ALEX     MRN: TEST-004417     Date of service: 01/09/2026'],
    ['h', 'HISTORY OF PRESENT ILLNESS'],
    ['p', 'Productive cough and fever to 101.2 °F for 3 days. Mild pleuritic right-sided chest pain.'],
    ['h', 'RESULTS'],
    ['p', 'Chest X-ray: right lower lobe infiltrate.'],
    ['h', 'ASSESSMENT AND PLAN'],
    ['p', 'Community-acquired pneumonia, right lower lobe. Amoxicillin-clavulanate 875 mg BID x 7 days. Recheck in 2 weeks or sooner if worse.'],
  ]),
];

export const BLOCKS = {};
PAGES.forEach((p) => p.blocks.forEach((b) => (BLOCKS[b.id] = b)));

function locate(page, text) {
  const p = PAGES.find((x) => x.n === page);
  const b = p.blocks.find((x) => x.t.includes(text));
  if (!b) console.warn('anchor not found', text);
  return b ? b.id : null;
}

const F = (id, page, text, o) => {
  const pg = PAGES.find((x) => x.n === page);
  return {
    id, page, text, block: locate(page, text), source: 'ai',
    outsideDos: pg.dos !== CASE.dos, ...o,
  };
};

export const INITIAL = [
  F('f1', 4, 'Type 2 diabetes mellitus with severe hyperglycemia', {
    type: 'dx', code: 'E11.65', desc: 'Type 2 diabetes mellitus with hyperglycemia',
    mdm: { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation' },
    status: 'confirmed', conf: 0.96,
  }),
  F('f2', 1, 'home glucose readings 380–450 mg/dL', {
    type: 'mdm', desc: 'Severity of exacerbation: sustained glucose 380–450',
    mdm: { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation' },
    status: 'ai', conf: 0.81,
  }),
  F('f10', 3, '12-lead ECG performed in office', {
    type: 'px', code: '93000', desc: 'Electrocardiogram, 12-lead, with interpretation and report',
    note: 'Performed and interpreted in office but not on the claim.', status: 'ai', conf: 0.84,
  }),
  F('f7', 3, 'HbA1c (point of care): 11.2%', {
    type: 'px', code: '83036', desc: 'Hemoglobin A1c',
    mdm: { el: 'data', cat: 1, label: 'Ordering of unique test (HbA1c)' },
    status: 'confirmed', conf: 0.95,
  }),
  F('f6', 3, 'Reviewed Mercy General ED discharge summary dated 02/28/2026', {
    type: 'mdm', desc: 'Review of prior external note',
    mdm: { el: 'data', cat: 1, label: 'Review of prior external note' },
    status: 'confirmed', conf: 0.9,
  }),
  F('f8', 3, 'Ordered basic metabolic panel', {
    type: 'mdm', desc: 'Ordering of unique test (BMP)',
    mdm: { el: 'data', cat: 1, label: 'Ordering of unique test (BMP)' },
    status: 'ai', conf: 0.86,
  }),
  F('f9', 4, 'Start insulin glargine 10 units subcutaneously at bedtime', {
    type: 'mdm', desc: 'Prescription drug management',
    mdm: { el: 'risk', level: 2, label: 'Prescription drug management' },
    status: 'confirmed', conf: 0.94,
  }),
  F('f3', 4, 'diabetic kidney disease', {
    type: 'dx', code: 'E11.22', desc: 'Type 2 diabetes mellitus with diabetic chronic kidney disease',
    status: 'ai', conf: 0.9,
  }),
  F('f4', 4, 'CKD stage 3a', {
    type: 'dx', code: 'N18.31', desc: 'Chronic kidney disease, stage 3a', status: 'ai', conf: 0.93,
  }),
  F('f5', 4, 'Hypertension with CKD', {
    type: 'dx', code: 'I12.9', desc: 'Hypertensive CKD with stage 1–4 or unspecified CKD',
    note: 'Replaces billed I10. ICD-10-CM guideline I.C.9.a.2 presumes a causal link between hypertension and CKD.',
    replaces: 'I10', status: 'ai', conf: 0.88,
  }),
  F('f11', 5, 'Total time on the date of the encounter: 34 minutes', {
    type: 'time', desc: 'Time supports 99214 only (99215 needs 40+ minutes). Support the level with MDM.',
    status: 'ai', conf: 0.99,
  }),
  F('f12', 6, 'Community-acquired pneumonia, right lower lobe', {
    type: 'dx', code: 'J18.9', desc: 'Pneumonia, unspecified organism', status: 'ai', conf: 0.77,
  }),
];

export const DICT = [
  { code: 'E86.0', kind: 'dx', desc: 'Dehydration', kw: 'dehydrated dehydration dry mucous' },
  { code: 'E86.9', kind: 'dx', desc: 'Volume depletion, unspecified', kw: 'volume depletion hypovolemia' },
  { code: 'I95.1', kind: 'dx', desc: 'Orthostatic hypotension', kw: 'orthostatic hypotension orthostasis drop standing' },
  { code: 'E11.65', kind: 'dx', desc: 'Type 2 diabetes mellitus with hyperglycemia', kw: 'type 2 diabetes hyperglycemia uncontrolled high sugars glucose' },
  { code: 'E11.22', kind: 'dx', desc: 'Type 2 diabetes mellitus with diabetic chronic kidney disease', kw: 'diabetic kidney disease nephropathy ckd' },
  { code: 'E11.9', kind: 'dx', desc: 'Type 2 diabetes mellitus without complications', kw: 'type 2 diabetes' },
  { code: 'N18.31', kind: 'dx', desc: 'Chronic kidney disease, stage 3a', kw: 'ckd stage 3a chronic kidney disease egfr' },
  { code: 'N18.32', kind: 'dx', desc: 'Chronic kidney disease, stage 3b', kw: 'ckd stage 3b chronic kidney disease' },
  { code: 'I12.9', kind: 'dx', desc: 'Hypertensive CKD with stage 1–4 or unspecified CKD', kw: 'hypertension ckd hypertensive kidney' },
  { code: 'I10', kind: 'dx', desc: 'Essential (primary) hypertension', kw: 'hypertension blood pressure htn' },
  { code: 'E87.1', kind: 'dx', desc: 'Hypo-osmolality and hyponatremia', kw: 'hyponatremia sodium na 131' },
  { code: 'R42', kind: 'dx', desc: 'Dizziness and giddiness', kw: 'lightheaded lightheadedness dizziness dizzy' },
  { code: 'R53.83', kind: 'dx', desc: 'Other fatigue', kw: 'fatigue weak tired' },
  { code: 'R63.4', kind: 'dx', desc: 'Abnormal weight loss', kw: 'weight loss' },
  { code: 'R63.1', kind: 'dx', desc: 'Polydipsia', kw: 'polydipsia thirst' },
  { code: 'R35.1', kind: 'dx', desc: 'Nocturia', kw: 'nocturia urinary frequency' },
  { code: 'R00.0', kind: 'dx', desc: 'Tachycardia, unspecified', kw: 'tachycardia tachycardic heart rate' },
  { code: 'Z79.84', kind: 'dx', desc: 'Long term (current) use of oral hypoglycemic drugs', kw: 'metformin oral hypoglycemic' },
  { code: 'Z79.4', kind: 'dx', desc: 'Long term (current) use of insulin', kw: 'insulin glargine' },
  { code: 'E78.5', kind: 'dx', desc: 'Hyperlipidemia, unspecified', kw: 'hyperlipidemia atorvastatin cholesterol' },
  { code: 'J18.9', kind: 'dx', desc: 'Pneumonia, unspecified organism', kw: 'pneumonia infiltrate' },
  { code: '99215', kind: 'px', desc: 'Office visit, established patient, high MDM or 40+ min', kw: 'office visit level 5 established' },
  { code: '99214', kind: 'px', desc: 'Office visit, established patient, moderate MDM or 30–39 min', kw: 'office visit level 4 established' },
  { code: '93000', kind: 'px', desc: 'Electrocardiogram, 12-lead, with interpretation and report', kw: 'ecg ekg 12-lead electrocardiogram tracing' },
  { code: '93010', kind: 'px', desc: 'Electrocardiogram, interpretation and report only', kw: 'ecg ekg interpretation' },
  { code: '83036', kind: 'px', desc: 'Hemoglobin A1c', kw: 'hba1c a1c glycated hemoglobin' },
  { code: '82947', kind: 'px', desc: 'Glucose, quantitative, blood', kw: 'glucose point-of-care blood sugar' },
  { code: '80048', kind: 'px', desc: 'Basic metabolic panel', kw: 'basic metabolic panel bmp electrolytes' },
  { code: '36415', kind: 'px', desc: 'Collection of venous blood by venipuncture', kw: 'venipuncture blood draw' },
  { code: 'G2211', kind: 'px', desc: 'Visit complexity inherent to longitudinal care (add-on)', kw: 'longitudinal complexity add-on' },
];

export const MDM_OPTS = [
  { el: 'risk', level: 3, label: 'Decision regarding hospitalization', kw: ['admission', 'admit', 'hospital', 'hospitalization', 'inpatient'] },
  { el: 'risk', level: 3, label: 'Drug therapy requiring intensive monitoring for toxicity', kw: ['toxicity', 'intensive monitoring'] },
  { el: 'risk', level: 2, label: 'Prescription drug management', kw: ['start', 'resume', 'hold', 'mg', 'units', 'prescri', 'titrate'] },
  { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation', kw: ['severe', 'uncontrolled', 'exacerbation'] },
  { el: 'problems', level: 3, label: 'Illness that poses a threat to life or bodily function', kw: ['threat', 'life-threatening'] },
  { el: 'problems', level: 2, label: 'Chronic illness with exacerbation or progression', kw: ['progression', 'worsening', 'worse'] },
  { el: 'data', cat: 1, label: 'Review of prior external note', kw: ['reviewed', 'records', 'summary', 'discharge'] },
  { el: 'data', cat: 1, label: 'Review of result of unique test', kw: ['result', 'resulted'] },
  { el: 'data', cat: 1, label: 'Ordering of unique test', kw: ['ordered', 'order'] },
  { el: 'data', cat: 2, label: 'Independent interpretation of a test', kw: ['interpret', 'independent'] },
  { el: 'data', cat: 3, label: 'Discussion of management with external physician', kw: ['discussed with dr', 'spoke with', 'discussed with'] },
];
