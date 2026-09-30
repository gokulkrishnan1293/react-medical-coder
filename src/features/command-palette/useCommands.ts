import { PAGES } from '@/data';
import { useFindingsStore } from '@/features/findings';
import { goPage } from '@/features/record-viewer';
import { useNotepadStore } from '@/features/notepad';
import { nextAiSuggestion, openFullNotes, stepFinding } from '@/features/shortcuts';
import { useUiStore } from '@/stores/uiStore';
import { modLabel } from '@/lib/platform';
import { setZoom, stepZoom } from '@/features/zoom';
import { cycleSourceMode, setSourceMode } from '@/features/source-view';

export interface Command {
  label: string;
  key?: string;
  run: () => void;
}

export function getCommands(): Command[] {
  const ui = useUiStore.getState();
  const np = useNotepadStore.getState();
  return [
    { label: 'Next finding', key: 'J', run: () => stepFinding(1) },
    { label: 'Previous finding', key: 'K', run: () => stepFinding(-1) },
    { label: 'Next AI suggestion to review', run: nextAiSuggestion },
    ...PAGES.map((p) => ({ label: `Go to page ${p.n} · ${p.label}`, run: () => goPage(p.n) })),
    { label: 'Toggle spotlight', key: 'S', run: ui.toggleSpot },
    { label: 'Toggle clean read', key: 'C', run: ui.toggleClean },
    { label: 'Reading view', run: () => setSourceMode('stage') },
    { label: 'Compare with original side by side', run: () => setSourceMode('compare') },
    { label: 'Overlay original on the record (slider)', run: () => setSourceMode('overlay') },
    { label: 'Cycle original view', key: 'O', run: cycleSourceMode },
    { label: 'Zoom in record', key: '+', run: () => stepZoom('record', 1) },
    { label: 'Zoom out record', key: '−', run: () => stepZoom('record', -1) },
    { label: 'Record at actual size', key: '0', run: () => setZoom('record', 1) },
    { label: 'Fit record to width', run: () => setZoom('record', 'fit') },
    { label: 'Fit original to width', run: () => setZoom('source', 'fit') },
    { label: ui.syncScroll ? 'Unlink original from record scrolling' : 'Scroll original with the record', run: () => ui.set({ syncScroll: !ui.syncScroll }) },
    { label: 'Open full notes', key: 'F', run: () => openFullNotes('findings') },
    { label: 'Open claim view', run: () => openFullNotes('claim') },
    { label: 'Open interventions and how they were derived', run: () => openFullNotes('interventions') },
    { label: 'Show claim in notepad', run: () => { np.set({ panel: 'claim' }); if (np.mode !== 'float' && np.mode !== 'dock') np.reopen(); } },
    { label: 'Show findings in notepad', run: () => { np.set({ panel: 'findings' }); if (np.mode !== 'float' && np.mode !== 'dock') np.reopen(); } },
    { label: 'Dock notepad to the right', key: 'D', run: np.dock },
    { label: 'Float notepad', run: np.float },
    { label: 'Minimize notepad', key: 'N', run: np.minimize },
    { label: 'Undo last change', key: modLabel('Z'), run: useFindingsStore.getState().undo },
  ];
}
