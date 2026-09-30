import type { DocKind, Finding, MdmLevel, MdmTag } from '@/types';

/*
 * PLACEHOLDER criteria. MDM is not marked on the record: each element is derived from what was found.
 *   Problems ← diagnoses · Data ← tests and documented review · Risk ← drugs given and documented decisions.
 * The levels below follow the shape of the AMA 2023 E/M MDM table; replace them with your team's criteria.
 */

const THREAT = 'Acute illness that poses a threat to bodily function';
const SYSTEMIC = 'Acute illness with systemic symptoms';

/** Problems level by diagnosis code. Diagnoses not listed count as below. */
const PROBLEM_BY_DX: Record<string, { level: MdmLevel; label: string }> = {
  'E11.10': { level: 3, label: THREAT },
  'N17.9': { level: 3, label: THREAT },
  'E87.5': { level: 2, label: SYSTEMIC },
  'E86.0': { level: 2, label: SYSTEMIC },
  'R11.2': { level: 2, label: SYSTEMIC },
};
const PROBLEM_DEFAULT = { level: 1 as MdmLevel, label: 'Acute, uncomplicated illness or injury' };

/** Tests that count as a unique test ordered or reviewed (Data, category 1). */
const TESTS = new Set(['80048', '80053', '82010', '82803', '82962', '85025', '81001', '83690']);
const ECG = new Set(['93000', '93005', '93010']);
/** IV fluids do not count as prescription drug management. */
const FLUIDS = new Set(['J7030', 'J7040', 'J7050', 'J7120']);

/** What the coder can mark when the record states something that has no code, and the MDM credit it gives. */
export const DOC_KINDS: Record<DocKind, { label: string; mdm: MdmTag | null }> = {
  hospitalization: { label: 'Decision regarding hospitalization', mdm: { el: 'risk', level: 3, label: 'Decision regarding hospitalization' } },
  externalDiscussion: { label: 'Discussion with external physician', mdm: { el: 'data', cat: 3, label: 'Discussion of management with external physician' } },
  independentInterpretation: { label: 'Independent interpretation of a test', mdm: { el: 'data', cat: 2, label: 'Independent interpretation of a test' } },
  externalNotes: { label: 'Review of external notes', mdm: { el: 'data', cat: 1, label: 'Review of prior external notes' } },
  independentHistorian: { label: 'Independent historian', mdm: { el: 'data', cat: 1, label: 'Assessment requiring an independent historian' } },
  sdoh: { label: 'Social determinants limit care', mdm: { el: 'risk', level: 2, label: 'Diagnosis or treatment limited by social determinants of health' } },
  other: { label: 'Other documentation', mdm: null },
};

/** The MDM credit a finding gives, derived from its type and code. */
export function mdmOf(f: Finding): MdmTag | null {
  switch (f.type) {
    case 'dx': {
      const p = (f.code && PROBLEM_BY_DX[f.code]) || PROBLEM_DEFAULT;
      return { el: 'problems', ...p };
    }
    case 'svc':
      if (f.code && ECG.has(f.code)) {
        return /independently interpret/i.test(f.text)
          ? { el: 'data', cat: 2, label: 'Independent interpretation of a test' }
          : { el: 'data', cat: 1, label: `Ordering of unique test (${f.desc ?? f.code})` };
      }
      return f.code && TESTS.has(f.code) ? { el: 'data', cat: 1, label: `Ordering of unique test (${f.desc ?? f.code})` } : null;
    case 'mar':
      return f.code && !FLUIDS.has(f.code) ? { el: 'risk', level: 2, label: 'Prescription drug management' } : null;
    case 'doc':
      return f.docKind ? DOC_KINDS[f.docKind].mdm : null;
    default:
      return null;
  }
}
