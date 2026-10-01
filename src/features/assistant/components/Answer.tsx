import type { ReactNode } from 'react';
import { PAGES } from '@/data';
import { goPage } from '@/features/record-viewer';

/* The assistant writes light Markdown: paragraphs, - and 1. lists, **bold**, *italic*, `code`. "page 3" becomes a link to that page. */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\b(?:pages?|p\.)\s*\d+(?:\s*(?:,|and|&|–|-)\s*\d+)*)/gi;

function pageLinks(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(/\d+/g)) {
    const n = Number(m[0]);
    if (!PAGES.some((p) => p.n === n)) continue;
    out.push(s.slice(last, m.index));
    out.push(
      <button key={`${key}-${m.index}`} type="button" onClick={() => goPage(n)} title={`Go to page ${n}`} className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
        {m[0]}
      </button>,
    );
    last = m.index + m[0].length;
  }
  out.push(s.slice(last));
  return out;
}

function inline(s: string, key: string): ReactNode[] {
  return s.split(INLINE).filter(Boolean).map((part, i) => {
    const k = `${key}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <b key={k} className="font-semibold text-ink">{part.slice(2, -2)}</b>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={k} className="rounded bg-chrome-2 px-1 font-mono text-[11.5px] text-ink">{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <i key={k}>{part.slice(1, -1)}</i>;
    if (/^(pages?|p\.)/i.test(part)) return <span key={k}>{pageLinks(part, k)}</span>;
    return part;
  });
}

type Block = { kind: 'p'; text: string } | { kind: 'ul' | 'ol'; items: string[] };

function blocks(src: string): Block[] {
  const out: Block[] = [];
  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    const li = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/.exec(line);
    const prev = out[out.length - 1];
    if (li) {
      const kind = li[1] ? 'ol' : 'ul';
      if (prev?.kind === kind) prev.items.push(li[2]);
      else out.push({ kind, items: [li[2]] });
    } else if (!line.trim()) {
      out.push({ kind: 'p', text: '' });
    } else {
      // headings come out as bold lines
      const text = line.replace(/^#{1,6}\s+(.*)$/, '**$1**');
      if (prev?.kind === 'p' && prev.text) prev.text += ' ' + text;
      else if (prev && prev.kind !== 'p' && /^\s{2,}/.test(raw)) prev.items[prev.items.length - 1] += ' ' + text.trim();
      else out.push({ kind: 'p', text });
    }
  }
  return out.filter((b) => b.kind !== 'p' || b.text);
}

export function Answer({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      {blocks(text).map((b, i) => {
        if (b.kind === 'p') return <p key={i}>{inline(b.text, String(i))}</p>;
        const List = b.kind;
        return (
          <List key={i} className={List === 'ul' ? 'list-disc pl-4' : 'list-decimal pl-5'}>
            {b.items.map((it, j) => <li key={j} className="mt-0.5 pl-0.5">{inline(it, `${i}-${j}`)}</li>)}
          </List>
        );
      })}
    </div>
  );
}
