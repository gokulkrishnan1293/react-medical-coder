/* Shared domain types for the review workbench. */

/**
 * dx: ICD-10-CM · svc: service performed, CPT/HCPCS when separately billable · mar: medication administration (HCPCS drug code)
 * · doc: something the record states that has no code, e.g. a decision to admit · note: the reviewer's own note.
 * MDM and ED interventions are not finding types: they are derived from these.
 */
export type FindingType = 'dx' | 'svc' | 'mar' | 'doc' | 'time' | 'note';
/** Kinds of code-less documentation that count toward MDM. */
export type DocKind = 'hospitalization' | 'externalDiscussion' | 'independentInterpretation' | 'externalNotes' | 'independentHistorian' | 'sdoh' | 'other';
export type FindingStatus = 'ai' | 'confirmed' | 'added' | 'rejected';
export type FindingSource = 'ai' | 'coder';
export type MdmElement = 'problems' | 'data' | 'risk';
/** 0 Straightforward · 1 Low · 2 Moderate · 3 High */
export type MdmLevel = 0 | 1 | 2 | 3;
export type DataCategory = 1 | 2 | 3;

/** MDM credit a finding gives. Derived from the finding, never stored on it. */
export interface MdmTag {
  el: MdmElement;
  level?: MdmLevel;
  cat?: DataCategory;
  label: string;
}

/** One administration from the MAR. */
export interface MarEntry {
  time: string;
  drug: string;
  dose: string;
  route: string;
  /** Billing units of the HCPCS drug code. */
  units?: number;
}

export interface Finding {
  id: string;
  page: number;
  block: string;
  /** Exact words in the record the finding is anchored to. For MAR rows, the whole row. */
  text: string;
  type: FindingType;
  code?: string;
  desc?: string;
  /** For documentation findings: what the statement is. */
  docKind?: DocKind;
  mar?: MarEntry;
  status: FindingStatus;
  source: FindingSource;
  conf?: number;
  /** The code before the coder changed it. */
  editedFrom?: string;
  /** Description of that original code. */
  editedFromDesc?: string;
  /** Where the evidence pointed before the coder moved it. */
  movedFrom?: Pick<Finding, 'page' | 'block' | 'text'>;
  /** Billed code this finding replaces, e.g. E11.10 replaces E11.65. */
  replaces?: string;
  note?: string;
  /** Coder's remark on this finding. */
  comment?: string;
}

/** Where a finding lands in the review. */
export type Route = 'onClaim' | 'notOnClaim' | 'support' | 'note' | 'excluded';

/**
 * 'mar' blocks are MAR table rows with cells separated by " | "; 'marHead' is the header row. 'thead' and 'tr' are
 * rows of any other table (cells also joined with " | " in `t`), grouped by `table`. 'h3' is a third-level or
 * smaller heading, 'quote' a blockquote, 'hr' a horizontal rule (no text), 'code' a code block (newlines kept).
 */
export type BlockKind = 'org' | 'sub' | 'title' | 'meta' | 'h' | 'h3' | 'p' | 'li' | 'quote' | 'hr' | 'code' | 'marHead' | 'mar' | 'thead' | 'tr';

/** Inline formatting over a range of a block's plain text. */
export interface TextSpan {
  s: number;
  e: number;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strike?: boolean;
  href?: string;
}

/** One cell of a table row: where it sits in the row's text, and its column alignment. */
export interface TableCell {
  s: number;
  e: number;
  align?: 'left' | 'center' | 'right';
  /** Columns and rows the cell spans (HTML colspan / rowspan), for grouped, multi-level headers. */
  colSpan?: number;
  rowSpan?: number;
}

export interface Block {
  id: string;
  k: BlockKind;
  /** Plain text: what findings and flags anchor to, and what the scan and search see. */
  t: string;
  idx: number;
  page: number;
  /** Bold, italic, code, strike and links over `t`. */
  spans?: TextSpan[];
  /** Table rows: the cells, in order. */
  cells?: TableCell[];
  /** Table rows: which table on the page they belong to. */
  table?: string;
  /** List items: numbered or not, the number, nesting depth (0 top level), checkbox state. */
  list?: { ordered: boolean; n: number; depth: number; checked?: boolean };
  /** Laid out in columns on the page: which column group, which column (0 first), and how many there are. */
  cols?: { group: string; col: number; of: number };
}

export interface RecordPage {
  n: number;
  label: string;
  blocks: Block[];
}

export interface Patient {
  name: string;
  memberId: string;
  mrn: string;
  dob: string;
  age: number;
  sex: 'M' | 'F';
  plan: string;
}

export interface Encounter {
  setting: string;
  facility: string;
  attending: string;
  dos: string;
  arrival: string;
  departure: string;
  disposition: string;
  /** Reason for visit as the record states it (chief complaint). */
  reason: string;
}

export interface CaseInfo {
  id: string;
  stage: 'Reconsideration' | 'Appeal';
  received: string;
  due: string;
  daysLeft: number;
  payer: string;
  /** Visit level billed and the level it was paid at. */
  billed: string;
  paid: string;
  /** Visit codes for Straightforward, Low, Moderate, High MDM. */
  levelCodes: [string, string, string, string];
}

export type CodeKind = 'dx' | 'svc' | 'drug';

