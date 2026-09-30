import { describe, expect, it } from 'vitest';
import { inline, parseRecord, plain } from './markdown';
import { PAGES } from './current';
import demo from './cases/RC-2026-1187/record.md?raw';

const blocks = (md: string) => parseRecord(md)[0].blocks;
const kt = (md: string) => blocks(md).map((b) => [b.k, b.t]);
/** The text a span covers, and what it is. */
const spanned = (md: string) => {
  const b = blocks(md)[0];
  return (b.spans ?? []).map(({ s, e, ...f }) => [b.t.slice(s, e), Object.keys(f).join('+') + (f.href ? `=${f.href}` : '')]);
};

describe('parseRecord', () => {
  it('reads the demo record.md into its five pages, named after their first headings', () => {
    const pages = parseRecord(demo);
    expect(pages.map((p) => [p.n, p.label, p.blocks.length])).toEqual([
      [1, 'TRIAGE', 17], [2, 'PHYSICAL EXAMINATION', 9], [3, 'LABORATORY RESULTS (collected 02:31)', 10], [4, 'MEDICATION ADMINISTRATION RECORD', 12], [5, 'ED COURSE AND MEDICAL DECISION MAKING', 15],
    ]);
    expect(pages[3].blocks.filter((b) => b.k === 'mar')).toHaveLength(6);
    expect(pages).toEqual(PAGES);
  });

  it('splits pages at <!-- Page: n -->, naming each after its first heading', () => {
    const pages = parseRecord('Before any marker\n\n<!-- Page: 2 -->\n## PHYSICAL EXAM\n\n<!-- Page: 3 | Labs -->\ntext');
    expect(pages.map((p) => [p.n, p.label, p.blocks.map((b) => b.k)])).toEqual([
      [1, 'Page 1', ['p']], [2, 'PHYSICAL EXAM', ['h']], [3, 'Labs', ['p']],
    ]);
  });

  it('keeps every heading level, including underlined (setext) headings', () => {
    expect(kt('# One\n## Two\n### Three\n#### Four\n\nFive\n=====\n\nSix\n---')).toEqual([
      ['title', 'One'], ['h', 'Two'], ['h3', 'Three'], ['h3', 'Four'], ['title', 'Five'], ['h', 'Six'],
    ]);
  });

  it('keeps bold, italic, code, strike and links as spans over the plain text', () => {
    expect(kt('A **bold** and [linked](http://x) line\ncontinues here.')).toEqual([['p', 'A bold and linked line continues here.']]);
    expect(spanned('Give **aspirin** *now*, not `ASA-81`, ~~oral~~ IV; see [policy](https://p/1) or <https://q.org>.')).toEqual([
      ['aspirin', 'bold'], ['now', 'italic'], ['ASA-81', 'code'], ['oral', 'strike'], ['policy', 'href=https://p/1'], ['https://q.org', 'href=https://q.org'],
    ]);
    expect(spanned('***both*** and __bold__ and _it_').map(([t, k]) => `${t}:${k}`).sort()).toEqual(['bold:bold', 'both:bold', 'both:italic', 'it:italic']);
    expect(spanned('Note: **Bold with *italic* inside** here').map(([t, k]) => `${t}:${k}`).sort()).toEqual(['Bold with italic inside:bold', 'italic:italic']);
  });

  it('understands inline HTML and entities the extraction leaves', () => {
    expect(kt('Na&nbsp;128 &amp; K&lt;6<br>next <b>bold</b> <sup>2</sup>')).toEqual([['p', 'Na 128 & K<6 next bold 2']]);
    expect(spanned('<i>italic</i> <a href="https://x">link</a>')).toEqual([['italic', 'italic'], ['link', 'href=https://x']]);
  });

  it('keeps plain punctuation that only looks like Markdown', () => {
    expect(plain('2*3 and snake_case_name, 5% of *this*')).toBe('2*3 and snake_case_name, 5% of this');
    expect(plain('a * b * c, and \\*escaped\\* and a lone _underscore')).toBe('a * b * c, and *escaped* and a lone _underscore');
    expect(inline('**unclosed bold').text).toBe('**unclosed bold');
  });

  it('keeps lists: bullets, numbers, nesting and checkboxes', () => {
    const b = blocks('- one\n  - one-a\n    continued\n2. two\n3) three\n- [x] done\n- [ ] to do');
    expect(b.map((x) => [x.t, x.list])).toEqual([
      ['one', { ordered: false, n: 0, depth: 0 }],
      ['one-a continued', { ordered: false, n: 0, depth: 1 }],
      ['two', { ordered: true, n: 2, depth: 0 }],
      ['three', { ordered: true, n: 3, depth: 0 }],
      ['done', { ordered: false, n: 0, depth: 0, checked: true }],
      ['to do', { ordered: false, n: 0, depth: 0, checked: false }],
    ]);
  });

  it('keeps quotes, rules, text blocks and code blocks', () => {
    expect(kt('> Quoted\n> on two lines\n\n---\n\n```text\nBP 120/80     HR 88\nRR 16\n```\n\n```json\n{ "a": 1 }\n  "b"\n```')).toEqual([
      ['quote', 'Quoted on two lines'], ['hr', ''], ['meta', 'BP 120/80     HR 88'], ['meta', 'RR 16'], ['code', '{ "a": 1 }\n  "b"'],
    ]);
  });

  it('keeps pipe tables as tables: header, rows, cells, alignment and formatting in cells', () => {
    const b = blocks('| Test | Result | Flag |\n|:---|---:|:--:|\n| **Na** | 128 | L |\n| K | 5.6 | `H` |');
    expect(b.map((x) => [x.k, x.t, x.table])).toEqual([
      ['thead', 'Test | Result | Flag', 't1'], ['tr', 'Na | 128 | L', 't1'], ['tr', 'K | 5.6 | H', 't1'],
    ]);
    expect(b[0].cells!.map((c) => [b[0].t.slice(c.s, c.e), c.align])).toEqual([['Test', 'left'], ['Result', 'right'], ['Flag', 'center']]);
    expect(b[1].spans).toEqual([{ s: 0, e: 2, bold: true }]);
    expect(b[2].spans).toEqual([{ s: 10, e: 11, code: true }]);
  });

  it('keeps tables written without outer pipes, and separate tables apart', () => {
    const b = blocks('A | B\n--|--\n1 | 2\n\ntext\n\n| C |\n|---|\n| 3 |');
    expect(b.map((x) => [x.k, x.t, x.table ?? ''])).toEqual([['thead', 'A | B', 't1'], ['tr', '1 | 2', 't1'], ['p', 'text', ''], ['thead', 'C', 't2'], ['tr', '3', 't2']]);
  });

  it('reads HTML tables as Document Intelligence writes them', () => {
    const md = '<table>\n<thead><tr><th>Drug</th><th>Dose</th></tr></thead>\n<tr><td><b>Morphine</b></td><td>2&nbsp;mg</td></tr>\n</table>';
    const b = blocks(md);
    expect(b.map((x) => [x.k, x.t])).toEqual([['thead', 'Drug | Dose'], ['tr', 'Morphine | 2 mg']]);
    expect(b[1].spans).toEqual([{ s: 0, e: 8, bold: true }]);
  });

  it('keeps a MAR table as MAR rows', () => {
    expect(kt('<!-- MAR -->\n| Time | Drug |\n|---|---|\n| 02:40 | Saline |')).toEqual([['marHead', 'Time | Drug'], ['mar', '02:40 | Saline']]);
  });

  it('keeps grouped, multi-level table headers: colspan and rowspan', () => {
    const md = '<table>\n<tr><th rowspan="2">Time</th><th colspan="3">Vitals</th></tr>\n<tr><th>BP</th><th>HR</th><th>RR</th></tr>\n<tr><td>02:14</td><td>96/58</td><td>124</td><td>26</td></tr>\n</table>';
    const b = blocks(md);
    expect(b.map((x) => [x.k, x.t])).toEqual([['thead', 'Time | Vitals'], ['thead', 'BP | HR | RR'], ['tr', '02:14 | 96/58 | 124 | 26']]);
    expect(b[0].cells!.map((c) => [c.colSpan, c.rowSpan])).toEqual([[undefined, 2], [3, undefined]]);
  });

  it('lays content out in columns between <!-- Columns --> and <!-- /Columns -->', () => {
    const b = blocks('Before\n\n<!-- Columns -->\n## Left\nleft text\n<!-- Column -->\n## Right\n- right item\n<!-- /Columns -->\n\nAfter');
    expect(b.map((x) => [x.t, x.cols ? `${x.cols.group}:${x.cols.col}/${x.cols.of}` : ''])).toEqual([
      ['Before', ''], ['Left', 'c1:0/2'], ['left text', 'c1:0/2'], ['Right', 'c1:1/2'], ['right item', 'c1:1/2'], ['After', ''],
    ]);
  });

  it('keeps every construct in the formatting sample case', async () => {
    const md = (await import('./cases/RC-2026-1215/record.md?raw')).default;
    const pages = parseRecord(md);
    const all = pages.flatMap((p) => p.blocks);
    const kinds = new Set(all.map((b) => b.k));
    for (const k of ['org', 'sub', 'title', 'meta', 'h', 'h3', 'p', 'li', 'quote', 'hr', 'code', 'marHead', 'mar', 'thead', 'tr']) expect(kinds, k).toContain(k);
    const marks = new Set(all.flatMap((b) => (b.spans ?? []).flatMap((s) => Object.keys(s).filter((k) => k !== 's' && k !== 'e'))));
    expect([...marks].sort()).toEqual(['bold', 'code', 'href', 'italic', 'strike']);
    expect(all.filter((b) => b.list?.depth === 1).map((b) => b.t)).toEqual(['Walker at home', 'No compression stockings']);
    expect(all.filter((b) => b.list?.ordered).map((b) => b.list!.n)).toEqual([1, 2]);
    expect(all.filter((b) => b.list?.checked !== undefined).map((b) => b.list!.checked)).toEqual([true, true, false]);
    expect(new Set(all.filter((b) => b.table).map((b) => b.table)).size).toBe(3);
    expect(all.find((b) => b.cells?.some((c) => c.colSpan === 3))?.t).toBe('Time | Vital signs | SpO2');
    expect(all.find((b) => b.k === 'thead' && b.t.startsWith('Test'))!.cells!.map((c) => c.align)).toEqual(['left', 'right', 'center', 'center']);
    expect(all.filter((b) => b.cols).map((b) => `${b.cols!.col}:${b.t.split(' ')[0]}`)).toEqual([
      '0:General', '0:Anxious,', '0:Tachypneic,', '0:Tachycardic,', '1:Extremities', '1:Right', '1:Surgical', '1:Left',
    ]);
    expect(all.find((b) => b.t === 'Review of systems')?.k).toBe('h');
  });
});
