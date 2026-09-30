import type { CodeEntry, DocKind, Finding, MdmLevel, MdmTag, Reviewer } from '@/types';
import codesFile from './reference/codes.json';
import mdmFile from './reference/mdm.json';
import interventionsFile from './reference/interventions.json';
import userFile from './reference/user.json';

/*
 * Reference data shared by every case, read from src/data/reference/*.json. Nothing here is case data;
 * change the JSON, not this file.
 *
 *   codes.json          codes the search offers
 *   mdm.json            MDM levels by diagnosis, tests that count, documentation kinds (placeholder criteria)
 *   interventions.json  what counts as each ED intervention (placeholder criteria)
 *   user.json           the signed-in reviewer
 */

// ── codes ────────────────────────────────────────────────────────────────────

export const CODES = codesFile.codes as CodeEntry[];

// ── the reviewer ─────────────────────────────────────────────────────────────

export const ME: Reviewer = userFile.me;
/** Everyone who reviews cases. Just the signed-in user for now; locking (`openBy`) needs a second reviewer to show. */
export const REVIEWERS: Reviewer[] = [ME];
export const reviewerById = (id?: string | null) => REVIEWERS.find((r) => r.id === id);

// ── MDM ──────────────────────────────────────────────────────────────────────

type Problem = { level: MdmLevel; label: string };
const PROBLEM_BY_DX = mdmFile.problemByDx as Record<string, Problem>;
const PROBLEM_DEFAULT = mdmFile.problemDefault as Problem;
const TESTS = new Set(mdmFile.tests);
const ECG = new Set(mdmFile.ecg);
/** IV fluids do not count as prescription drug management. */
const FLUIDS = new Set(mdmFile.fluids);

/** What the coder can mark when the record states something that has no code, and the MDM credit it gives. */
export const DOC_KINDS = mdmFile.docKinds as Record<DocKind, { label: string; mdm: MdmTag | null }>;

/**
 * The MDM credit a finding gives, derived from its type and code with the mdm.json tables.
 * Problems ← diagnoses · Data ← tests and documented review · Risk ← drugs given and documented decisions.
 */
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

// ── interventions ────────────────────────────────────────────────────────────

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

type RawCondition = { kind: 'code'; codes: string[]; label: string } | { kind: 'text' | 'route'; pattern: string; flags?: string; label: string };

/** Rules from interventions.json, with their patterns compiled. A pattern that does not compile drops that condition. */
export const INTERVENTION_RULES: InterventionRule[] = (interventionsFile.rules as (Omit<InterventionRule, 'anyOf'> & { anyOf: RawCondition[] })[]).map((r) => ({
  ...r,
  anyOf: r.anyOf.flatMap((c): Condition[] => {
    if (c.kind === 'code') return [c];
    try {
      return [{ kind: c.kind, pattern: new RegExp(c.pattern, c.flags), label: c.label }];
    } catch {
      console.warn(`[reference] interventions.json: rule "${r.id}" has a pattern that does not compile: ${c.pattern}`);
      return [];
    }
  }),
}));
