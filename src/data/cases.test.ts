import { describe, expect, it } from 'vitest';
import { CASE_FOLDERS } from './caseFolders';
import { parseRecord } from './markdown';

/* Checks the case folders you prepare: run `npm test` after adding or editing one. */
describe.each(Object.values(CASE_FOLDERS))('case folder $id', (c) => {
  const pages = parseRecord(c.record);
  const blocks = pages.flatMap((p) => p.blocks);

  it('has pages', () => expect(pages.length).toBeGreaterThan(0));

  it("anchors every one of CLAIRE's findings to words on its page", () => {
    const missing = (c.findings ?? []).filter((f) => !pages.find((p) => p.n === f.page)?.blocks.some((b) => b.t.includes(f.text))).map((f) => `${f.id} (page ${f.page}: "${f.text}")`);
    expect(missing).toEqual([]);
  });

  it('anchors every MAR finding to a whole MAR row', () => {
    const bad = (c.findings ?? []).filter((f) => f.type === 'mar' && !blocks.some((b) => b.k === 'mar' && b.t === f.text)).map((f) => f.id);
    expect(bad).toEqual([]);
  });

  it('gives every finding a unique id', () => {
    const ids = (c.findings ?? []).map((f) => f.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});
