import type { Finding, FindingDecision, SavedReview } from '@/types';

/* Between the stores and review.json: only the difference from CLAIRE's findings is saved. */

const KEYS = ['status', 'code', 'desc', 'editedFrom', 'editedFromDesc', 'page', 'text', 'movedFrom', 'comment'] as const;

export interface ReviewState {
  status: 'inProgress' | 'completed';
  comment: string;
  completedAt: Date | null;
  timeByDay: Record<string, number>;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** The review as saved: each of CLAIRE's findings reduced to the fields that changed, plus added findings. */
export function toSavedReview(caseId: string, original: Finding[], current: Finding[], r: ReviewState): Omit<SavedReview, 'revision' | 'savedAt'> {
  const byId = new Map(original.map((f) => [f.id, f]));
  const decisions: Record<string, FindingDecision> = {};
  const added: SavedReview['added'] = [];
  for (const f of current) {
    const o = byId.get(f.id);
    if (!o || f.source === 'coder') {
      const { block: _block, ...rest } = f;
      added.push(rest);
      continue;
    }
    const d: FindingDecision = {};
    for (const k of KEYS) if (!same(f[k], o[k])) (d as Record<string, unknown>)[k] = f[k] ?? null;
    if (Object.keys(d).length) decisions[f.id] = d;
  }
  return {
    schemaVersion: 1,
    caseId,
    review: { status: r.status, comment: r.comment, completedAt: r.completedAt?.toISOString() ?? null, timeByDay: r.timeByDay },
    decisions,
    added,
  };
}

/**
 * CLAIRE's findings with a saved review applied. Words are found again in the record (`locate`), so an edited
 * record.md or findings.json never breaks the case: what no longer fits is left out and listed in `notices`.
 */
export function applySavedReview(
  original: Finding[],
  saved: SavedReview,
  locate: (page: number, text: string) => string | null,
): { findings: Finding[]; review: ReviewState; notices: string[] } {
  const notices: string[] = [];
  const ids = new Set(original.map((f) => f.id));
  const gone = Object.keys(saved.decisions).filter((id) => !ids.has(id));
  if (gone.length) notices.push(`Saved decisions for ${gone.join(', ')} were left out: those findings are no longer in findings.json.`);

  const findings = original.map((o) => {
    const d = saved.decisions[o.id];
    if (!d) return o;
    const f: Record<string, unknown> = { ...o };
    for (const [k, v] of Object.entries(d)) {
      if (v === null) delete f[k];
      else f[k] = v;
    }
    const moved = f as unknown as Finding;
    if (d.page !== undefined || d.text !== undefined) {
      const block = locate(moved.page, moved.text);
      if (block) return { ...moved, block };
      notices.push(`Moved evidence for ${o.id} is no longer in the record; CLAIRE's evidence is used.`);
      return { ...moved, page: o.page, text: o.text, block: o.block, movedFrom: undefined };
    }
    return moved;
  });
  for (const a of saved.added) {
    const block = locate(a.page, a.text);
    if (block) findings.push({ ...a, block });
    else notices.push(`A finding you added (${a.code ?? a.type}, page ${a.page}) is no longer in the record and was left out.`);
  }
  const r = saved.review;
  return {
    findings,
    review: { status: r.status, comment: r.comment, completedAt: r.completedAt ? new Date(r.completedAt) : null, timeByDay: r.timeByDay ?? {} },
    notices,
  };
}
