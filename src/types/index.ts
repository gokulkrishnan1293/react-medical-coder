/* Shared domain types for the review workbench. */

/** dx: ICD-10-CM · svc: CPT/HCPCS service · mar: medication administration (HCPCS drug code) · intervention: ED intervention */
export type FindingType = 'dx' | 'svc' | 'mar' | 'intervention' | 'mdm' | 'time' | 'note';
export type FindingStatus = 'ai' | 'confirmed' | 'added' | 'rejected';
export type FindingSource = 'ai' | 'coder';
export type MdmElement = 'problems' | 'data' | 'risk';
/** 0 Straightforward · 1 Low · 2 Moderate · 3 High */
export type MdmLevel = 0 | 1 | 2 | 3;
export type DataCategory = 1 | 2 | 3;

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
  mdm?: MdmTag;
  mar?: MarEntry;
  status: FindingStatus;
  source: FindingSource;
  conf?: number;
  /** Billed code this finding replaces, e.g. E11.10 replaces E11.65. */
  replaces?: string;
  note?: string;
  /** Coder's remark on this finding. */
  comment?: string;
}

/** Where a finding lands in the review. */
export type Route = 'onClaim' | 'notOnClaim' | 'support' | 'note' | 'excluded';

/** 'mar' blocks are MAR table rows with cells separated by " | "; 'marHead' is the header row. */
export type BlockKind = 'org' | 'sub' | 'title' | 'meta' | 'h' | 'p' | 'li' | 'marHead' | 'mar';

export interface Block {
  id: string;
  k: BlockKind;
  t: string;
  idx: number;
  page: number;
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
  carc: string;
  carcText: string;
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
