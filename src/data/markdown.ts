import type { Block, BlockKind, RecordPage, TableCell, TextSpan } from '@/types';

/*
 * Turns a case's record.md into record pages. Each Markdown element becomes a block of the record, and its
 * formatting is kept alongside the block's plain text, so findings can still anchor to exact words:
 *
 *   <!-- Page: 2 -->           starts page 2 (text before the first marker is page 1). The page is named after
 *                              its first section heading; <!-- Page: 2 | Exam --> names it explicitly
 *   **WHOLE LINE BOLD**        org      facility name at the top of a form
 *   *Whole line italic*        sub      address or sub-heading line
 *   # Title   (or ===== under) title
 *   ## Heading (or ----- under) h
 *   ### Heading  (#### …)      h3
 *   paragraph                  p        lines of one paragraph are joined with a space
 *   - item   1. item           li       nested by indentation (2 spaces a level); - [ ] / - [x] checkboxes
 *   > quoted                   quote
 *   --- / *** / ___            hr
 *   ```text … ```  (or ```)    meta     one block per line, spacing kept (vitals, labs, the patient header)
 *   ```lang … ```              code     one block, line breaks kept
 *   <!-- MAR --> + table       marHead + mar   header row, then one row per administration, cells joined " | "
 *   any other table            thead + tr      pipe tables (outer pipes optional, :--: alignment) and HTML <table>s,
 *                                          whose colspan / rowspan (grouped, multi-level headers) are kept
 *   <!-- Columns -->           what follows is laid out in columns side by side, until <!-- /Columns -->;
 *   <!-- Column -->            <!-- Column --> starts the next column (a two-column form, say)
 *
 * Inside any block, **bold**, *italic*, `code`, ~~strike~~, [links](url) and <https://autolinks> are kept as spans
 * over the plain text; <b>, <i>, <br> and other inline HTML are understood or dropped. Other HTML comments and
 * images are ignored.
 */

const PAGE = /^<!--\s*Page:\s*(\d+)\s*(?:\|\s*(.*?))?\s*-->$/i;
const MAR = /^<!--\s*MAR\s*-->$/i;
const COMMENT = /^<!--.*-->$/;
const COLUMNS = /^<!--\s*Columns(?:\s*:\s*\d+)?\s*-->$/i;
const COLUMN = /^<!--\s*Column(?:\s+break)?\s*-->$/i;
const END_COLUMNS = /^<!--\s*(?:\/|End\s+)Columns\s*-->$/i;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m);

/** Inline HTML the extraction may leave: links and line breaks kept, b/i/strong/em/s as Markdown, other tags dropped. */
const htmlInline = (s: string) => decode(
  s.replace(/<(https?:\/\/[^>\s]+)>/gi, '[$1]($1)')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '*')
    .replace(/<\/?(s|del|strike)>/gi, '~~')
    .replace(/<\/?[a-z][^>]*>/gi, ''),
);

