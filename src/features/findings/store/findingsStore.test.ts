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

describe('setStatus', () => {
  it('accepts a code at every place CLAIRE found it, in one undo step', () => {
    const { setStatus, undo } = useFindingsStore.getState();
    setStatus('d2', 'confirmed');
    expect([get('d2').status, get('d2b').status]).toEqual(['confirmed', 'confirmed']);
    expect(useFindingsStore.getState().toast?.msg).toBe('Accepted E11.10 · 2 places');
    undo();
    expect([get('d2').status, get('d2b').status]).toEqual(['ai', 'ai']);
  });

  it('leaves places already reviewed as they are', () => {
    const { setStatus, setPlaceStatus, undo } = useFindingsStore.getState();
    setPlaceStatus('d2b', 'rejected');
    setStatus('d2', 'confirmed');
    expect([get('d2').status, get('d2b').status]).toEqual(['confirmed', 'rejected']);
    undo();
    undo();
  });
});

describe('setEvidence', () => {
  it('remembers where the evidence first pointed, and forgets it when moved back', () => {
    const { setEvidence, undo } = useFindingsStore.getState();
    const orig = { page: get('d3').page, block: get('d3').block, text: get('d3').text };
    setEvidence('d3', { page: 5, block: get('d3b').block, text: 'kidney' });
    setEvidence('d3', { page: 2, block: get('d1b').block, text: 'vomiting' });
    expect(get('d3').movedFrom).toEqual(orig);
    setEvidence('d3', orig);
    expect(get('d3').movedFrom).toBeUndefined();
    undo(); undo(); undo();
  });
});

describe('editCode across places', () => {
  it('changes the code at every place, each remembering the original', () => {
    const { editCode, undo } = useFindingsStore.getState();
    editCode('d4', 'E87.20', 'Acidosis, unspecified');
    expect([get('d4').code, get('d4b').code]).toEqual(['E87.20', 'E87.20']);
    expect([get('d4').editedFrom, get('d4b').editedFromDesc]).toEqual(['E87.5', 'Hyperkalemia']);
    undo();
    expect(get('d4b').code).toBe('E87.5');
  });
});
