import { describe, expect, it } from 'vitest';
import { billingUnits, searchCodes } from './codeSearch';

describe('code search', () => {
  it('finds dehydration from exam wording', () => {
    expect(searchCodes('dry mucous membranes, sunken eyes', 'dx')[0].code).toBe('E86.0');
  });
  it('finds the drug code for a MAR row', () => {
    expect(searchCodes('Dextrose 5% / 0.45% NaCl', 'drug')[0].code).toBe('J7042');
  });
});

describe('billing units', () => {
  it('divides the dose by the code unit', () => {
    expect(billingUnits('20 mEq', '2 mEq')).toBe(10);
    expect(billingUnits('4 mg', '1 mg')).toBe(4);
    expect(billingUnits('1000 mL', '1000 cc')).toBe(1);
  });
  it('falls back to 1 when units do not compare', () => {
    expect(billingUnits('150 mL/hr', '5 units')).toBe(1);
    expect(billingUnits('as directed', '1 mg')).toBe(1);
  });
});
