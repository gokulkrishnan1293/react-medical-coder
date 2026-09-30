import type { Finding, MdmLevel, MdmSummary } from '@/types';
import { CASE, mdmOf } from '@/data';
import { isLive } from './finding';

/**
 * Scores MDM from findings. Each finding's credit is derived from what it is (see mdmOf):
 * Problems from diagnoses, Data from tests and documented review, Risk from drugs and documented decisions.
 * Only accepted and coder-added findings count,
 * unless includeAi is set (used to show "AI has more").
 * The visit level is the second-highest element level (2 of 3 rule).
 */
export function summarize(findings: Finding[], includeAi = false): MdmSummary {
  const live = findings.flatMap((f) => {
    const m = (isLive(f) || (includeAi && f.status === 'ai')) && mdmOf(f);
    return m ? [m] : [];
  });
  const max = (el: string) =>
    live.filter((m) => m.el === el).reduce<number>((acc, m) => Math.max(acc, m.level ?? 0), 0) as MdmLevel;
  const d = live.filter((m) => m.el === 'data');
  const c1 = d.filter((m) => m.cat === 1).length;
  const cats = (c1 >= 3 ? 1 : 0) + (d.some((m) => m.cat === 2) ? 1 : 0) + (d.some((m) => m.cat === 3) ? 1 : 0);
  const data: MdmLevel = cats >= 2 ? 3 : cats >= 1 ? 2 : c1 >= 2 ? 1 : 0;
  const prob = max('problems');
  const risk = max('risk');
  const overall = [prob, data, risk].sort((a, b) => b - a)[1] as MdmLevel;
  return { prob, data, risk, c1, overall, code: CASE.levelCodes[overall] };
}
