import type { CodeKind } from '@/types';
import { CODES } from '@/data';

/** Keyword search over the demo code dictionary, pre-filled from the selected words. */
export function searchCodes(q: string, kind: CodeKind) {
  const toks = q.toLowerCase().replace(/[^a-z0-9.%\- ]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
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

const UNIT_FAMILY: Record<string, string> = { mg: 'mg', ml: 'ml', cc: 'ml', meq: 'meq', units: 'units', unit: 'units' };

function amount(s: string) {
  const m = s.toLowerCase().match(/([\d.]+)\s*(mg|ml|cc|meq|units?)\b/);
  return m ? { n: parseFloat(m[1]), u: UNIT_FAMILY[m[2]] } : null;
}

/** Billing units for a dose against a drug code's unit, e.g. 20 mEq at "2 mEq" → 10. Falls back to 1. */
export function billingUnits(dose: string, per?: string) {
  const d = amount(dose);
  const p = per ? amount(per) : null;
  if (!d || !p || d.u !== p.u || !p.n) return 1;
  return Math.max(1, Math.ceil(d.n / p.n));
}
