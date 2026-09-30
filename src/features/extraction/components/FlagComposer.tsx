import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ExtractionKind } from '@/types';
import { BLOCKS } from '@/data';
import { Button, Icon, Kbd } from '@/components/ui';
import { clamp, cn } from '@/lib/utils';
import { MOD, isModKey } from '@/lib/platform';
import { useReadOnly } from '@/features/findings';
import { useAddFindingStore } from '@/features/add-finding';
import { KIND_LABEL, KIND_NOTE, nearOf, useExtractionStore } from '../store';
import { flagTop, imageToDataUrl } from '../report';

const KINDS: ExtractionKind[] = ['formatting', 'data', 'missing'];
const SHOULD: Record<ExtractionKind, string> = {
  formatting: 'How it should look (optional)',
  data: 'What the original says',
  missing: 'What is missing',
};

const W = 360;

/**
 * Flags an extraction problem, or edits one: the kind, what the original shows, and a comment. Opens by the
 * selected words, where the record or original was right-clicked, or on a flag's pin. ⌘/Ctrl+Enter saves.
 */
export function FlagComposer() {
  const draft = useExtractionStore((s) => s.draft)!;
  const { flags, add, update, remove, set } = useExtractionStore();
  const readOnly = useReadOnly();
  const editing = draft.mode === 'edit' ? flags.find((f) => f.id === draft.id) : undefined;
  const [kind, setKind] = useState<ExtractionKind>(editing?.kind ?? (draft.mode === 'spot' ? 'missing' : 'data'));
  const [shouldRead, setShouldRead] = useState(editing?.shouldRead ?? '');
  const [comment, setComment] = useState(editing?.comment ?? '');
  const [shot, setShot] = useState<string | undefined>(editing?.screenshot);
  const [dragging, setDragging] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const close = () => set({ draft: null });

  const text = draft.mode === 'words' ? draft.text : editing?.text;
  const near = draft.mode === 'spot' ? nearOf(draft.block) : !text && editing?.near;
  const page = draft.mode === 'edit' ? editing?.page : draft.page;

  const attach = (f: Blob | null | undefined) => { if (f && f.type.startsWith('image/') && !readOnly) void imageToDataUrl(f).then(setShot); };

  /** Opens the capture view on the flag's page of the original, at the flag. */
  const captureFromOriginal = () => {
    const at = draft.mode === 'edit' ? editing : { kind, page: draft.page, block: draft.block, text: draft.mode === 'words' ? draft.text : undefined, id: '', createdAt: '' };
    if (!at) return;
    set({ capture: { page: at.page, top: flagTop(at), onDone: setShot } });
  };

  useEffect(() => {
    // the guided tour keeps the keyboard while it shows this editor
    if (!document.getElementById('tour-title')) box.current?.querySelector<HTMLElement>(readOnly ? 'button' : 'input, textarea')?.focus({ preventScroll: true });
    // stays open while its capture view is up; otherwise a click elsewhere closes it
    const capturing = () => !!useExtractionStore.getState().capture;
    const down = (e: MouseEvent) => { if (!capturing() && !box.current?.contains(e.target as Node)) close(); };
    // opened at a fixed spot, so a scroll would leave it behind: close instead
    const scroll = (e: Event) => { if (!capturing() && !box.current?.contains(e.target as Node)) close(); };
    window.addEventListener('mousedown', down);
    window.addEventListener('scroll', scroll, true);
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('scroll', scroll, true); };
  }, []);

  const save = () => {
    if (readOnly) return;
    const s = { kind, shouldRead: shouldRead.trim() || undefined, comment: comment.trim() || undefined, screenshot: shot };
    if (draft.mode === 'edit') update(draft.id, s);
    else {
      add({ ...s, page: draft.page, block: draft.block, ...(draft.mode === 'words' ? { text: draft.text } : { near: nearOf(draft.block) }) });
      useAddFindingStore.getState().cancel();
    }
  };

  const left = clamp(draft.x - W / 2, 8, window.innerWidth - W - 8);
  // open on the side with room; when neither side has enough, fill the height and scroll inside
  const NEED = 560;
  const style = window.innerHeight - draft.y > NEED ? { left, top: draft.y + 12, width: W }
    : draft.y > NEED ? { left, bottom: window.innerHeight - draft.y + 12, width: W }
    : { left, top: 8, width: W, maxHeight: window.innerHeight - 16 };
  const field = 'w-full rounded-md border border-line bg-chrome px-2 py-1.5 text-[12.5px] outline-none placeholder:text-ink-3 focus:border-flag read-only:opacity-80';

  if (draft.mode === 'edit' && !editing) return null;
  return (
    <motion.div
      ref={box}
      data-add-finding
      role="dialog"
      aria-label={editing ? 'Extraction flag' : 'Flag an extraction problem'}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed z-75 flex flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-xl border border-line bg-paper p-3.5 shadow-float"
      style={style}
      onPaste={(e) => {
        const img = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
        if (img) { e.preventDefault(); attach(img.getAsFile()); }
      }}
      onDragOver={(e) => { if (!readOnly && [...e.dataTransfer.items].some((i) => i.type.startsWith('image/'))) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); attach(e.dataTransfer.files[0]); }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'Enter' && isModKey(e)) { e.preventDefault(); save(); }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-flag-fill text-flag"><Icon.flag size={14} /></span>
        <span className="text-[13px] font-semibold">{editing ? 'Extraction flag' : 'Flag an extraction problem'}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-3">p. {page}</span>
      </div>

      {text ? (
        <blockquote className="rounded-r-md border-l-2 border-flag bg-chrome px-2.5 py-1.5 font-mono text-[11.5px] leading-snug">“{text}”</blockquote>
      ) : near ? (
        <p className="text-[11.5px] leading-snug text-ink-3">Missing near: <span className="font-mono text-ink-2">“{near}{(BLOCKS[draft.mode === 'spot' ? draft.block : editing?.block ?? '']?.t.length ?? 0) > 60 ? '…' : ''}”</span></p>
      ) : null}

      <div role="radiogroup" aria-label="Kind of problem" className="grid grid-cols-3 gap-1">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            disabled={readOnly}
            onClick={() => setKind(k)}
            title={KIND_NOTE[k]}
            className={cn('rounded-md border px-2 py-1.5 text-[12px] font-medium', kind === k ? 'border-flag bg-flag-fill text-flag' : 'border-line text-ink-2 hover:border-ink-3')}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-[11.5px] leading-snug text-ink-3">{KIND_NOTE[kind]}</p>

      <label className="flex flex-col gap-1 text-[11.5px] font-medium text-ink-2">
        {SHOULD[kind]}
        <input value={shouldRead} onChange={(e) => setShouldRead(e.target.value)} readOnly={readOnly} className={cn(field, 'font-mono')} placeholder={kind === 'data' ? 'e.g. 1.9 mg/dL' : ''} />
      </label>
      <label className="flex flex-col gap-1 text-[11.5px] font-medium text-ink-2">
        Comment (optional)
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} readOnly={readOnly} className={cn(field, 'resize-y leading-normal')} />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] font-medium text-ink-2">Screenshot (optional)</span>
        {shot ? (
          <div className="group/shot relative max-h-[140px] overflow-hidden rounded-md border border-flag/50 bg-chrome">
            <img src={shot} alt="Your screenshot" className="block max-h-[140px] w-full object-contain" />
            {!readOnly && (
              <button type="button" onClick={() => setShot(undefined)} aria-label="Remove the screenshot" title="Remove" className="absolute top-1 right-1 grid size-6 place-items-center rounded bg-ink/75 text-paper opacity-0 group-hover/shot:opacity-100 focus-visible:opacity-100">
                <Icon.close size={13} />
              </button>
            )}
          </div>
        ) : readOnly ? (
          <span className="text-[11.5px] text-ink-3">None</span>
        ) : null}
        {!readOnly && (
          <div className="flex gap-1.5">
            <button type="button" onClick={captureFromOriginal} title="Open the original at this spot and drag a box around what matters" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-flag/40 bg-flag-fill px-2 py-1.5 text-[12px] font-medium whitespace-nowrap text-flag hover:border-flag">
              <Icon.expand size={13} />{shot ? 'Capture again' : 'Capture from original'}
            </button>
            <button
              type="button"
              onClick={() => file.current?.click()}
              title={`Or paste (${MOD}V) or drop an image here`}
              className={cn('inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-[12px] whitespace-nowrap text-ink-2 hover:border-ink-3', dragging ? 'border-flag bg-flag-fill text-flag' : 'border-line')}
            >
              Paste or choose
            </button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {editing && !readOnly && (
          <Button onClick={() => remove(editing.id)} className="mr-auto"><Icon.trash size={14} />Remove</Button>
        )}
        {!editing && <span className="mr-auto inline-flex items-center gap-[3px] text-[11px] text-ink-3"><Kbd>{MOD}</Kbd><Kbd>↵</Kbd> to save</span>}
        {readOnly && <span className="mr-auto text-[11.5px] text-ink-3">Review completed: read-only</span>}
        <Button onClick={close}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button variant="primary" onClick={save}>{editing ? 'Save' : 'Flag it'}</Button>}
      </div>
    </motion.div>
  );
}
