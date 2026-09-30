import { create } from 'zustand';

export type ComposeType = 'dx' | 'svc' | 'mar' | 'note';

export interface TextSelection {
  block: string;
  page: number;
  text: string;
  range: Range;
  /** Selection overlaps an existing evidence box. */
  overlap: boolean;
}

interface AddFindingState {
  sel: TextSelection | null;
  compose: ComposeType | null;
  set: (patch: Partial<Pick<AddFindingState, 'sel' | 'compose'>>) => void;
  cancel: () => void;
}

export const useAddFindingStore = create<AddFindingState>((set) => ({
  sel: null,
  compose: null,
  set: (patch) => set(patch),
  cancel: () => {
    window.getSelection()?.removeAllRanges();
    set({ sel: null, compose: null });
  },
}));
