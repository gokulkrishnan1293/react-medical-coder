import { create } from 'zustand';
import { CASE } from '@/data';
import { clamp } from '@/lib/utils';
import { NARROW_QUERY } from '@/hooks/useMediaQuery';
import { useFindingsStore } from '@/features/findings';
import { useReviewStore } from '@/features/review';
import { useUiStore } from '@/stores/uiStore';
import { Unavailable, askClaire } from './api';
import { demoAnswer, streamDemo } from './demo';

/** Words from the record the reviewer is asking about. */
export interface Quote { page: number; text: string }

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  /** What the reviewer typed, or the answer so far. */
  text: string;
  quote?: Quote;
  /** The user turn as sent: the question with the review state and quote it was asked against. Kept as sent so history only grows. */
  sent?: string;
  error?: boolean;
}

interface AssistantState {
  open: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  messages: ChatMessage[];
  /** Selected words the next question is about. */
  quote: Quote | null;
  busy: boolean;
  /** Put the cursor in the question box when the panel shows. Opened by the tour, it is not, so the tour keeps its keys. */
  wantFocus: boolean;
  set: (patch: Partial<Pick<AssistantState, 'open' | 'x' | 'y' | 'w' | 'h' | 'quote' | 'wantFocus'>>) => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  /** Open with selected record words attached to the next question. */
  askAbout: (q: Quote) => void;
  ask: (question: string) => void;
  stop: () => void;
  clear: () => void;
}

export const ASSIST_W = 380;
export const ASSIST_H = 520;

let seq = 0;
let inflight: AbortController | null = null;

const narrowNow = () => window.matchMedia(NARROW_QUERY).matches;

function home() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (narrowNow()) return { x: 8, y: Math.round(H * 0.3), w: W - 16, h: Math.round(H * 0.65) };
  const h = Math.min(ASSIST_H, H - 120);
  // bottom right, above the Notes bubble
  return { x: W - ASSIST_W - 40, y: Math.max(8, H - h - 76), w: ASSIST_W, h };
}

/** Where the reviewer is and what they have decided, so answers match the screen rather than CLAIRE's first pass. */
function reviewState() {
  const { findings } = useFindingsStore.getState();
  const ui = useUiStore.getState();
  const rows = findings.map((f) =>
    [f.id, f.type, f.code ?? '-', f.status, f.source, `p${f.page}`, JSON.stringify(f.text.slice(0, 80)), f.comment ? `comment ${JSON.stringify(f.comment)}` : '']
      .filter(Boolean).join(' '));
  return [
    `<review_state case="${CASE.id}" status="${useReviewStore.getState().status}" page_in_view="${ui.currentPage}">`,
    'Findings now (id type code status source page "evidence"):',
    ...rows,
    '</review_state>',
  ].join('\n');
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  open: false,
  // placed on first open: the window is not known before then (nor at all in tests)
  x: -1,
  y: 0,
  w: ASSIST_W,
  h: ASSIST_H,
  messages: [],
  quote: null,
  busy: false,
  wantFocus: false,
  set: (patch) => set(patch),
  show: () => {
    const r = get().x < 0 ? home() : get();
    // back on screen if the window shrank while it was closed
    set({
      open: true,
      wantFocus: true,
      w: r.w,
      h: r.h,
      x: clamp(r.x, 4, Math.max(4, window.innerWidth - r.w - 4)),
      y: clamp(r.y, 4, Math.max(4, window.innerHeight - 80)),
    });
  },
  hide: () => set({ open: false }),
  toggle: () => (get().open ? get().hide() : get().show()),
  askAbout: (quote) => { get().show(); set({ quote }); },
  ask: (question) => {
    const q = question.trim();
    if (!q || get().busy) return;
    const quote = get().quote ?? undefined;
    const sent = [
      reviewState(),
      quote && `<selected_text page="${quote.page}">\n${quote.text}\n</selected_text>`,
      q,
    ].filter(Boolean).join('\n\n');
    const user: ChatMessage = { id: ++seq, role: 'user', text: q, quote, sent };
    const reply: ChatMessage = { id: ++seq, role: 'assistant', text: '' };
    // earlier turns go back as they were sent; a failed answer and its question are left out
    const history = get().messages.filter((m, i, all) => !m.error && !(m.role === 'user' && all[i + 1]?.error));
    set({ messages: [...get().messages, user, reply], quote: null, busy: true });

    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === reply.id ? fn(m) : m)) }));
    const ctl = (inflight = new AbortController());
    const onText = (chunk: string) => patch((m) => ({ ...m, text: m.text + chunk }));
    askClaire(
      CASE.id,
      [...history, user].map((m) => ({ role: m.role, content: m.role === 'user' ? m.sent ?? m.text : m.text })),
      onText,
      ctl.signal,
    )
      // no service connected yet: answer from the case and the screen's help instead
      .catch((e: Error) => { if (e instanceof Unavailable) return streamDemo(demoAnswer(q, quote), onText, ctl.signal); throw e; })
      .catch((e: Error) => {
        if (e.name === 'AbortError') patch((m) => (m.text ? m : { ...m, text: 'Stopped.', error: true }));
        else patch((m) => ({ ...m, text: e.message, error: true }));
      })
      .finally(() => { inflight = null; set({ busy: false }); });
  },
  stop: () => inflight?.abort(),
  clear: () => { inflight?.abort(); set({ messages: [], quote: null }); },
}));

export const showAssistant = () => useAssistantStore.getState().show();
