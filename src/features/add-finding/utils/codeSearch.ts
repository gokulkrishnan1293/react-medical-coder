import type { CodeKind, MdmOption } from '@/types';
import { CODES, MDM_OPTIONS } from '@/data';

/** Keyword search over the demo code dictionary, pre-filled from the selected words. */
export function searchCodes(q: string, kind: CodeKind) {
  const toks = q.toLowerCase().replace(/[^a-z0-9.\- ]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
  const scored = CODES.filter((d) => d.kind === kind).map((d) => {
    const hay = `${d.code} ${d.desc} ${d.kw}`.toLowerCase();
    let s = 0;
    toks.forEach((t) => { if (hay.includes(t)) s += t.length > 5 ? 2 : 1; });
    if (toks.some((t) => d.code.toLowerCase() === t)) s += 10;
    return { ...d, s };
  });
  const hits = scored.filter((d) => d.s > 0).sort((a, b) => b.s - a.s);
  return (hits.length ? hits : scored).slice(0, 6);
}

export type RankedMdm = MdmOption & { suggested: boolean };

/** MDM descriptors ranked by keyword match; the top match is marked suggested. */
export function rankMdm(text: string): RankedMdm[] {
  const t = text.toLowerCase();
  return MDM_OPTIONS
    .map((o, i) => ({ o, i, s: o.kw.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(({ o, s }, i) => ({ ...o, suggested: i === 0 && s > 0 }));
}
