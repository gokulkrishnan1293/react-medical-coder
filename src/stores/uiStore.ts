import { create } from 'zustand';

export type FullNotesTab = 'findings' | 'claim';
/** How the original page images show: stacked in the margin, or as a column beside the record. */
export type SourceMode = 'stage' | 'compare';
/** The two scrolling columns: extracted record and original page images. */
export type ZoomSide = 'record' | 'source';
/** A zoom factor, or fit the page to the column width. */
export type Zoom = number | 'fit';
/** A spot in the document: page n, fraction f down the page. */
export interface DocSpot { n: number; f: number }

interface DocMenu {
  x: number;
  y: number;
  side: ZoomSide;
  at: DocSpot | null;
}

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
  zoom: Record<ZoomSide, Zoom>;
  /** The zoom that fits a page to each column's width, kept current as columns resize. */
  fit: Record<ZoomSide, number>;
  source: SourceMode;
  syncScroll: boolean;
  /** Spot on the original to point out briefly, e.g. after "Show in original". */
  sourceMark: (DocSpot & { t: number }) | null;
  menu: DocMenu | null;
  set: (patch: Partial<Omit<UiState, 'set'>>) => void;
  toggleSpot: () => void;
  toggleClean: () => void;
  toggleSource: () => void;
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
  zoom: { record: 1, source: 'fit' },
  fit: { record: 1, source: 1 },
  source: 'stage',
  syncScroll: true,
  sourceMark: null,
  menu: null,
  set: (patch) => set(patch),
  toggleSpot: () => set((s) => ({ view: { spot: !s.view.spot, clean: false } })),
  toggleClean: () => set((s) => ({ view: { clean: !s.view.clean, spot: false } })),
  toggleSource: () => set((s) => ({ source: s.source === 'stage' ? 'compare' : 'stage' })),
}));

export const ui = () => useUiStore.getState();
