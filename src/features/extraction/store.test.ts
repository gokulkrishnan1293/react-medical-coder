import { beforeEach, describe, expect, it } from 'vitest';
import { locate } from '@/data';
import { useFindingsStore } from '@/features/findings';
import { nearOf, resolveFlags, useExtractionStore } from './store';

const s = () => useExtractionStore.getState();
const block = locate(3, 'Glucose 612 mg/dL')!;

describe('extraction flags', () => {
  beforeEach(() => { useExtractionStore.setState({ flags: [], draft: null }); useFindingsStore.setState({ readOnly: false }); });

  it('adds, edits and removes a flag', () => {
    s().add({ kind: 'data', page: 3, block, text: 'Glucose 612 mg/dL', shouldRead: 'Glucose 672 mg/dL' });
    const id = s().flags[0].id;
    s().update(id, { comment: 'Scan shows 672' });
    expect(s().flags[0]).toMatchObject({ kind: 'data', shouldRead: 'Glucose 672 mg/dL', comment: 'Scan shows 672' });
    s().remove(id);
    expect(s().flags).toEqual([]);
  });

  it('refuses changes while the review is completed', () => {
    useFindingsStore.setState({ readOnly: true });
    s().add({ kind: 'formatting', page: 3, block, text: 'Glucose 612 mg/dL' });
    expect(s().flags).toEqual([]);
  });

  it('finds saved flags again by words, or by where content is missing, and reports the ones that no longer fit', () => {
    const { flags, lost } = resolveFlags([
      { id: 'a', kind: 'data', page: 3, text: 'Glucose 612 mg/dL', createdAt: '' },
      { id: 'b', kind: 'missing', page: 3, near: nearOf(block), createdAt: '' },
      { id: 'c', kind: 'data', page: 3, text: 'words that are not on page 3', createdAt: '' },
    ]);
    expect(flags.map((f) => [f.id, f.block])).toEqual([['a', block], ['b', block]]);
    expect(lost).toBe(1);
  });
});
