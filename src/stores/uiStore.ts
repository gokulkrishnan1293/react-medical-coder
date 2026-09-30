import { create } from 'zustand';

export type FullNotesTab = 'findings' | 'claim' | 'interventions';
/**
 * How the original page images show: stacked in the margin while reading, as a column beside the
 * record, or laid over the extracted text on the same page with a slider between them.
 */
export type SourceMode = 'stage' | 'compare' | 'overlay';
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
  /** Intervention whose path Full notes shows. */
  pathFor: string | null;
  zoom: Record<ZoomSide, Zoom>;
  /** The zoom that fits a page to each column's width, kept current as columns resize. */
  fit: Record<ZoomSide, number>;
  source: SourceMode;
  syncScroll: boolean;
  /** Overlay view: where the divider sits across the page, 0 (left edge) to 1 (right edge). */
  divider: number;
  /** Overlay view: the side of the divider the scan covers, the side it was pulled in from. */
  scanSide: 'left' | 'right';
  /** Overlay view: the whole page shows the scan while a key is held. */
  peek: boolean;
  /** Spot on the original to point out briefly, e.g. after "Show in original". */
  sourceMark: (DocSpot & { t: number }) | null;
  menu: DocMenu | null;
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
  pathFor: null,
  zoom: { record: 1, source: 'fit' },
  fit: { record: 1, source: 1 },
  source: 'stage',
  syncScroll: true,
  divider: 0.5,
  scanSide: 'left',
  peek: false,
  sourceMark: null,
  menu: null,
  set: (patch) => set(patch),
  toggleSpot: () => set((s) => ({ view: { spot: !s.view.spot, clean: false } })),
  toggleClean: () => set((s) => ({ view: { clean: !s.view.clean, spot: false } })),
}));

export const ui = () => useUiStore.getState();
