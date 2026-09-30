import type { SavedExtraction, SavedReview } from '@/types';

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
  /** The reviewer's extraction flags: a document of their own (extraction.json), apart from the review. */
  getExtraction(caseId: string): Promise<SavedExtraction | null>;
  saveExtraction(caseId: string, doc: Omit<SavedExtraction, 'revision' | 'savedAt'>, opts?: { keepalive?: boolean }): Promise<{ revision: number; savedAt: string }>;
  resetExtraction(caseId: string): Promise<void>;
  /** Where saved work goes, for the save status. */
  where: string;
}

const url = (id: string, doc: 'review' | 'extraction' = 'review') => `/api/cases/${encodeURIComponent(id)}/${doc}`;

async function httpGet<T>(id: string, doc: 'review' | 'extraction'): Promise<T | null> {
  const r = await fetch(url(id, doc));
  if (r.status === 204 || r.status === 404) return null;
  if (!r.ok) throw new Error(`Could not load ${doc}.json (${r.status})`);
  return r.json();
}
async function httpPut(id: string, doc: 'review' | 'extraction', body: unknown, keepalive?: boolean) {
  const r = await fetch(url(id, doc), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
  if (!r.ok) throw new Error(`Save failed (${r.status})`);
  return r.json() as Promise<{ revision: number; savedAt: string }>;
}
async function httpDelete(id: string, doc: 'review' | 'extraction') {
  const r = await fetch(url(id, doc), { method: 'DELETE' });
  if (!r.ok && r.status !== 404) throw new Error(`Reset failed (${r.status})`);
}

const http: ReviewApi = {
  where: 'the case folder (review.json, extraction.json)',
  getExtraction: (id) => httpGet<SavedExtraction>(id, 'extraction'),
  saveExtraction: (id, doc, opts) => httpPut(id, 'extraction', doc, opts?.keepalive),
  resetExtraction: (id) => httpDelete(id, 'extraction'),
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
const xkey = (id: string) => `claire-review.extraction.${id}`;
const local: ReviewApi = {
  where: 'this browser',
  async getExtraction(id) {
    try { const t = localStorage.getItem(xkey(id)); return t ? JSON.parse(t) : null; } catch { return null; }
  },
  async saveExtraction(id, doc) {
    const prev = await local.getExtraction(id);
    const saved: SavedExtraction = { ...doc, revision: (prev?.revision ?? 0) + 1, savedAt: new Date().toISOString() };
    localStorage.setItem(xkey(id), JSON.stringify(saved));
    return { revision: saved.revision, savedAt: saved.savedAt };
  },
  async resetExtraction(id) {
    try { localStorage.removeItem(xkey(id)); } catch { /* storage blocked: nothing saved */ }
  },
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
