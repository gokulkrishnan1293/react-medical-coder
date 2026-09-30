import { useEffect } from 'react';
import { useFindingsStore } from '@/features/findings';
import { cancelRebind, useAddFindingStore } from '@/features/add-finding';
import { useNotepadStore } from '@/features/notepad';
import { useUiStore } from '@/stores/uiStore';
import { isModKey } from '@/lib/platform';
import { hoveredSide, setZoom, stepZoom } from '@/features/zoom';
import { cycleSourceMode, setDivider, setSourceMode } from '@/features/source-view';
import { startTour, useTourStore } from '@/features/tour';
import { openFullNotes, stepFinding } from './actions';

/**
 * Global keys: J/K next/previous finding, A accept, R reject (removes a coder-added finding, as do Delete and Backspace), N notepad, D dock/float,
 * F full notes, S spotlight, C clean read, O cycle original view, ? tour, Esc close, ⌘K / Ctrl+K palette, ⌘Z / Ctrl+Z undo.
 * The modifier follows the platform: ⌘ on Mac, Ctrl on Windows and Linux.
 * Overlay view: ← → move the slider, hold Space to see the whole scan.
 * + / − / 0 (with or without ⌘ / Ctrl) zoom the column under the pointer: the record, or the original.
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
      if (isModKey(e) && k === 'k') { e.preventDefault(); ui.set({ palette: !ui.palette }); return; }
      if (isModKey(e) && k === 'z' && !e.shiftKey && !typing) { e.preventDefault(); findings.undo(); return; }
      if (e.key === 'Escape') {
        if (ui.menu) ui.set({ menu: null });
        else if (ui.palette) ui.set({ palette: false });
        else if (add.compose) add.cancel();
        else if (add.rebind) cancelRebind();
        else if (ui.full) ui.set({ full: null });
        else if (ui.card) ui.set({ card: null });
        else if (add.sel) add.cancel();
        else if (ui.source !== 'stage') setSourceMode('stage');
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || ui.palette || add.compose || ui.menu) return;
      if (ui.full && k !== 'f') return;

      if (ui.source === 'overlay' && !ui.full) {
        if (e.key === ' ') { e.preventDefault(); if (!ui.peek) ui.set({ peek: true }); return; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setDivider(ui.divider + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.01 : 0.05));
          return;
        }
      }

      const target = ui.activeId ?? ui.card?.id;
      switch (k) {
        case 'j': e.preventDefault(); stepFinding(1); break;
        case 'k': e.preventDefault(); stepFinding(-1); break;
        case 'a': {
          const f = target && findings.findings.find((x) => x.id === target);
          if (f && f.status === 'ai') findings.setStatus(f.id, 'confirmed');
          break;
        }
        case 'r':
        case 'delete':
        case 'backspace': {
          // coder-added findings are removed outright; AI suggestions are rejected so they stay on file
          const f = target && findings.findings.find((x) => x.id === target);
          if (!f) break;
          if (f.source === 'coder') { findings.remove(f.id); ui.set({ card: null, activeId: null }); }
          else if (k === 'r') findings.setStatus(f.id, 'rejected');
          break;
        }
        case 'n': np.toggle(); break;
        case 'd': if (!narrow) (np.mode === 'dock' ? np.float() : np.dock()); break;
        case 'f': if (ui.full) ui.set({ full: null }); else openFullNotes(); break;
        case 's': ui.toggleSpot(); break;
        case 'c': ui.toggleClean(); break;
        case 'o': cycleSourceMode(); break;
        case '?': if (useTourStore.getState().index === null) startTour(); break;
      }
    };
    // releasing Space ends the overlay peek; so does leaving the window while it is held
    const endPeek = (e?: KeyboardEvent) => {
      if ((!e || e.key === ' ') && useUiStore.getState().peek) useUiStore.getState().set({ peek: false });
    };
    const onBlur = () => endPeek();
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', endPeek);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', endPeek);
      window.removeEventListener('blur', onBlur);
    };
  }, [narrow]);
}
