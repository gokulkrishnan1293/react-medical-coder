import type { Block, Claim, Finding, RecordPage } from '@/types';
import { CURRENT, type RawFinding } from './caseFolders';
import { parseRecord } from './markdown';

/*
 * The case this page load shows, from its folder (src/data/cases/<id>/): case, patient and encounter from
 * case.json, the claim from claim.json, the record pages from record.md, and CLAIRE's findings from
 * findings.json anchored to those pages. The rest of the app imports these names through @/data.
 */

export const CASE = CURRENT.file.case;
export const PATIENT = CURRENT.file.patient;
export const ENCOUNTER = CURRENT.file.encounter;
/** Record page each checkpoint-bar field comes from. */
export const SOURCE_PAGES = { name: 1, dob: 1, dos: 1, reason: 1, ...CURRENT.file.sourcePages };

export const CLAIM: Claim = CURRENT.claim;
/** Every code on the claim: service lines and diagnoses. */
export const CLAIM_CODES = new Set([...CLAIM.lines.map((l) => l.code), ...CLAIM.dx.map((d) => d.code)]);

export const PAGES: RecordPage[] = parseRecord(CURRENT.record);
export const BLOCKS: Record<string, Block> = Object.fromEntries(PAGES.flatMap((p) => p.blocks.map((b) => [b.id, b] as const)));
/** Splits a MAR row into its cells. */
export const marCells = (t: string) => t.split(' | ');

/** The block on `page` holding `text` (its `occurrence`-th appearance on that page), or null. */
export function locate(page: number, text: string, occurrence = 1): string | null {
  let seen = 0;
  for (const b of PAGES.find((x) => x.n === page)?.blocks ?? []) {
    let from = 0;
    for (let i = b.t.indexOf(text, from); i >= 0 && text; i = b.t.indexOf(text, from)) {
      if (++seen === occurrence) return b.id;
      from = i + text.length;
    }
  }
  return null;
}

function anchor(f: RawFinding): Finding[] {
  const { occurrence, ...rest } = f;
  const block = locate(f.page, f.text, occurrence);
  if (!block) {
    console.warn(`[cases] ${CURRENT.id} findings.json: "${f.id}" text not found on page ${f.page}: "${f.text}". Left out.`);
    return [];
  }
  return [{ ...rest, block, source: 'ai' }];
}

/** CLAIRE's findings as generated, before any review. */
export const INITIAL_FINDINGS: Finding[] = (CURRENT.findings ?? []).flatMap(anchor);

/** Printed at the foot of each record page. */
export const PRINT_FOOTER = `Printed from EHR · ${ENCOUNTER.facility}`;
