import { describe, expect, it } from 'vitest';
import { rankMdm, searchCodes } from './codeSearch';

describe('code search', () => {
  it('finds dehydration from exam wording', () => {
    expect(searchCodes('Patient is clinically dehydrated', 'dx')[0].code).toBe('E86.0');
  });
  it('suggests hospitalization risk for an admission discussion', () => {
    const r = rankMdm('Discussed direct hospital admission for IV fluids');
    expect(r[0].label).toBe('Decision regarding hospitalization');
    expect(r[0].suggested).toBe(true);
  });
});
