import { create } from 'zustand';
import { clamp } from '@/lib/utils';
import { NARROW_QUERY } from '@/hooks/useMediaQuery';

export type NotepadMode = 'float' | 'dock' | 'min' | 'closed';
type OpenMode = 'float' | 'dock';

interface Rect { x: number; y: number; w: number; h: number }

interface NotepadState extends Rect {
  mode: NotepadMode;
  lastMode: OpenMode;
  /** Size before "fit to screen height", for restoring. */
  prev: Rect | null;
  railW: number;
  railCollapsed: boolean;
  /** Dragging near the right edge: show the dock hint. */
  snap: boolean;
  hover: boolean;
  /** Half-view tab. */
  panel: 'findings' | 'claim' | 'interventions';
  /** Findings list: pages in view, or everything. */
  scope: 'view' | 'all';
  /** Pages the "In view" list is frozen on, or null to follow the scroll. */
  pinnedPages: number[] | null;
  set: (patch: Partial<Omit<NotepadState, 'set'>>) => void;
  dock: () => void;
  float: () => void;
  minimize: () => void;
  close: () => void;
  toggle: () => void;
  reopen: () => void;
}

export const MIN_W = 290;
export const MIN_H = 240;
export const RAIL_W = 360;

function initialRect(narrow: boolean): Rect & { mode: NotepadMode } {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (narrow) return { mode: 'min', x: 8, y: Math.round(H * 0.4), w: W - 16, h: Math.round(H * 0.55) };
  const w = 360;
  return { mode: 'float', x: W - w - 40, y: 150, w, h: Math.min(500, H - 210) };
}

const isOpen = (m: NotepadMode): m is OpenMode => m === 'float' || m === 'dock';
const narrowNow = () => window.matchMedia(NARROW_QUERY).matches;

export const useNotepadStore = create<NotepadState>((set, get) => ({
  ...initialRect(narrowNow()),
  lastMode: 'float',
  prev: null,
  railW: RAIL_W,
  railCollapsed: false,
  snap: false,
  hover: false,
  panel: 'findings',
  scope: 'view',
  pinnedPages: null,
  set: (patch) => set(patch),
  dock: () => set({ mode: 'dock', railCollapsed: false }),
  float: () => set((s) => ({ mode: 'float', ...(narrowNow() ? {} : { x: clamp(s.x, 4, window.innerWidth - s.w - 40) }) })),
  minimize: () => set((s) => ({ mode: 'min', lastMode: isOpen(s.mode) ? s.mode : s.lastMode })),
  close: () => set((s) => ({ mode: 'closed', lastMode: isOpen(s.mode) ? s.mode : s.lastMode })),
  toggle: () => (isOpen(get().mode) ? get().minimize() : get().reopen()),
  reopen: () => set((s) => ({ mode: s.lastMode === 'dock' && !narrowNow() ? 'dock' : 'float' })),
}));

/** Phone width: tuck a floating notepad into the bubble. */
export function tuckForNarrow() {
  const s = useNotepadStore.getState();
  if (s.mode === 'float') s.set({ ...initialRect(true), lastMode: 'float' });
}

/** Keep the floating notepad on screen after a window resize. */
export function keepOnScreen() {
  const s = useNotepadStore.getState();
  const w = Math.min(s.w, window.innerWidth - 8);
  s.set({ w, x: clamp(s.x, 4, Math.max(4, window.innerWidth - w - 4)), y: clamp(s.y, 4, Math.max(4, window.innerHeight - 80)) });
}
