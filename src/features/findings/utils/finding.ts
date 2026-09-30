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
