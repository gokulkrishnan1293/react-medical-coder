import type { CaseInfo, ClaireTally, Claim, Encounter, Finding, Outcome, Patient, WorkStatus } from '@/types';

/*
 * Case folders: src/data/cases/<case id>/ holds everything about one case (see src/data/cases/README.md).
 * Every folder is picked up when the app builds; adding a case means adding a folder, never code.
 *
 *   case.json      case, patient and encounter as the record states them, plus its worklist entry
 *   claim.json     the claim as ERDM returned it
 *   record.md      the extracted record, pages marked <!-- Page: n -->
 *   findings.json  CLAIRE's findings, anchored to record.md (optional)
 *   images/        original page images, page-001.png … (optional)
 *
 * For now the open case comes from the address (/cases/<id>) when the page loads, so opening another case
 * reloads the page. docs/DATA-SPEC.md describes loading them through the API instead.
 */

/** Worklist fields of case.json. Dates are relative to today so the mock stays current. */
export interface CaseWorklist {
  documentId: string;
  status: WorkStatus;
  receivedDaysAgo: number;
  dueInDays: number;
  /** Completed today at this time, HH:MM. */
  completedToday?: string;
  /** Completed that many days ago (at 16:00). */
  completedDaysAgo?: number;
  outcome?: Outcome;
  /** Review sessions before today's live time: how many days ago, and minutes. */
  sessions?: { daysAgo: number; minutes: number }[];
  /** CLAIRE counts to show until the case has findings.json. */
  claire?: ClaireTally;
}

export interface CaseFile {
  case: CaseInfo;
  patient: Patient;
  encounter: Encounter;
  sourcePages?: Partial<Record<'name' | 'dob' | 'dos' | 'reason', number>>;
  worklist: CaseWorklist;
}

/** A finding as CLAIRE writes it: no block (resolved from the record) and no source (always CLAIRE). */
export type RawFinding = Omit<Finding, 'block' | 'source'> & { occurrence?: number };

export interface CaseFolder {
  id: string;
  file: CaseFile;
  claim: Claim;
  record: string;
  findings: RawFinding[] | null;
  /** Image URL by page number. */
  images: Record<number, string>;
}

const at = (dir: string) => /\/cases\/([^/]+)\//.exec(dir)?.[1] ?? '';
const CASE_JSON = import.meta.glob<CaseFile>('./cases/*/case.json', { eager: true, import: 'default' });
const CLAIM_JSON = import.meta.glob<Claim>('./cases/*/claim.json', { eager: true, import: 'default' });
const RECORD_MD = import.meta.glob<string>('./cases/*/record.md', { eager: true, query: '?raw', import: 'default' });
const FINDINGS_JSON = import.meta.glob<{ findings: RawFinding[] }>('./cases/*/findings.json', { eager: true, import: 'default' });
const IMAGES = import.meta.glob<string>('./cases/*/images/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}', { eager: true, query: '?url', import: 'default' });

const byCase = <T,>(files: Record<string, T>) => Object.fromEntries(Object.entries(files).map(([path, v]) => [at(path), v]));
const claims = byCase(CLAIM_JSON);
const records = byCase(RECORD_MD);
const findings = byCase(FINDINGS_JSON);

function imagesOf(id: string) {
  const out: Record<number, string> = {};
  for (const [path, url] of Object.entries(IMAGES)) {
    if (at(path) !== id) continue;
    const n = Number(/(\d+)\.[a-z]+$/i.exec(path)?.[1]);
    if (n) out[n] = url;
  }
  return out;
}

/** Every case folder that has the three files a case needs, by case ID. */
export const CASE_FOLDERS: Record<string, CaseFolder> = Object.fromEntries(
  Object.entries(CASE_JSON).flatMap(([path, file]) => {
    const id = at(path);
    const missing = [!claims[id] && 'claim.json', !records[id] && 'record.md'].filter(Boolean);
    if (missing.length) {
      console.warn(`[cases] ${id}: missing ${missing.join(', ')}; the case is left out`);
      return [];
    }
    if (file.case.id !== id) console.warn(`[cases] ${id}: case.json says "${file.case.id}"; the folder name is used`);
    return [[id, { id, file: { ...file, case: { ...file.case, id } }, claim: claims[id], record: records[id], findings: findings[id]?.findings ?? null, images: imagesOf(id) }]];
  }),
);

export const DEFAULT_CASE_ID = 'RC-2026-1187';

/** The case this page load shows: from /cases/<id> in the address, else the demo case. */
export const CURRENT_CASE_ID = (() => {
  const id = typeof location === 'undefined' ? '' : decodeURIComponent(/^\/cases\/([^/]+)/.exec(location.pathname)?.[1] ?? '');
  return CASE_FOLDERS[id] ? id : DEFAULT_CASE_ID;
})();

export const CURRENT: CaseFolder = CASE_FOLDERS[CURRENT_CASE_ID] ?? Object.values(CASE_FOLDERS)[0];
