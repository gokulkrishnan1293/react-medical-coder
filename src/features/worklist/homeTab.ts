import { create } from 'zustand';

/** Home is two views: an overview of the work, and the cases themselves. Mirrored in the address as ?tab=cases. */
export type HomeTab = 'overview' | 'cases';

export const useHomeTab = create<{ tab: HomeTab; setTab: (t: HomeTab) => void }>((set) => ({
  tab: typeof location !== 'undefined' && new URLSearchParams(location.search).get('tab') === 'cases' ? 'cases' : 'overview',
  setTab: (tab) => set({ tab }),
}));
