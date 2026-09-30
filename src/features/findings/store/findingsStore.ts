import { create } from 'zustand';
import type { Finding, FindingStatus } from '@/types';
import { INITIAL_FINDINGS } from '@/data';
import { codeLabel } from '../utils/finding';

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
  setStatus: (id: string, status: FindingStatus) => void;
  add: (f: Finding) => void;
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
    commit(findings.map((x) => (x.id === id ? { ...x, status } : x)), `${VERB[status]} ${codeLabel(f)}`);
  },
  add: (f) => get().commit([...get().findings, f], `Added ${codeLabel(f)} to notes`),
  clearToast: () => set({ toast: null }),
}));
