import type { Finding, MdmLevel, MdmSummary } from '@/types';
import { CASE } from '@/data';
import { isLive } from './finding';

/**
 * Scores MDM from findings. Only accepted and coder-added findings count,
 * unless includeAi is set (used to show "AI has more").
 * The visit level is the second-highest element level (2 of 3 rule).
 */
export function summarize(findings: Finding[], includeAi = false): MdmSummary {
  const live = findings.filter((f) => f.mdm && (isLive(f) || (includeAi && f.status === 'ai')));
  const max = (el: string) =>
    live.filter((f) => f.mdm!.el === el).reduce<number>((m, f) => Math.max(m, f.mdm!.level ?? 0), 0) as MdmLevel;
  const d = live.filter((f) => f.mdm!.el === 'data');
  const c1 = d.filter((f) => f.mdm!.cat === 1).length;
  const cats = (c1 >= 3 ? 1 : 0) + (d.some((f) => f.mdm!.cat === 2) ? 1 : 0) + (d.some((f) => f.mdm!.cat === 3) ? 1 : 0);
  const data: MdmLevel = cats >= 2 ? 3 : cats >= 1 ? 2 : c1 >= 2 ? 1 : 0;
  const prob = max('problems');
  const risk = max('risk');
  const overall = [prob, data, risk].sort((a, b) => b - a)[1] as MdmLevel;
  return { prob, data, risk, c1, overall, code: CASE.levelCodes[overall] };
}
