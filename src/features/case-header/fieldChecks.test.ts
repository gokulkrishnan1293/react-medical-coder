import { describe, expect, it } from 'vitest';
import { CLAIM, ENCOUNTER, INITIAL_FINDINGS, PATIENT } from '@/data';
import { ageOn, checkFields, parseDate } from './fieldChecks';

const state = (checks: ReturnType<typeof checkFields>) => Object.fromEntries(checks.map((c) => [c.key, c.state]));

describe('checkFields', () => {
  it('demo case: identity and dates verified, reason for visit is a mismatch', () => {
    expect(state(checkFields(PATIENT, ENCOUNTER, CLAIM, INITIAL_FINDINGS))).toEqual({
      name: 'verified', dob: 'verified', age: 'verified', dos: 'verified', reason: 'mismatch',
    });
  });

  it('verifies the reason when the record supports the claim diagnosis', () => {
    const c = checkFields(PATIENT, ENCOUNTER, { ...CLAIM, reasonDx: 'R11.2' }, INITIAL_FINDINGS);
    expect(state(c).reason).toBe('verified');
  });

  it('flags mismatches between claim and record', () => {
    const c = checkFields(PATIENT, ENCOUNTER, { ...CLAIM, patient: { name: 'DOE, JORDAN', dob: '11/19/1987' }, dos: '05/03/2026' }, INITIAL_FINDINGS);
    expect(state(c)).toMatchObject({ name: 'mismatch', dob: 'mismatch', dos: 'mismatch' });
  });

  it('flags invalid values', () => {
    expect(state(checkFields({ ...PATIENT, dob: '02/30/1978' }, ENCOUNTER, CLAIM, INITIAL_FINDINGS)).dob).toBe('invalid');
    expect(state(checkFields({ ...PATIENT, dob: '11/19/2027' }, ENCOUNTER, CLAIM, INITIAL_FINDINGS)).dob).toBe('invalid');
    expect(state(checkFields({ ...PATIENT, age: 45 }, ENCOUNTER, CLAIM, INITIAL_FINDINGS)).age).toBe('invalid');
  });

  it('parses dates and ages', () => {
    expect(parseDate('13/01/2020')).toBeNull();
    expect(ageOn(parseDate('11/19/1978')!, parseDate('05/02/2026')!)).toBe(47);
    expect(ageOn(parseDate('05/02/1978')!, parseDate('05/02/2026')!)).toBe(48);
  });
});
