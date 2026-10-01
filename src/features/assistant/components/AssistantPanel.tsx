import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { clamp, cn } from '@/lib/utils';
import { Icon, IconButton } from '@/components/ui';
import { startPointerDrag } from '@/features/notepad/usePointerDrag';
import { useAssistantStore } from '../store';
import { Answer } from './Answer';

const MIN_W = 300;
const MIN_H = 300;

const STARTERS = [
  'Summarise this case and the downcode in dispute',
  'Does the record support the billed level?',
  'What is still left for me to review?',
  'How do I add a finding CLAIRE missed?',
];

/** "Ask CLAIRE": a floating chat about the case and how to use the screen. Drag by the header, resize from the corner. */
export function AssistantPanel({ narrow }: { narrow: boolean }) {
  const a = useAssistantStore();
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    if (!a.wantFocus) return;
    input.current?.focus({ preventScroll: true });
    a.set({ wantFocus: false });
  }, [a.wantFocus, a]);

  // follow the answer as it streams in, unless the reviewer has scrolled up to read
  useLayoutEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [a.messages]);

  const send = (q = draft) => {
    if (!q.trim() || a.busy) return;
    stick.current = true;
    a.ask(q);
    setDraft('');
  };

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const { x: ox, y: oy, w } = a;
    startPointerDrag(e, (dx, dy) => a.set({ x: clamp(ox + dx, 4, window.innerWidth - w - 4), y: clamp(oy + dy, 4, window.innerHeight - 60) }));
  };

  const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const o = { w: a.w, h: a.h };
    document.body.classList.add('resizing');
    startPointerDrag(
      e,
      (dx, dy) => a.set({ w: clamp(o.w + dx, MIN_W, window.innerWidth - a.x - 4), h: clamp(o.h + dy, MIN_H, window.innerHeight - a.y - 4) }),
      () => document.body.classList.remove('resizing'),
    );
  };

  return (
    <motion.div
      role="dialog"
      aria-label="Ask CLAIRE"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="group fixed z-60 flex flex-col rounded-xl border border-line bg-paper shadow-float"
      style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); a.hide(); } }}
    >
      <div
        onPointerDown={narrow ? undefined : onDrag}
        title={narrow ? undefined : 'Drag to move'}
        className={cn('flex items-center gap-2 rounded-t-xl border-b border-line bg-chrome py-[7px] pr-2 pl-2.5 select-none', !narrow && 'cursor-grab touch-none active:cursor-grabbing')}
      >
        <span className="grid size-5 place-items-center rounded-md bg-accent text-accent-ink"><Icon.spark size={13} sw={2} /></span>
        <span className="text-[13px] font-bold">Ask CLAIRE</span>
        <span className="text-[11px] text-ink-3">about this case or the screen</span>
        <span className="flex-1" />
        {a.messages.length > 0 && <IconButton size="sm" title="New conversation" aria-label="New conversation" onClick={a.clear}><Icon.trash size={13} /></IconButton>}
        <IconButton size="sm" title="Close (Esc)" aria-label="Close Ask CLAIRE" onClick={a.hide}><Icon.close size={14} /></IconButton>
      </div>

      <div
        ref={list}
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 text-[13px] leading-normal"
        aria-live="polite"
      >
        {a.messages.length === 0 && (
          <div className="flex flex-col gap-2 text-ink-2">
            <p>Ask about the record, the claim, CLAIRE's findings, or how to do something here. Select words in the record and choose <b className="font-semibold text-ink">Ask</b> to ask about them.</p>
            <div className="mt-1 flex flex-col gap-1.5">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="rounded-lg border border-line px-2.5 py-1.5 text-left text-[12.5px] text-ink hover:border-accent/50 hover:bg-accent-soft">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {a.messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex max-w-[88%] flex-col gap-1 self-end">
              {m.quote && <Quote page={m.quote.page} text={m.quote.text} />}
              <div className="rounded-xl rounded-br-sm bg-ink px-3 py-2 whitespace-pre-wrap text-paper">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className={cn('max-w-[95%] text-ink-2', m.error && 'rounded-lg border border-rej/30 bg-rej-fill px-2.5 py-2 text-rej')}>
              {m.text ? <Answer text={m.text} /> : <Thinking />}
            </div>
          ),
        )}
      </div>

      <div className="border-t border-line p-2">
        {a.quote && (
          <div className="mb-2 flex items-start gap-1.5">
            <Quote page={a.quote.page} text={a.quote.text} className="flex-1" />
            <IconButton size="sm" title="Remove the selected words" aria-label="Remove the selected words" onClick={() => a.set({ quote: null })}><Icon.close size={12} /></IconButton>
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-lg border border-line bg-chrome px-2 py-1.5 focus-within:border-accent/60">
          <textarea
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            rows={Math.min(5, Math.max(1, draft.split('\n').length))}
            placeholder={a.quote ? 'Ask about the selected words…' : 'Ask a question…'}
            aria-label="Your question"
            className="max-h-28 min-h-[22px] flex-1 resize-none bg-transparent text-[13px] leading-normal outline-none placeholder:text-ink-3"
          />
          {a.busy ? (
            <IconButton size="sm" title="Stop" aria-label="Stop the answer" onClick={a.stop} className="bg-ink text-paper hover:bg-ink hover:text-paper"><Icon.stop size={12} /></IconButton>
          ) : (
            <IconButton size="sm" title="Send (Enter)" aria-label="Send" disabled={!draft.trim()} onClick={() => send()} className="bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink disabled:opacity-40"><Icon.send size={13} sw={2} /></IconButton>
          )}
        </div>
        <p className="mt-1 px-1 text-[10.5px] text-ink-3">CLAIRE can be wrong. Check answers against the record.</p>
      </div>

      {!narrow && (
        <div
          aria-hidden="true"
          onPointerDown={onResize}
          className="absolute right-0 bottom-0 size-[18px] cursor-nwse-resize touch-none opacity-70 group-hover:opacity-100 bg-[linear-gradient(135deg,transparent_50%,var(--ink-3)_50%,var(--ink-3)_57%,transparent_57%,transparent_68%,var(--ink-3)_68%,var(--ink-3)_75%,transparent_75%)]"
        />
      )}
    </motion.div>
  );
}

function Quote({ page, text, className }: { page: number; text: string; className?: string }) {
  return (
    <div className={cn('line-clamp-3 rounded-lg border-l-2 border-accent bg-accent-soft px-2 py-1 text-[12px] text-ink-2', className)}>
      <span className="mr-1 font-mono text-[10.5px] text-accent">p.{page}</span>“{text}”
    </div>
  );
}

function Thinking() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="CLAIRE is answering">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1.5 rounded-full bg-ink-3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}