/** Inline Markdown to plain text plus formatting spans over it. */
export function inline(source: string): { text: string; spans: TextSpan[] } {
  const src = htmlInline(source);
  let out = '';
  const spans: TextSpan[] = [];
  const open: { m: string; at: number }[] = [];
  const kind: Record<string, keyof TextSpan> = { '**': 'bold', __: 'bold', '*': 'italic', _: 'italic', '~~': 'strike' };

  // CommonMark-style flanking: an opener comes before a word, a closer after one
  const space = (ch: string | undefined) => ch === undefined || /\s/.test(ch);
  const canOpen = (i: number, m: string) => !space(src[i + m.length]);
  const canClose = (i: number) => !space(src[i - 1]);
  /** A later run of `c` that can close emphasis opened before `from`. */
  const closerAfter = (c: string, from: number) => {
    for (let j = src.indexOf(c, from + 1); j >= 0; j = src.indexOf(c, j + 1)) if (!space(src[j - 1])) return true;
    return false;
  };
  /** A later marker that can close one opened at i. */
  const closes = (m: string, i: number) => {
    for (let j = src.indexOf(m, i + m.length + 1); j >= 0; j = src.indexOf(m, j + 1)) if (canClose(j)) return true;
    return false;
  };
  const toggle = (m: string, i: number) => {
    const k = open.findIndex((o) => o.m === m);
    if (k >= 0 && canClose(i)) {
      const o = open.splice(k)[0];
      if (out.length > o.at) spans.push({ s: o.at, e: out.length, [kind[m]]: true });
      return true;
    }
    // only open when it closes later, so a stray * or _ stays as written
    if (!canOpen(i, m) || !closes(m, i)) return false;
    open.push({ m, at: out.length });
    return true;
  };

  for (let i = 0; i < src.length;) {
    const c = src[i];
    const rest = src.slice(i);
    if (c === '\\' && /[\\`*_{}[\]()#+\-.!|~>]/.test(src[i + 1] ?? '')) { out += src[i + 1]; i += 2; continue; }
    if (c === '`') {
      const j = src.indexOf('`', i + 1);
      if (j > i) { const s = out.length; out += src.slice(i + 1, j); spans.push({ s, e: out.length, code: true }); i = j + 1; continue; }
    }
    if (c === '!' && src[i + 1] === '[') {
      const m = /^!\[[^\]]*\]\([^)]*\)/.exec(rest);
      if (m) { i += m[0].length; continue; }
    }
    if (c === '[') {
      const m = /^\[([^\]]*)\]\(\s*<?([^)\s>]*)>?(?:\s+"[^"]*")?\s*\)/.exec(rest);
      if (m) {
        const inner = inline(m[1]);
        const s = out.length;
        out += inner.text;
        inner.spans.forEach((sp) => spans.push({ ...sp, s: sp.s + s, e: sp.e + s }));
        spans.push({ s, e: out.length, href: m[2] });
        i += m[0].length;
        continue;
      }
    }
    if (src.slice(i, i + 2) === '~~' && toggle('~~', i)) { i += 2; continue; }
    if (c === '*' || c === '_') {
      // a run of * or _: close the innermost open emphasis first, then open with what is left
      let r = 1;
      while (src[i + r] === c) r++;
      // snake_case, 2*3 and 2 * 3 are not emphasis
      const intraword = c === '_' && /\w/.test(src[i - 1] ?? '') && /\w/.test(src[i + r] ?? '');
      const arithmetic = r === 1 && /\d/.test(src[i - 1] ?? '') && /\d/.test(src[i + 1] ?? '');
      let left = r;
      if (!intraword && !arithmetic) {
        if (!space(src[i - 1])) {
          while (left > 0 && open.length && open[open.length - 1].m[0] === c && open[open.length - 1].m.length <= left) {
            const o = open.pop()!;
            if (out.length > o.at) spans.push({ s: o.at, e: out.length, [kind[o.m]]: true });
            left -= o.m.length;
          }
        }
        if (left > 0 && !space(src[i + r]) && closerAfter(c, i + r)) {
          (left >= 3 ? [c + c, c] : left === 2 ? [c + c] : [c]).forEach((m) => open.push({ m, at: out.length }));
          left = 0;
        }
      }
      out += c.repeat(left);
      i += r;
      continue;
    }
    out += c;
    i++;
  }
  // trim, keeping spans in step
  const lead = out.length - out.trimStart().length;
  const text = out.trim();
  const clipped = spans
    .map((sp) => ({ ...sp, s: Math.max(0, sp.s - lead), e: Math.min(text.length, sp.e - lead) }))
    .filter((sp) => sp.e > sp.s);
  return { text, spans: clipped };
}

/** Inline Markdown to plain text. */
export const plain = (s: string) => inline(s).text;

const isPipeRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-');
const cellsOf = (row: string) => row.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
const alignOf = (sep: string): TableCell['align'] => {
  const t = sep.trim();
  return t.startsWith(':') && t.endsWith(':') ? 'center' : t.endsWith(':') ? 'right' : t.startsWith(':') ? 'left' : undefined;
};

