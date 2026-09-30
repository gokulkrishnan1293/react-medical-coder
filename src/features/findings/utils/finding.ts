import type { Finding, Route } from '@/types';
import { BLOCKS, CLAIM_CODES, DOC_KINDS, mdmOf } from '@/data';
import { ELEMENT_SHORT, LEVELS_SHORT } from './labels';

/** Accepted or coder-added findings count as evidence. */
export const isLive = (f: Finding) => f.status === 'confirmed' || f.status === 'added';

/** Short tag for the MDM credit a finding gives, e.g. "PROB·H" or "DATA·C1". Derived, not stored. */
export function mdmTag(f: Finding): string {
  const m = mdmOf(f);
  if (!m) return '';
  return m.el === 'data' ? `DATA·C${m.cat}` : `${ELEMENT_SHORT[m.el]}·${LEVELS_SHORT[m.level ?? 0]}`;
}

/** Short tag drawn above the evidence box, e.g. "E11.10 · PROB·H" or "J2405 · MAR". */
export function tagOf(f: Finding): string {
  const parts: string[] = [];
  if (f.code) parts.push(f.code);
  const m = mdmTag(f);
  if (m) parts.push(m);
  if (f.type === 'mar') parts.push('MAR');
  if (f.type === 'time') parts.push('TIME');
  if (f.type === 'note') parts.push('NOTE');
  return parts.join(' · ') || codeLabel(f);
}

/** Main label of a finding in lists: its code, else its MDM tag or type. */
export function codeLabel(f: Finding): string {
  return f.code || mdmTag(f) || { doc: 'DOC', time: 'TIME', note: 'NOTE' }[f.type as string] || f.type.toUpperCase();
}

export function routeOf(f: Finding): Route {
  if (f.status === 'rejected') return 'excluded';
  if (f.type === 'note') return 'note';
  if (!f.code) return 'support';
  return CLAIM_CODES.has(f.code) ? 'onClaim' : 'notOnClaim';
}

export function titleOf(f: Finding): string {
  if (f.type === 'note') return f.note || 'Reviewer note';
  if (f.type === 'doc') return f.docKind ? DOC_KINDS[f.docKind].label : f.desc || 'Documentation';
  return f.desc || '';
}

/** Reading order: page, then block, then position within the block. */
export function orderKey(f: Finding): number {
  const b = BLOCKS[f.block];
  const off = b ? Math.max(0, b.t.indexOf(f.text)) : 0;
  return f.page * 1e6 + (b ? b.idx : 0) * 1e3 + off;
}

export const sortByReading = (fs: Finding[]) => [...fs].sort((a, b) => orderKey(a) - orderKey(b));

/** Codes that can be documented in more than one place. A MAR row is one administration, with its own units, so it never repeats. */
export const canHavePlaces = (f: Finding) => !!f.code && f.type !== 'mar' && f.type !== 'note';

/** Every place the record documents this finding's code: findings of the same type and code, in reading order. */
export const placesOf = (f: Finding, findings: Finding[]) =>
  canHavePlaces(f) ? sortByReading(findings.filter((x) => x.type === f.type && x.code === f.code)) : [f];

/**
 * On the claim, a finding is what was billed: the reviewer can accept or reject it and comment,
 * but not change its code or evidence. A comment is where they say the evidence is wrong.
 */
export const claimLocked = (f: Finding) => routeOf(f) === 'onClaim';

/**
 * Findings as review rows: the places documenting one code share a row, led by the first place still standing.
 * Findings that cannot have places (MAR rows, notes) are rows of their own.
 */
export function groupPlaces(ordered: Finding[]): { lead: Finding; places: Finding[] }[] {
  const rows = new Map<string, Finding[]>();
  for (const f of ordered) {
    const key = canHavePlaces(f) ? `${f.type}:${f.code}` : f.id;
    const row = rows.get(key);
    if (row) row.push(f);
    else rows.set(key, [f]);
  }
  return [...rows.values()].map((places) => ({ lead: places.find((p) => p.status !== 'rejected') ?? places[0], places }));
}

/**
 * CLAIRE's reason for a code: from its most confident place that gives one. Notes about a single place
 * (e.g. "assessment restates DKA") belong with that place instead.
 */
export function reasonOf(f: Finding, places: Finding[]) {
  if (f.type === 'note') return undefined;
  if (!canHavePlaces(f)) return f.source === 'ai' ? f.note : undefined;
  return places.filter((p) => p.source === 'ai' && p.note).sort((a, b) => (b.conf ?? 0) - (a.conf ?? 0))[0]?.note;
}
