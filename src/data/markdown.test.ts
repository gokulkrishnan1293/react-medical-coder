import { describe, expect, it } from 'vitest';
import { parseRecord, plain } from './markdown';
import { PAGES } from './current';
import demo from './cases/RC-2026-1187/record.md?raw';

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

  it('formats headings, lists, text blocks and tables, and reduces inline Markdown to text', () => {
    const [p] = parseRecord([
      '# Title', '## Section', 'A **bold** and [linked](http://x) line', 'continues here.', '',
      '- one', '1. two', '```text', 'BP 120/80     HR 88', '```',
      '| Test | Result |', '|---|---|', '| Na | 128 |', '',
      '<!-- MAR -->', '| Time | Drug |', '|---|---|', '| 02:40 | Saline |',
    ].join('\n'));
    expect(p.blocks.map((b) => [b.k, b.t])).toEqual([
      ['title', 'Title'], ['h', 'Section'], ['p', 'A bold and linked line continues here.'],
      ['li', 'one'], ['li', 'two'], ['meta', 'BP 120/80     HR 88'],
      ['meta', 'Test · Result'], ['meta', 'Na · 128'],
      ['marHead', 'Time | Drug'], ['mar', '02:40 | Saline'],
    ]);
  });

  it('keeps plain punctuation that only looks like Markdown', () => {
    expect(plain('2*3 and snake_case_name, 5% of *this*')).toBe('2*3 and snake_case_name, 5% of this');
  });
});
