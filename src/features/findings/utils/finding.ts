import type { Finding } from '@/types';
import { BLOCKS, CLAIM_CODES } from '@/data';
import { ELEMENT_SHORT, LEVELS_SHORT } from './labels';

/** Accepted or coder-added findings count as evidence. */
export const isLive = (f: Finding) => f.status === 'confirmed' || f.status === 'added';

export function mdmTag(f: Finding): string {
  if (!f.mdm) return '';
  return f.mdm.el === 'data' ? `DATA·C${f.mdm.cat}` : `${ELEMENT_SHORT[f.mdm.el]}·${LEVELS_SHORT[f.mdm.level ?? 0]}`;
}

/** Short tag drawn above the evidence box, e.g. "E11.65 · PROB·H". */
export function tagOf(f: Finding): string {
  const parts: string[] = [];
  if (f.code) parts.push(f.code);
  if (f.mdm) parts.push(mdmTag(f));
  if (f.type === 'time') parts.push('TIME');
  if (f.type === 'note') parts.push('NOTE');
  return parts.join(' · ');
}

export function codeLabel(f: Finding): string {
  return f.code || mdmTag(f) || (f.type === 'time' ? 'TIME' : 'NOTE');
}

export function routeOf(f: Finding) {
  if (f.status === 'rejected') return 'excluded' as const;
  if (f.type === 'time' || f.type === 'note') return 'info' as const;
  if (f.code && !CLAIM_CODES.has(f.code)) return 'notOnClaim' as const;
  return 'onClaim' as const;
}

export function titleOf(f: Finding): string {
  if (f.type === 'note') return f.note || 'Reviewer note';
  if (f.mdm && !f.code) return f.mdm.label;
  return f.desc || '';
}

/** Reading order: page, then block, then position within the block. */
export function orderKey(f: Finding): number {
  const b = BLOCKS[f.block];
  const off = b ? Math.max(0, b.t.indexOf(f.text)) : 0;
  return f.page * 1e6 + (b ? b.idx : 0) * 1e3 + off;
}

export const sortByReading = (fs: Finding[]) => [...fs].sort((a, b) => orderKey(a) - orderKey(b));