export interface ClaimDx {
  /** Diagnosis pointer letter on the claim. */
  pointer: string;
  code: string;
  desc: string;
  principal?: boolean;
}

export interface ClaimLine {
  line: number;
  rev: string;
  code: string;
  desc: string;
  kind: 'svc' | 'drug';
  units: number;
  modifiers?: string[];
  dxPointers: string;
  charge: number;
  paidCode: string;
  paidUnits: number;
}

export interface Claim {
  id: string;
  source: 'ERDM';
  form: string;
  billType: string;
  /** Patient as billed. */
  patient: { name: string; dob: string };
  /** Date of service as billed. */
  dos: string;
  /** Patient's reason for visit diagnosis (UB-04 FL 70). */
  reasonDx: string;
  lines: ClaimLine[];
  dx: ClaimDx[];
}

export interface CodeEntry {
  code: string;
  kind: CodeKind;
  desc: string;
  kw: string;
  /** Drug codes: amount per billing unit, e.g. "1 mg". */
  per?: string;
}

export interface MdmSummary {
  prob: MdmLevel;
  data: MdmLevel;
  risk: MdmLevel;
  c1: number;
  overall: MdmLevel;
  code: string;
}

/** Someone who reviews cases. */
export interface Reviewer {
  id: string;
  name: string;
  initials: string;
}

export type WorkStatus = 'new' | 'inProgress' | 'completed';
/** Upheld: the downcode stands. Overturned: the record supports what was billed. */
export type Outcome = 'upheld' | 'overturned';

/** One case in the worklist. */
export interface WorkItem {
  id: string;
  stage: CaseInfo['stage'];
  patient: string;
  /** Number of the medical record document sent for review. */
  documentId: string;
  claimId: string;
  payer: string;
  billed: string;
  paid: string;
  /** ISO dates. */
  received: string;
  due: string;
  status: WorkStatus;
  /** Reviewer the case is assigned to, or null when unassigned. */
  assignee: string | null;
  /** A reviewer has the case open right now; nobody else can open it. */
  openBy?: { reviewer: string; since: string };
  completedAt?: string;
  completedBy?: string;
  outcome?: Outcome;
  /** Minutes spent reviewing so far (all of it, once completed). */
  minutes?: number;
  /** Those minutes by day (YYYY-MM-DD), for the time-by-day chart. */
  minutesByDay?: Record<string, number>;
  /** What happened to CLAIRE's suggestions on this case, counted per code. */
  claire?: ClaireTally;
  /** The case's record and findings are loaded in this prototype. */
  available?: boolean;
}

/** What the reviewer did with CLAIRE's suggestions, counted per code (all places of a code are one suggestion). */
export interface ClaireTally {
  /** Kept as CLAIRE suggested. */
  accepted: number;
  /** Kept, but with the code changed or the evidence moved. */
  modified: number;
  rejected: number;
  /** Still an AI suggestion nobody has reviewed. */
  pending: number;
  /** Findings the reviewer added that CLAIRE did not suggest. */
  added: number;
}

/** Fields of one of CLAIRE's findings that a review can change. */
export type FindingDecision = { [K in 'status' | 'code' | 'desc' | 'editedFrom' | 'editedFromDesc' | 'page' | 'text' | 'movedFrom' | 'comment']?: Finding[K] | null };

/**
 * The reviewer's work on one case (cases/<id>/review.json): only what differs from CLAIRE's findings.json,
 * the findings the reviewer added, and the review itself. CLAIRE's files are never changed.
 */
export interface SavedReview {
  schemaVersion: 1;
  caseId: string;
  /** Set by the server on each save. */
  revision: number;
  savedAt: string;
  /** timeByDay: seconds spent in the workbench on each day (YYYY-MM-DD). */
  review: { status: 'inProgress' | 'completed'; comment: string; completedAt: string | null; timeByDay: Record<string, number> };
  /** Changes to CLAIRE's findings, by finding ID. `null` means the field was cleared. */
  decisions: Record<string, FindingDecision>;
  /** Findings the reviewer added, without their block (found again from page and text on load). */
  added: Omit<Finding, 'block'>[];
}

/**
 * A problem with how the original document was extracted to record.md, flagged by the reviewer:
 * formatting (layout wrong: a table broken up, a heading lost), data (text differs from the scan: a misread
 * number, dose or date), or missing (something on the original is not in the extracted text).
 */
export type ExtractionKind = 'formatting' | 'data' | 'missing';

export interface ExtractionFlag {
  id: string;
  kind: ExtractionKind;
  page: number;
  /** Selected words the flag is about, exactly as the record shows them. Missing content has none. */
  text?: string;
  /** Start of the paragraph the flag sits by, to find it again when there are no words (missing content). */
  near?: string;
  /** What the original actually shows or what is missing, in the reviewer's words. */
  shouldRead?: string;
  comment?: string;
  /** The reviewer's own screenshot (pasted, dropped or chosen), as a JPEG data URL. */
  screenshot?: string;
  createdAt: string;
  /** Resolved from page and words when loaded; not saved. */
  block?: string;
}

/** cases/<id>/extraction.json: the reviewer's extraction flags, kept apart from the review. */
export interface SavedExtraction {
  schemaVersion: 1;
  caseId: string;
  revision: number;
  savedAt: string;
  flags: Omit<ExtractionFlag, 'block'>[];
}
