import { clamp, cn } from '@/lib/utils';
import { notesTargetRef } from '@/lib/dom';
import { Icon, IconButton } from '@/components/ui';
import { useUiStore } from '@/stores/uiStore';
import { MIN_H, MIN_W, useNotepadStore } from '../store';
import { startPointerDrag } from '../usePointerDrag';
import { NotepadHeader } from './NotepadHeader';
import { NotepadBody } from './NotepadBody';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLE: Record<Dir, string> = {
  n: 'left-3 right-3 -top-[3px] h-2 cursor-ns-resize hover:bg-[linear-gradient(180deg,transparent_3px,var(--accent)_3px,var(--accent)_5px,transparent_5px)]',
  s: 'left-3 right-3 -bottom-[3px] h-2 cursor-ns-resize hover:bg-[linear-gradient(180deg,transparent_3px,var(--accent)_3px,var(--accent)_5px,transparent_5px)]',
  e: 'top-3 bottom-3 -right-[3px] w-2 cursor-ew-resize hover:bg-[linear-gradient(90deg,transparent_3px,var(--accent)_3px,var(--accent)_5px,transparent_5px)]',
  w: 'top-3 bottom-3 -left-[3px] w-2 cursor-ew-resize hover:bg-[linear-gradient(90deg,transparent_3px,var(--accent)_3px,var(--accent)_5px,transparent_5px)]',
  ne: '-top-[3px] -right-[3px] size-4 cursor-nesw-resize',
  sw: '-bottom-[3px] -left-[3px] size-4 cursor-nesw-resize',
  nw: '-top-[3px] -left-[3px] size-4 cursor-nwse-resize',
  se: 'bottom-0 right-0 size-[18px] cursor-nwse-resize opacity-70 group-hover:opacity-100 bg-[linear-gradient(135deg,transparent_50%,var(--ink-3)_50%,var(--ink-3)_57%,transparent_57%,transparent_68%,var(--ink-3)_68%,var(--ink-3)_75%,transparent_75%)]',
};

/** Floating notepad: drag by the header, resize from any edge or corner, drag to the right edge to dock. */
export function FloatingNotepad({ narrow }: { narrow: boolean }) {
  const np = useNotepadStore();
  const scrolling = useUiStore((s) => s.scrolling);
  const openFull = () => useUiStore.getState().set({ full: 'findings', card: null });

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const { x: ox, y: oy, w } = np;
    let near = false;
    startPointerDrag(
      e,
      (dx, dy, ev) => {
        near = !narrow && ev.clientX > window.innerWidth - 70;
        np.set({ snap: near, x: clamp(ox + dx, 4, window.innerWidth - w - 4), y: clamp(oy + dy, 4, window.innerHeight - 60) });
      },
      () => {
        np.set({ snap: false });
        if (near) np.dock();
      },
    );
  };

  const onResize = (dir: Dir) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const o = { x: np.x, y: np.y, w: np.w, h: np.h };
    document.body.classList.add('resizing');
    startPointerDrag(
      e,
      (dx, dy) => {
        const r = { ...o };
        if (dir.includes('e')) r.w = clamp(o.w + dx, MIN_W, window.innerWidth - o.x - 4);
        if (dir.includes('s')) r.h = clamp(o.h + dy, MIN_H, window.innerHeight - o.y - 4);
        if (dir.includes('w')) { const w = clamp(o.w - dx, MIN_W, o.x + o.w - 4); r.x = o.x + o.w - w; r.w = w; }
        if (dir.includes('n')) { const h = clamp(o.h - dy, MIN_H, o.y + o.h - 4); r.y = o.y + o.h - h; r.h = h; }
        np.set(r);
      },
      () => document.body.classList.remove('resizing'),
    );
  };

  const toggleTall = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (np.prev) return np.set({ ...np.prev, prev: null });
    const w = Math.max(np.w, Math.min(460, window.innerWidth - 16));
    np.set({ prev: { x: np.x, y: np.y, w: np.w, h: np.h }, y: 8, h: window.innerHeight - 16, w, x: clamp(np.x, 4, window.innerWidth - w - 4) });
  };

  return (
    <div
      ref={(el) => { notesTargetRef.current = el; }}
      role="region"
      aria-label="Notepad"
      className={cn('group fixed z-40 flex flex-col rounded-xl border border-line bg-chrome shadow-float transition-opacity duration-250', scrolling && !np.hover && 'opacity-30')}
      style={{ left: np.x, top: np.y, width: np.w, height: np.h }}
      onMouseEnter={() => np.set({ hover: true })}
      onMouseLeave={() => np.set({ hover: false })}
    >
      <NotepadHeader
        className="cursor-grab touch-none rounded-t-xl active:cursor-grabbing"
        onPointerDown={onDrag}
        onDoubleClick={toggleTall}
        title="Drag to move · double-click to fit to screen height"
      >
        <IconButton size="sm" title="Full notes (F)" aria-label="Full notes" onClick={openFull}><Icon.expand size={14} /></IconButton>
        {!narrow && <IconButton size="sm" title="Dock to the right (D)" aria-label="Dock" onClick={np.dock}><Icon.dock size={14} /></IconButton>}
        <IconButton size="sm" title="Minimize (N)" aria-label="Minimize" onClick={np.minimize}><Icon.min size={14} /></IconButton>
        <IconButton size="sm" title="Close" aria-label="Close notepad" onClick={np.close}><Icon.close size={14} /></IconButton>
      </NotepadHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-xl">
        <NotepadBody />
      </div>
      {(Object.keys(HANDLE) as Dir[]).map((d) => (
        <div key={d} aria-hidden="true" onPointerDown={onResize(d)} className={cn('absolute z-2 touch-none', HANDLE[d])} />
      ))}
    </div>
  );
}
