import { useEffect, useState } from 'react';
import type { Finding } from '@/types';
import { cn } from '@/lib/utils';
import { useFindingsStore } from '../store/findingsStore';
import { isModKey } from '@/lib/platform';

/** Coder's remark on a finding. Saves on blur or ⌘/Ctrl+Enter. */
export function CommentField({ f, className, rows = 2 }: { f: Finding; className?: string; rows?: number }) {
  const setComment = useFindingsStore((s) => s.setComment);
  const [value, setValue] = useState(f.comment ?? '');
  useEffect(() => setValue(f.comment ?? ''), [f.comment]);
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => setComment(f.id, value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && isModKey(e)) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
        if (e.key === 'Escape') { setValue(f.comment ?? ''); (e.target as HTMLTextAreaElement).blur(); }
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="Add a comment"
      aria-label={`Comment on ${f.code ?? f.desc ?? 'finding'}`}
      className={cn('w-full resize-y rounded-md border border-line bg-chrome px-2 py-1.5 text-xs leading-normal text-ink outline-none placeholder:text-ink-3 focus:border-accent', className)}
    />
  );
}
