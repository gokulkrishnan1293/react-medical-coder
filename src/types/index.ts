/* Shared domain types for the review workbench. */

export type FindingType = 'dx' | 'px' | 'mdm' | 'time' | 'note';
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

export interface Finding {
  id: string;
  page: number;
  block: string;
  /** Exact words in the record the finding is anchored to. */
  text: string;
  type: FindingType;
  code?: string;
  desc?: string;
  mdm?: MdmTag;
  status: FindingStatus;
  source: FindingSource;
  conf?: number;
  /** Billed code this finding replaces, e.g. I12.9 replaces I10. */
  replaces?: string;
  note?: string;
}

/** Where a finding lands in the review. */
export type Route = 'onClaim' | 'notOnClaim' | 'info' | 'excluded';

export type BlockKind = 'org' | 'sub' | 'title' | 'meta' | 'h' | 'p' | 'li';

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

export interface CaseInfo {
  id: string;
  patient: string;
  mrn: string;
  payer: string;
  claim: string;
  dos: string;
  billed: string;
  paid: string;
  carc: string;
  carcText: string;
  stage: string;
  due: string;
  daysLeft: number;
  provider: string;
  practice: string;
}

export interface ClaimLine {
  code: string;
  desc: string;
  paid: string;
}

export type CodeKind = 'dx' | 'px';

export interface CodeEntry {
  code: string;
  kind: CodeKind;
  desc: string;
  kw: string;
}

export interface MdmOption {
  el: MdmElement;
  level?: MdmLevel;
  cat?: DataCategory;
  label: string;
  kw: string[];
}

export interface MdmSummary {
  prob: MdmLevel;
  data: MdmLevel;
  risk: MdmLevel;
  c1: number;
  overall: MdmLevel;
  code: string;
}
