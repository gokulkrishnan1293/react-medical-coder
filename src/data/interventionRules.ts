/*
 * PLACEHOLDER criteria. Which services count as ED facility-level interventions depends on the
 * facility-level guidelines in use (ACEP-style, hospital or payer specific). Replace this table
 * with the criteria your team codes to.
 *
 * Rules are data, not code, so the review can show exactly how each intervention was reached.
 */

/** One way an intervention can be shown. Code conditions also match claim lines. */
export type Condition =
  | { kind: 'code'; codes: string[]; label: string }
  | { kind: 'text'; pattern: RegExp; label: string }
  | { kind: 'route'; pattern: RegExp; label: string };

export interface InterventionRule {
  id: string;
  label: string;
  /** Any one of these, found on an accepted service or MAR finding, shows the intervention was done. */
  anyOf: Condition[];
  /** Diagnoses that make it medically necessary. Shown as the reason; not required. */
  because?: { codes: string[]; label: string };
}

export const INTERVENTION_RULES: InterventionRule[] = [
  {
    id: 'monitor',
    label: 'Continuous cardiac monitoring',
    anyOf: [
      { kind: 'text', pattern: /cardiac monitoring/i, label: 'Record says “cardiac monitoring”' },
      { kind: 'code', codes: ['93040', '93041'], label: 'Rhythm strip code 93040–93041' },
    ],
    because: { codes: ['E87.5', 'E11.10'], label: 'Arrhythmia risk: hyperkalemia or DKA' },
  },
  {
    id: 'infusion',
    label: 'Titrated or continuous IV infusion',
    anyOf: [
      { kind: 'code', codes: ['96365', '96366'], label: 'IV infusion code 96365–96366' },
      { kind: 'route', pattern: /continuous/i, label: 'MAR route is continuous' },
      { kind: 'text', pattern: /infusion titrated/i, label: 'Record says “infusion titrated”' },
    ],
    because: { codes: ['E11.10'], label: 'DKA needs an insulin drip' },
  },
  {
    id: 'fluids',
    label: 'IV fluids (hydration)',
    anyOf: [
      { kind: 'code', codes: ['96360', '96361'], label: 'IV hydration code 96360–96361' },
      { kind: 'code', codes: ['J7030', 'J7040', 'J7050'], label: 'Saline given on the MAR' },
    ],
    because: { codes: ['E86.0', 'E11.10'], label: 'Dehydration or DKA' },
  },
  {
    id: 'ivMeds',
    label: 'IV push or piggyback medication',
    anyOf: [
      { kind: 'code', codes: ['96374', '96375'], label: 'IV push code 96374–96375' },
      { kind: 'route', pattern: /IV (push|piggyback)/i, label: 'MAR route is IV push or piggyback' },
    ],
  },
  {
    id: 'poc',
    label: 'Serial point-of-care testing',
    anyOf: [
      { kind: 'text', pattern: /point-of-care/i, label: 'Record says “point-of-care”' },
      { kind: 'code', codes: ['82962'], label: 'Glucose by device 82962' },
    ],
    because: { codes: ['E11.10'], label: 'DKA protocol' },
  },
  {
    id: 'labs',
    label: 'Serial lab monitoring',
    anyOf: [{ kind: 'text', pattern: /serial .*(panel|lab)/i, label: 'Record says “serial … panels / labs”' }],
    because: { codes: ['E87.5', 'E11.10'], label: 'Following potassium and anion gap' },
  },
  {
    id: 'reassess',
    label: 'Serial reassessments',
    anyOf: [{ kind: 'text', pattern: /reassess/i, label: 'Record says “reassessed”' }],
  },
  {
    id: 'ecg',
    label: 'ECG',
    anyOf: [{ kind: 'code', codes: ['93000', '93005', '93010'], label: 'ECG code 93000–93010' }],
    because: { codes: ['E87.5'], label: 'Hyperkalemia' },
  },
];
