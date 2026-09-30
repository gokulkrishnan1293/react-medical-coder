import type { SavedReview } from '@/types';

/*
 * The only way the app reads and writes review data. In `npm run dev` it calls the dev server, which keeps
 * review.json in the case folder; a static build (no server) keeps it in this browser instead. Pointing the
 * app at the real backend later means changing this file only (docs/DATA-SPEC.md §4).
 */

type Draft = Omit<SavedReview, 'revision' | 'savedAt'>;

export interface ReviewApi {
  getReview(caseId: string): Promise<SavedReview | null>;
  saveReview(caseId: string, review: Draft, opts?: { keepalive?: boolean }): Promise<{ revision: number; savedAt: string }>;
  resetReview(caseId: string): Promise<void>;
  /** Where saved work goes, for the save status. */
  where: string;
}

const url = (id: string) => `/api/cases/${encodeURIComponent(id)}/review`;

const http: ReviewApi = {
  where: 'the case folder (review.json)',
  async getReview(id) {
    const r = await fetch(url(id));
    if (r.status === 204 || r.status === 404) return null;
    if (!r.ok) throw new Error(`Could not load the saved review (${r.status})`);
    return r.json();
  },
  async saveReview(id, review, opts) {
    const r = await fetch(url(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review), keepalive: opts?.keepalive });
    if (!r.ok) throw new Error(`Save failed (${r.status})`);
    return r.json();
  },
  async resetReview(id) {
    const r = await fetch(url(id), { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw new Error(`Reset failed (${r.status})`);
  },
};

const key = (id: string) => `claire-review.review.${id}`;
const local: ReviewApi = {
  where: 'this browser',
  async getReview(id) {
    try { const t = localStorage.getItem(key(id)); return t ? JSON.parse(t) : null; } catch { return null; }
  },
  async saveReview(id, review) {
    const prev = await local.getReview(id);
    const saved: SavedReview = { ...review, revision: (prev?.revision ?? 0) + 1, savedAt: new Date().toISOString() };
    localStorage.setItem(key(id), JSON.stringify(saved));
    return { revision: saved.revision, savedAt: saved.savedAt };
  },
  async resetReview(id) {
    try { localStorage.removeItem(key(id)); } catch { /* storage blocked: nothing saved */ }
  },
};

export const api: ReviewApi = import.meta.env.DEV ? http : local;