/** An HTML table (as Document Intelligence writes them): rows of header and body cells. */
function htmlRows(html: string): { head: boolean; cells: string[]; spans: { colSpan?: number; rowSpan?: number }[] }[] {
  const thead = /<thead[^>]*>[\s\S]*?<\/thead>/i.exec(html);
  const num = (attrs: string, name: string) => { const v = Number(new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, 'i').exec(attrs)?.[1]); return v > 1 ? v : undefined; };
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => {
    const cells = [...m[1].matchAll(/<(t[hd])([^>]*)>([\s\S]*?)<\/t[hd]>/gi)];
    return {
      head: /<th[\s>]/i.test(m[1]) || (!!thead && m.index! >= thead.index && m.index! < thead.index + thead[0].length),
      cells: cells.map((c) => c[3].trim()),
      spans: cells.map((c) => ({ colSpan: num(c[2], 'colspan'), rowSpan: num(c[2], 'rowspan') })),
    };
  });
}

type Raw = Omit<Block, 'id' | 'idx' | 'page'>;
const LIST = /^(\s*)([-*+]|(\d+)[.)])\s+(.*)$/;

export function parseRecord(md: string): RecordPage[] {
  const pages: { n: number; label: string; raw: Raw[] }[] = [];
  let page: (typeof pages)[number] | null = null;
  let tables = 0;
  let groups = 0;
  /** Inside <!-- Columns -->: the group and the column blocks are added to. */
  let cols: { group: string; col: number } | null = null;
  const add = (b: Raw) => {
    if (!b.t && b.k !== 'hr') return;
    if (!page) { page = { n: 1, label: '', raw: [] }; pages.push(page); }
    page.raw.push(cols ? { ...b, cols: { ...cols, of: 0 } } : b);
  };
  const withInline = (k: BlockKind, src: string, extra: Partial<Raw> = {}) => {
    const { text, spans } = inline(src);
    add({ k, t: text, ...(spans.length ? { spans } : {}), ...extra });
  };
  /** One table row: cells joined with " | " in the text, each cell's range and formatting kept. */
  const row = (k: 'thead' | 'tr' | 'marHead' | 'mar', cellsSrc: string[], table?: string, aligns: TableCell['align'][] = [], cellSpans: { colSpan?: number; rowSpan?: number }[] = []) => {
    let t = '';
    const cells: TableCell[] = [];
    const spans: TextSpan[] = [];
    cellsSrc.forEach((c, i) => {
      if (i) t += ' | ';
      const { text, spans: sp } = inline(c);
      const s = t.length;
      t += text;
      const span = cellSpans[i] ?? {};
      cells.push({ s, e: t.length, ...(aligns[i] ? { align: aligns[i] } : {}), ...(span.colSpan ? { colSpan: span.colSpan } : {}), ...(span.rowSpan ? { rowSpan: span.rowSpan } : {}) });
      sp.forEach((x) => spans.push({ ...x, s: x.s + s, e: x.e + s }));
    });
    if (k === 'mar' || k === 'marHead') add({ k, t });
    else add({ k, t, cells, table, ...(spans.length ? { spans } : {}) });
  };

  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    const src = para.join(' ').trim();
    para = [];
    if (/^\*\*[^*].*\*\*$/.test(src) && !src.slice(2, -2).includes('**')) add({ k: 'org', t: plain(src) });
    else if (/^[*_][^*_].*[*_]$/.test(src) && !/[*_]/.test(src.slice(1, -1))) add({ k: 'sub', t: plain(src) });
    else withInline('p', src);
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const next = lines[i + 1] ?? '';
    const pm = PAGE.exec(line);
    if (pm) {
      flush();
      page = { n: Number(pm[1]), label: pm[2]?.trim() ?? '', raw: [] };
      pages.push(page);
      continue;
    }
    if (MAR.test(line)) {
      flush();
      // the table that follows is a MAR: header, then administrations
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      let head = true;
      for (; j < lines.length && lines[j].includes('|'); j++) {
        if (isSeparator(lines[j])) continue;
        row(head ? 'marHead' : 'mar', cellsOf(lines[j]));
        head = false;
      }
      i = j - 1;
      continue;
    }
    if (!line) { flush(); continue; }
    // a heading underlined with === or --- (setext) is the paragraph line above it
    if (para.length && /^=+$/.test(line)) { const t = para.join(' '); para = []; withInline('title', t); continue; }
    if (para.length && /^-+$/.test(line)) { const t = para.join(' '); para = []; withInline('h', t); continue; }
    if (/^<table[\s>]/i.test(line)) {
      flush();
      let html = '';
      let j = i;
      for (; j < lines.length; j++) { html += lines[j] + '\n'; if (/<\/table>/i.test(lines[j])) break; }
      const table = `t${++tables}`;
      htmlRows(html).forEach((r) => row(r.head ? 'thead' : 'tr', r.cells, table, [], r.spans));
      i = j;
      continue;
    }
    if (COLUMNS.test(line)) { flush(); cols = { group: `c${++groups}`, col: 0 }; continue; }
    if (COLUMN.test(line)) { flush(); const c = cols as { group: string; col: number } | null; if (c) cols = { group: c.group, col: c.col + 1 }; continue; }
    if (END_COLUMNS.test(line)) { flush(); cols = null; continue; }
    if (COMMENT.test(line) || /^!\[[^\]]*\]\([^)]*\)$/.test(line)) { flush(); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.replace(/\s/g, ''))) { flush(); add({ k: 'hr', t: '' }); continue; }
    if (line.startsWith('```') || line.startsWith('~~~')) {
      flush();
      const fence = line.slice(0, 3);
      const lang = line.slice(3).trim().toLowerCase();
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence); i++) body.push(lines[i].replace(/\s+$/, ''));
      // ```text (or no language): one line per block, as records lay out vitals and labs; other code stays whole
      if (!lang || lang === 'text') body.forEach((t) => { if (t.trim()) add({ k: 'meta', t: t.trim() }); });
      else add({ k: 'code', t: body.join('\n') });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flush(); withInline(h[1].length === 1 ? 'title' : h[1].length === 2 ? 'h' : 'h3', h[2].replace(/\s#+$/, '')); continue; }
    if (line.startsWith('>')) {
      flush();
      const quoted: string[] = [];
      for (; i < lines.length && lines[i].trim().startsWith('>'); i++) quoted.push(lines[i].trim().replace(/^(>\s?)+/, ''));
      i--;
      withInline('quote', quoted.join(' '));
      continue;
    }
    const li = LIST.exec(raw);
    if (li) {
      flush();
      const depth = Math.floor(li[1].replace(/\t/g, '    ').length / 2);
      let text = li[4];
      // lines indented under an item continue it
      while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !LIST.test(lines[i + 1])) text += ' ' + lines[++i].trim();
      const box = /^\[([ xX])\]\s+(.*)$/.exec(text);
      withInline('li', box ? box[2] : text, { list: { ordered: !!li[3], n: li[3] ? Number(li[3]) : 0, depth, ...(box ? { checked: box[1] !== ' ' } : {}) } });
      continue;
    }
    // a pipe table: header, a separator row with alignment, then the body (outer pipes optional)
    if (isPipeRow(line) || (line.includes('|') && isSeparator(next))) {
      flush();
      const table = `t${++tables}`;
      const head = cellsOf(line);
      const sep = isSeparator(next) ? cellsOf(lines[++i]) : null;
      const aligns = sep ? sep.map(alignOf) : [];
      row(sep ? 'thead' : 'tr', head, table, aligns);
      for (; i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].includes('|'); i++) row('tr', cellsOf(lines[i + 1]), table, aligns);
      continue;
    }
    para.push(line);
  }
  flush();

  // every block in a column group learns how many columns the group has
  for (const p of pages) {
    const count: Record<string, number> = {};
    p.raw.forEach((b) => { if (b.cols) count[b.cols.group] = Math.max(count[b.cols.group] ?? 0, b.cols.col + 1); });
    p.raw.forEach((b) => { if (b.cols) b.cols.of = count[b.cols.group]; });
  }

  return pages
    .sort((a, b) => a.n - b.n)
    .map((p) => ({
      n: p.n,
      label: p.label || labelFrom(p.raw) || `Page ${p.n}`,
      blocks: p.raw.map((b, idx): Block => ({ id: `p${p.n}b${idx}`, idx, page: p.n, ...b })),
    }));
}

/** A page's name: its first section heading (else its title), as written. */
const labelFrom = (raw: Raw[]) => (raw.find((b) => b.k === 'h') ?? raw.find((b) => b.k === 'title'))?.t ?? '';
