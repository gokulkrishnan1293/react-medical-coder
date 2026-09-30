import { clamp, cn } from '@/lib/utils';
import { notesTargetRef } from '@/lib/dom';
import { Icon, IconButton } from '@/components/ui';
import { useFindings } from '@/features/findings';
import { useUiStore } from '@/stores/uiStore';
import { RAIL_W, useNotepadStore } from '../store';
import { startPointerDrag } from '../usePointerDrag';
import { NotepadHeader } from './NotepadHeader';
import { NotesBody } from './NotesBody';

/** Notepad docked as a right-hand panel: resizable width, collapsible to a tab. */
export function DockedNotepad({ narrow }: { narrow: boolean }) {
  const np = useNotepadStore();
  const count = useFindings().length;
  const openFull = () => useUiStore.getState().set({ full: 'findings', card: null });

  const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const ow = np.railW;
    document.body.classList.add('resizing', 'ew');
    startPointerDrag(
      e,
      (dx) => np.set({ railW: clamp(ow - dx, 280, Math.min(720, window.innerWidth - 380)) }),
      () => document.body.classList.remove('resizing', 'ew'),
    );
  };

  return (
    <aside
      ref={(el) => { notesTargetRef.current = el; }}
      aria-label="Notes"
      className={cn(
        'relative flex min-h-0 flex-none flex-col border-l border-line bg-chrome',
        np.railCollapsed ? 'w-[42px]' : 'w-[360px]',
        narrow && 'fixed inset-y-0 right-0 z-45 w-[min(380px,100%)] shadow-float',
      )}
      style={!np.railCollapsed && !narrow ? { width: np.railW } : undefined}
    >
      {!np.railCollapsed && !narrow && (
        <div
          aria-hidden="true"
          title="Drag to resize · double-click to reset"
          onPointerDown={onResize}
          onDoubleClick={() => np.set({ railW: RAIL_W })}
          className="absolute inset-y-0 -left-1 z-3 w-2 cursor-ew-resize touch-none hover:bg-[linear-gradient(90deg,transparent_3px,var(--accent)_3px,var(--accent)_5px,transparent_5px)]"
        />
      )}
      {np.railCollapsed ? (
        <button onClick={() => np.set({ railCollapsed: false })} aria-label="Expand notes" className="flex flex-1 flex-col items-center gap-2.5 py-3 text-ink-2 hover:bg-chrome-2">
          <Icon.left size={15} />
          <span className="text-xs font-semibold tracking-[0.06em] [writing-mode:vertical-rl]">Notes</span>
          <span className="rounded-full bg-ink px-1.5 py-[3px] font-mono text-[10.5px] leading-none font-semibold text-paper">{count}</span>
        </button>
      ) : (
        <>
          <NotepadHeader>
            <IconButton size="sm" title="Full notes (F)" aria-label="Full notes" onClick={openFull}><Icon.expand size={14} /></IconButton>
            <IconButton size="sm" title="Float (D)" aria-label="Float notepad" onClick={np.float}><Icon.float size={14} /></IconButton>
            {narrow ? (
              <IconButton size="sm" title="Close" aria-label="Close" onClick={np.minimize}><Icon.close size={14} /></IconButton>
            ) : (
              <IconButton size="sm" title="Collapse" aria-label="Collapse notes" onClick={() => np.set({ railCollapsed: true })}><Icon.right size={14} /></IconButton>
            )}
          </NotepadHeader>
          <NotesBody />
        </>
      )}
    </aside>
  );
}
