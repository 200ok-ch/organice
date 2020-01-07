import { parseOrg } from '../../lib/parse_org';
import readFixture from '../../../test_helpers/index';
import { noLogRepeatEnabledP } from '../../reducers/org';

describe('Unit Tests for Org file', () => {
  describe('Reducers and helper functions', () => {
    describe('"nologrepeat" configuration', () => {
      test('Detects "nologrepeat" when set in #+STARTUP as only option', () => {
        const testOrgFile = readFixture('schedule_with_repeater_and_nologrepeat');
        const state = parseOrg(testOrgFile);
        expect(noLogRepeatEnabledP({ state, headerIndex: 0 })).toBe(true);
      });
      test('Detects "nologrepeat" when set in #+STARTUP with other options', () => {
        const testOrgFile = readFixture('schedule_with_repeater_and_nologrepeat_and_other_options');
        const state = parseOrg(testOrgFile);
        expect(noLogRepeatEnabledP({ state, headerIndex: 0 })).toBe(true);
      });
      test('Does not detect "nologrepeat" when not set', () => {
        const testOrgFile = readFixture('schedule_with_repeater');
        const state = parseOrg(testOrgFile);
        expect(noLogRepeatEnabledP({ state, headerIndex: 0 })).toBe(false);
      });
      test('Detects "nologrepeat" when set via a property list', () => {
        const testOrgFile = readFixture('schedule_with_repeater_and_nologrepeat_property');
        const state = parseOrg(testOrgFile);
        expect(noLogRepeatEnabledP({ state, headerIndex: 1 })).toBe(true);
        expect(noLogRepeatEnabledP({ state, headerIndex: 2 })).toBe(true);
        expect(noLogRepeatEnabledP({ state, headerIndex: 5 })).toBe(false);
        expect(noLogRepeatEnabledP({ state, headerIndex: 7 })).toBe(true);
      });
    });
  });
});
