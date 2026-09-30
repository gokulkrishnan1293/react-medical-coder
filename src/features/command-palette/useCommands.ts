import { PAGES } from '@/data';
import { useFindingsStore } from '@/features/findings';
import { goPage } from '@/features/record-viewer';
import { useNotepadStore } from '@/features/notepad';
import { nextAiSuggestion } from '@/features/checkpoints';
import { openFullNotes, stepFinding } from '@/features/shortcuts';
import { useUiStore } from '@/stores/uiStore';

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
    { label: 'Open full notes', key: 'F', run: () => openFullNotes('findings') },
    { label: 'Open claim view', run: () => openFullNotes('claim') },
    { label: 'Dock notepad to the right', key: 'D', run: np.dock },
    { label: 'Float notepad', run: np.float },
    { label: 'Minimize notepad', key: 'N', run: np.minimize },
    { label: 'Undo last change', key: '⌘Z', run: useFindingsStore.getState().undo },
  ];
}
