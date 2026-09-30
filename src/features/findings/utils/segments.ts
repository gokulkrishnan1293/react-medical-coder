import type { Finding } from '@/types';

export interface Segment {
  s: number;
  e: number;
  f: Finding;
}

/** Splits block text into plain strings and evidence ranges. Overlapping findings keep the first match. */
export function segments(text: string, fs: Finding[]): Array<string | Segment> {
  const ranges: Segment[] = [];
  for (const f of fs) {
    const i = text.indexOf(f.text);
    if (i < 0) continue;
    const r = { s: i, e: i + f.text.length, f };
    if (ranges.some((x) => r.s < x.e && x.s < r.e)) continue;
    ranges.push(r);
  }
  ranges.sort((a, b) => a.s - b.s);
  const out: Array<string | Segment> = [];
  let c = 0;
  for (const r of ranges) {
    if (r.s > c) out.push(text.slice(c, r.s));
    out.push(r);
    c = r.e;
  }
  if (c < text.length) out.push(text.slice(c));
  return out;
}
