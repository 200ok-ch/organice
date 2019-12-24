
import readFixture from '../../test_helpers/index';
import { parseOrg } from './parse_org.js';

import { extractAllOrgProperties, computeAllPropertyNames, computeAllPropertyValuesFor } from './org_utils'

describe('Extracting and computing property names and values', () => {
  const testOrgFile = readFixture('properties_extended');
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const allProperties = extractAllOrgProperties(headers);
  test('Did we got all properties?', () => {
    expect(allProperties.size).toEqual(8);
  });
  describe('Compute property names', () => {
    test('Computes distinct property names (alphabetical order)', () => {
      const result = computeAllPropertyNames(allProperties);
      expect(result.toJS()).toEqual(['bar', 'bay', 'baz', 'emptyprop', 'foo', 'foo2']);
    });
  });
  describe('Compute property values for a certain property', () => {
    test('Computes distinct property values for a property (alphabetical order)', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'bar');
      expect(result.toJS()).toEqual(['xyz', 'zyx']);
    });
    test('Handles the case of empty values', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'emptyprop');
      expect(result.toJS()).toEqual(['']);
    });
    test('Handles the case of no values for a non-existing property', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'nonexisting');
      expect(result.isEmpty()).toBe(true);
    });
  });
});
