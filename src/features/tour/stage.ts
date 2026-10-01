import { cancelRebind, useAddFindingStore } from '@/features/add-finding';
import { setSourceMode } from '@/features/source-view';
import { useExtractionStore } from '@/features/extraction';
import { ui } from '@/stores/uiStore';
import { useAssistantStore } from '@/features/assistant';
import { useNotepadStore, type NotepadMode } from '@/features/notepad';

/** How the notepad was before the tour opened it, so leaving the tour puts it back out of the way. */
let notepadBefore: NotepadMode | null = null;

export function rememberStage() {
  notepadBefore = useNotepadStore.getState().mode;
}

export function restoreStage() {
  const np = useNotepadStore.getState();
  if (notepadBefore === 'min' && np.mode !== 'min') np.minimize();
  else if (notepadBefore === 'closed' && np.mode !== 'closed') np.close();
  notepadBefore = null;
}

/** Put the screen back to plain reading: no open layers, no selection, no lens. Each tour step starts from here. */
export function resetStage() {
  const add = useAddFindingStore.getState();
  if (add.rebind) cancelRebind();
  if (add.sel || add.compose) add.cancel();
  const x = useExtractionStore.getState();
  if (x.draft || x.capture) x.set({ draft: null, capture: null });
  useAssistantStore.setState({ open: false, quote: null });
  setSourceMode('stage');
  ui().set({ full: null, palette: false, menu: null, card: null, view: { spot: false, clean: false } });
}
