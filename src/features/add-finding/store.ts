import { create } from 'zustand';

export type ComposeType = 'dx' | 'svc' | 'mar' | 'doc' | 'note';

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
  /** Finding whose evidence the coder is moving: the next selection becomes its evidence. */
  rebind: string | null;
  set: (patch: Partial<Pick<AddFindingState, 'sel' | 'compose' | 'rebind'>>) => void;
  cancel: () => void;
}

export const useAddFindingStore = create<AddFindingState>((set) => ({
  sel: null,
  compose: null,
  rebind: null,
  set: (patch) => set(patch),
  cancel: () => {
    window.getSelection()?.removeAllRanges();
    set({ sel: null, compose: null });
  },
}));
