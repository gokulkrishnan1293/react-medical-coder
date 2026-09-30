import { useEffect } from 'react';
import { useFindingsStore } from '@/features/findings';
import { useAddFindingStore } from '@/features/add-finding';
import { useNotepadStore } from '@/features/notepad';
import { useUiStore } from '@/stores/uiStore';
import { hoveredSide, setZoom, stepZoom } from '@/features/zoom';
import { openFullNotes, stepFinding } from './actions';

/**
 * Global keys: J/K next/previous finding, A accept, R reject, N notepad, D dock/float,
 * F full notes, S spotlight, C clean read, O compare with original, Esc close, ⌘K palette, ⌘Z undo.
 * + / − / 0 (with or without ⌘) zoom the column under the pointer: the record, or the original.
 */
export function useKeyboardShortcuts(narrow: boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      const k = e.key.toLowerCase();
      const ui = useUiStore.getState();
      const add = useAddFindingStore.getState();
      const findings = useFindingsStore.getState();
      const np = useNotepadStore.getState();

      if (!typing && !e.altKey && !ui.palette && !add.compose) {
        const dir = k === '=' || k === '+' ? 1 : k === '-' || k === '_' ? -1 : 0;
        if (dir) { e.preventDefault(); stepZoom(hoveredSide(), dir); return; }
        if (k === '0') { e.preventDefault(); setZoom(hoveredSide(), 1); return; }
      }
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); ui.set({ palette: !ui.palette }); return; }
      if ((e.metaKey || e.ctrlKey) && k === 'z' && !typing) { e.preventDefault(); findings.undo(); return; }
      if (e.key === 'Escape') {
        if (ui.menu) ui.set({ menu: null });
        else if (ui.palette) ui.set({ palette: false });
        else if (add.compose) add.cancel();
        else if (ui.full) ui.set({ full: null });
        else if (ui.card) ui.set({ card: null });
        else if (add.sel) add.cancel();
        else if (ui.source !== 'stage') ui.set({ source: 'stage' });
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || ui.palette || add.compose || ui.menu) return;
      if (ui.full && k !== 'f') return;

      const target = ui.activeId ?? ui.card?.id;
      switch (k) {
        case 'j': e.preventDefault(); stepFinding(1); break;
        case 'k': e.preventDefault(); stepFinding(-1); break;
        case 'a': {
          const f = target && findings.findings.find((x) => x.id === target);
          if (f && f.status === 'ai') findings.setStatus(f.id, 'confirmed');
          break;
        }
        case 'r': if (target) findings.setStatus(target, 'rejected'); break;
        case 'n': np.toggle(); break;
        case 'd': if (!narrow) (np.mode === 'dock' ? np.float() : np.dock()); break;
        case 'f': if (ui.full) ui.set({ full: null }); else openFullNotes(); break;
        case 's': ui.toggleSpot(); break;
        case 'c': ui.toggleClean(); break;
        case 'o': ui.toggleSource(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [narrow]);
}
