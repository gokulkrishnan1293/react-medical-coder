import { describe, expect, it } from 'vitest';
import { useFindingsStore } from './findingsStore';

const get = (id: string) => useFindingsStore.getState().findings.find((f) => f.id === id)!;

describe('editCode', () => {
  it('changes the code, remembers the original, and can be undone', () => {
    const { editCode, undo } = useFindingsStore.getState();
    editCode('s2', '82009', 'Ketone bodies, qualitative');
    expect(get('s2')).toMatchObject({ code: '82009', editedFrom: '82010' });
    editCode('s2', '82010', 'Ketone bodies, quantitative');
    expect(get('s2').editedFrom).toBeUndefined();
    undo();
    undo();
    expect(get('s2').code).toBe('82010');
    expect(get('s2').editedFrom).toBeUndefined();
  });
});
