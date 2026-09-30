import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon, Kbd, Modal } from '@/components/ui';
import { useUiStore } from '@/stores/uiStore';
import { getCommands, type Command } from './useCommands';

/** ⌘K / Ctrl+K: type to filter commands and pages, arrows to choose, Enter to run. */
export function CommandPalette() {
  const close = () => useUiStore.getState().set({ palette: false });
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const all = useMemo(getCommands, []);
  const list = all.filter((c) => q.toLowerCase().split(/\s+/).every((t) => c.label.toLowerCase().includes(t)));
  useEffect(() => setI(0), [q]);
  const run = (c: Command) => { close(); setTimeout(c.run, 10); };

  return (
    <Modal onClose={close} label="Command palette" align="top" className="w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-xl bg-paper shadow-float">
      <label className="flex items-center gap-[7px] border-b border-line px-3.5 text-ink-3">
        <Icon.search size={16} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command or page…"
          aria-label="Command"
          className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-ink outline-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
            if (e.key === 'Enter' && list[i]) { e.preventDefault(); run(list[i]); }
            if (e.key === 'Escape') { e.preventDefault(); close(); }
          }}
        />
      </label>
      <div className="max-h-[50vh] overflow-y-auto p-1.5">
        {list.map((c, k) => (
          <button
            key={c.label}
            onMouseEnter={() => setI(k)}
            onClick={() => run(c)}
            className={cn('flex w-full items-center justify-between rounded-[7px] px-2.5 py-2 text-left text-[13px]', k === i && 'bg-accent-soft')}
          >
            <span>{c.label}</span>
            {c.key && <Kbd>{c.key}</Kbd>}
          </button>
        ))}
        {!list.length && <div className="px-3.5 py-5 text-[12.5px] text-ink-2">No matching command.</div>}
      </div>
    </Modal>
  );
}
