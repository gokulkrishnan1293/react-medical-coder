import { cancelRebind, useAddFindingStore } from '@/features/add-finding';
import { setSourceMode } from '@/features/source-view';
import { useExtractionStore } from '@/features/extraction';
import { ui } from '@/stores/uiStore';

/** Put the screen back to plain reading: no open layers, no selection, no lens. Each tour step starts from here. */
export function resetStage() {
  const add = useAddFindingStore.getState();
  if (add.rebind) cancelRebind();
  if (add.sel || add.compose) add.cancel();
  const x = useExtractionStore.getState();
  if (x.draft || x.capture) x.set({ draft: null, capture: null });
  setSourceMode('stage');
  ui().set({ full: null, palette: false, menu: null, card: null, view: { spot: false, clean: false } });
}
