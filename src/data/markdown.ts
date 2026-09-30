import type { Block, BlockKind, RecordPage } from '@/types';

/*
 * Turns a case's record.md into record pages. Each Markdown element becomes one of the record's block kinds,
 * so the record keeps its formatting and findings can anchor to exact words:
 *
 *   <!-- Page: 2 -->           starts page 2 (text before the first marker is page 1). The page is named after
 *                              its first section heading; <!-- Page: 2 | Exam --> names it explicitly
 *   **WHOLE LINE BOLD**        org      facility name at the top of a form
 *   *Whole line italic*        sub      address or sub-heading line
 *   # Title                    title
 *   ## Heading  (### …)        h
 *   paragraph                  p        lines of one paragraph are joined with a space
 *   - item   1. item           li
 *   ```text … ```              meta     one block per line, spacing kept
 *   <!-- MAR --> + table       marHead + mar   header row, then one row per administration, cells joined " | "
 *   other table                meta     one block per row, cells joined " · "
 *
 * Inline Markdown (bold, italic, code, links) is reduced to its text. Other HTML comments, images and
 * horizontal rules are ignored.
 */

const PAGE = /^<!--\s*Page:\s*(\d+)\s*(?:\|\s*(.*?))?\s*-->$/i;
const MAR = /^<!--\s*MAR\s*-->$/i;
const COMMENT = /^<!--.*-->$/;

/** Inline Markdown to plain text. */
export function plain(s: string) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])[*_](?!\s)(.+?)(?<!\s)[*_](?=[^\w*]|$)/g, '$1$2')
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
    .trim();
}

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => plain(c));
const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);

/** A page's name: its first section heading (else its title), as written. */
const labelFrom = (raw: [BlockKind, string][]) => (raw.find(([k]) => k === 'h') ?? raw.find(([k]) => k === 'title'))?.[1] ?? '';

export function parseRecord(md: string): RecordPage[] {
  const pages: { n: number; label: string; raw: [BlockKind, string][] }[] = [];
  let page: (typeof pages)[number] | null = null;
  const add = (k: BlockKind, t: string) => {
    if (!t) return;
    if (!page) { page = { n: 1, label: '', raw: [] }; pages.push(page); }
    page.raw.push([k, t]);
  };

  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    const text = para.join(' ').trim();
    para = [];
    if (/^\*\*[^*].*\*\*$/.test(text) && !text.slice(2, -2).includes('**')) add('org', plain(text));
    else if (/^[*_][^*_].*[*_]$/.test(text)) add('sub', plain(text));
    else add('p', plain(text));
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const pm = PAGE.exec(line);
    if (pm) {
      flush();
      const n = Number(pm[1]);
      page = { n, label: pm[2]?.trim() ?? '', raw: [] };
      pages.push(page);
      continue;
    }
    if (MAR.test(line)) {
      flush();
      // the table that follows is a MAR: header, then administrations
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      let head = true;
      for (; j < lines.length && isTableRow(lines[j]); j++) {
        if (isSeparator(lines[j])) continue;
        add(head ? 'marHead' : 'mar', cells(lines[j]).join(' | '));
        head = false;
      }
      i = j - 1;
      continue;
    }
    if (!line) { flush(); continue; }
    if (COMMENT.test(line) || /^(-{3,}|\*{3,}|_{3,})$/.test(line) || /^!\[[^\]]*\]\([^)]*\)$/.test(line)) { flush(); continue; }
    if (line.startsWith('```')) {
      flush();
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) {
        const t = lines[i].replace(/\s+$/, '');
        if (t.trim()) add('meta', t.trim());
      }
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flush(); add(h[1].length === 1 ? 'title' : 'h', plain(h[2].replace(/\s#+$/, ''))); continue; }
    const li = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) { flush(); add('li', plain(li[1])); continue; }
    if (isTableRow(line)) {
      flush();
      if (!isSeparator(line)) add('meta', cells(line).join(' · '));
      continue;
    }
    para.push(line);
  }
  flush();

  return pages
    .sort((a, b) => a.n - b.n)
    .map((p) => ({
      n: p.n,
      label: p.label || labelFrom(p.raw) || `Page ${p.n}`,
      blocks: p.raw.map(([k, t], idx): Block => ({ id: `p${p.n}b${idx}`, k, t, idx, page: p.n })),
    }));
}
