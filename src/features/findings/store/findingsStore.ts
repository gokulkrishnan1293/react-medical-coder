import { create } from 'zustand';
import type { Finding, FindingStatus } from '@/types';
import { INITIAL_FINDINGS } from '@/data';
import { codeLabel, placesOf } from '../utils/finding';

interface Toast {
  id: number;
  msg: string;
  undoable: boolean;
}

interface FindingsState {
  findings: Finding[];
  history: Finding[][];
  toast: Toast | null;
  /** Replace findings, remember the previous set for undo, and toast the change. */
  commit: (next: Finding[], msg: string) => void;
  undo: () => void;
  /**
   * Review a code: every place CLAIRE found it that is in the same state moves together,
   * so accepting a correct code accepts all its evidence at once. One undo step.
   */
  setStatus: (id: string, status: FindingStatus) => void;
  /** Review one place only, e.g. to drop a place that does not document the code. */
  setPlaceStatus: (id: string, status: FindingStatus) => void;
  add: (f: Finding) => void;
  /** Delete a finding the coder added by mistake. AI suggestions are rejected instead, so they stay on file. */
  remove: (id: string) => void;
  /** Point a finding at different words in the record. */
  setEvidence: (id: string, at: Pick<Finding, 'page' | 'block' | 'text'>) => void;
  /** Change a code, remembering the original. Every place documenting it changes too: they are one diagnosis or service. */
  editCode: (id: string, code: string, desc: string) => void;
  setComment: (id: string, comment: string) => void;
  clearToast: () => void;
}

const HISTORY_LIMIT = 40;
const VERB: Record<FindingStatus, string> = { confirmed: 'Accepted', rejected: 'Rejected', ai: 'Moved back to suggestions', added: 'Restored' };

export const useFindingsStore = create<FindingsState>((set, get) => ({
  findings: INITIAL_FINDINGS,
  history: [],
  toast: null,
  commit: (next, msg) =>
    set((s) => ({
      findings: next,
      history: [...s.history, s.findings].slice(-HISTORY_LIMIT),
      toast: { id: Date.now(), msg, undoable: true },
    })),
  undo: () => {
    const { history } = get();
    const prev = history[history.length - 1];
    if (!prev) return;
    set({ findings: prev, history: history.slice(0, -1), toast: { id: Date.now(), msg: 'Undone', undoable: false } });
  },
  setStatus: (id, status) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    if (!f || f.status === status) return;
    const ids = new Set(placesOf(f, findings).filter((x) => x.id === id || (x.source === 'ai' && x.status === f.status)).map((x) => x.id));
    const n = ids.size > 1 ? ` · ${ids.size} places` : '';
    commit(findings.map((x) => (ids.has(x.id) ? { ...x, status } : x)), `${VERB[status]} ${codeLabel(f)}${n}`);
  },
  setPlaceStatus: (id, status) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    if (!f || f.status === status) return;
    commit(findings.map((x) => (x.id === id ? { ...x, status } : x)), `${VERB[status]} ${codeLabel(f)} on p. ${f.page}`);
  },
  add: (f) => get().commit([...get().findings, f], `Added ${codeLabel(f)} to notes`),
  remove: (id) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    if (!f || f.source !== 'coder') return;
    commit(findings.filter((x) => x.id !== id), `Removed ${codeLabel(f)}`);
  },
  setEvidence: (id, at) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    if (!f || (f.block === at.block && f.text === at.text)) return;
    // keep where it first pointed, so the review can be shown against the original; moving back clears it
    const was = f.movedFrom ?? { page: f.page, block: f.block, text: f.text };
    const back = was.block === at.block && was.text === at.text;
    commit(findings.map((x) => (x.id === id ? { ...x, ...at, movedFrom: back ? undefined : was } : x)), `Evidence changed for ${codeLabel(f)}`);
  },
  editCode: (id, code, desc) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    if (!f || f.code === code) return;
    const ids = new Set(placesOf(f, findings).filter((x) => x.id === id || x.status !== 'rejected').map((x) => x.id));
    const n = ids.size > 1 ? ` · ${ids.size} places` : '';
    commit(
      findings.map((x) => {
        if (!ids.has(x.id)) return x;
        const was = x.editedFrom ?? x.code;
        const back = was === code;
        return { ...x, code, desc, editedFrom: back ? undefined : was, editedFromDesc: back ? undefined : x.editedFrom ? x.editedFromDesc : x.desc };
      }),
      `Changed ${codeLabel(f)} to ${code}${n}`,
    );
  },
  setComment: (id, comment) => {
    const { findings, commit } = get();
    const f = findings.find((x) => x.id === id);
    const next = comment.trim();
    if (!f || (f.comment ?? '') === next) return;
    commit(findings.map((x) => (x.id === id ? { ...x, comment: next || undefined } : x)), next ? `Comment saved on ${codeLabel(f)}` : 'Comment removed');
  },
  clearToast: () => set({ toast: null }),
}));
