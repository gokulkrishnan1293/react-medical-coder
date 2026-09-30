import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { clamp, cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useAddFindingStore, type ComposeType } from '@/features/add-finding';
import { setZoom, stepZoom } from '@/features/zoom';
import { setSourceMode, VIEW_LABEL } from '@/features/source-view';
import type { SourceMode } from '@/stores/uiStore';
import { closeDocMenu, showInOriginal, showInRecord } from './actions';

interface Item {
  label: string;
  hint?: string;
  icon?: ReactNode;
  checked?: boolean;
  run: () => void;
}
type Entry = Item | 'sep';

const ADD: [ComposeType, string][] = [['dx', 'Add diagnosis'], ['svc', 'Add service'], ['mar', 'Add MAR entry'], ['doc', 'Add documentation'], ['note', 'Add note']];

/** Right-click menu on the record and the original: add from a selection, zoom, and jump across. */
export function DocMenu() {
  const menu = useUiStore((s) => s.menu)!;
  const source = useUiStore((s) => s.source);
  const syncScroll = useUiStore((s) => s.syncScroll);
  const zoom = useUiStore((s) => s.zoom[menu.side]);
  const set = useUiStore((s) => s.set);
  const sel = useAddFindingStore((s) => s.sel);
  const setAdd = useAddFindingStore((s) => s.set);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });
  const [hi, setHi] = useState(-1);
  const { side, at } = menu;

  const entries: Entry[] = [];
  if (side === 'record' && sel && !sel.overlap) {
    ADD.forEach(([k, l]) => entries.push({ label: l, icon: <span className="text-[13px] leading-none">+</span>, run: () => setAdd({ compose: k }) }));
    entries.push({ label: 'Copy', icon: <Icon.copy size={14} />, run: () => void navigator.clipboard?.writeText(sel.text) }, 'sep');
  }
  entries.push(
    { label: 'Zoom in', hint: '+', run: () => stepZoom(side, 1) },
    { label: 'Zoom out', hint: '−', run: () => stepZoom(side, -1) },
    { label: 'Actual size', hint: '0', checked: zoom === 1, run: () => setZoom(side, 1) },
    { label: 'Fit to width', icon: <Icon.fitWidth size={14} />, checked: zoom === 'fit', run: () => setZoom(side, 'fit') },
    'sep',
  );
  if (side === 'record') {
    if (at) entries.push({ label: 'Show this in the original', icon: <Icon.compare size={14} />, run: () => showInOriginal(at) });
    entries.push('sep');
    (['stage', 'compare', 'overlay'] as SourceMode[]).forEach((m) =>
      entries.push({ label: VIEW_LABEL[m], checked: source === m, run: () => setSourceMode(m) }));
  } else {
    if (at) entries.push({ label: 'Show this in the record', icon: <Icon.notes size={14} />, run: () => showInRecord(at) });
    entries.push(
      { label: 'Scroll with the record', icon: <Icon.link size={14} />, checked: syncScroll, run: () => set({ syncScroll: !syncScroll }) },
      { label: 'Close original', hint: 'Esc', run: () => setSourceMode('stage') },
    );
  }
  const items = entries.filter((e): e is Item => e !== 'sep');
  const run = (it: Item) => { closeDocMenu(); it.run(); };

  // keep the menu on screen
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setPos({
      left: clamp(menu.x, 8, window.innerWidth - el.offsetWidth - 8),
      top: menu.y + el.offsetHeight > window.innerHeight - 8 ? Math.max(8, menu.y - el.offsetHeight) : menu.y,
    });
  }, [menu.x, menu.y]);

  // close on outside click, scroll or resize; arrow keys move the highlight without taking focus off the selection
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) closeDocMenu(); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
      } else if (e.key === 'Enter' && items[hi]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        run(items[hi]);
      }
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('wheel', closeDocMenu, { passive: true });
    window.addEventListener('resize', closeDocMenu);
    window.addEventListener('blur', closeDocMenu);
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('wheel', closeDocMenu);
      window.removeEventListener('resize', closeDocMenu);
      window.removeEventListener('blur', closeDocMenu);
    };
  });

  let i = -1;
  return (
    <div
      ref={ref}
      role="menu"
      data-add-finding
      aria-label={side === 'record' ? 'Record' : 'Original'}
      className="fixed z-80 min-w-[230px] rounded-[10px] border border-line bg-paper py-1 text-[13px] text-ink shadow-float"
      style={pos}
      onMouseDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {entries.map((e, k) => {
        if (e === 'sep') return <div key={k} role="separator" className="my-1 h-px bg-line" />;
        const idx = ++i;
        return (
          <button
            key={k}
            type="button"
            role={e.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
            aria-checked={e.checked}
            onClick={() => run(e)}
            onMouseEnter={() => setHi(idx)}
            className={cn('flex w-full items-center gap-2.5 px-3 py-[5px] text-left', hi === idx && 'bg-chrome-2')}
          >
            <span className="grid w-4 flex-none place-items-center text-ink-2">{e.checked ? <Icon.check size={14} /> : e.icon}</span>
            <span className="flex-1">{e.label}</span>
            {e.hint && <span className="font-mono text-[11px] text-ink-3">{e.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
