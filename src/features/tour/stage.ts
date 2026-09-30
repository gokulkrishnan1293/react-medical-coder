import { cancelRebind, useAddFindingStore } from '@/features/add-finding';
import { setSourceMode } from '@/features/source-view';
import { ui } from '@/stores/uiStore';

/** Put the screen back to plain reading: no open layers, no selection, no lens. Each tour step starts from here. */
export function resetStage() {
  const add = useAddFindingStore.getState();
  if (add.rebind) cancelRebind();
  if (add.sel || add.compose) add.cancel();
  setSourceMode('stage');
  ui().set({ full: null, palette: false, menu: null, card: null, view: { spot: false, clean: false } });
}
