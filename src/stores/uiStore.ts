import { create } from 'zustand';

export type FullNotesTab = 'findings' | 'claim';

interface Card {
  id: string;
  pinned: boolean;
}

interface UiState {
  activeId: string | null;
  hoverId: string | null;
  flashId: string | null;
  card: Card | null;
  view: { spot: boolean; clean: boolean };
  visiblePages: number[];
  currentPage: number;
  scrolling: boolean;
  full: FullNotesTab | null;
  palette: boolean;
  set: (patch: Partial<Omit<UiState, 'set'>>) => void;
  toggleSpot: () => void;
  toggleClean: () => void;
}

/* Cross-feature UI state: what is active, hovered, open. */
export const useUiStore = create<UiState>((set) => ({
  activeId: null,
  hoverId: null,
  flashId: null,
  card: null,
  view: { spot: false, clean: false },
  visiblePages: [1],
  currentPage: 1,
  scrolling: false,
  full: null,
  palette: false,
  set: (patch) => set(patch),
  toggleSpot: () => set((s) => ({ view: { spot: !s.view.spot, clean: false } })),
  toggleClean: () => set((s) => ({ view: { clean: !s.view.clean, spot: false } })),
}));

export const ui = () => useUiStore.getState();
