import readFixture from '../../test_helpers/index';
import { parseOrg } from './parse_org.js';
import { fromJS } from 'immutable';
import format from 'date-fns/format';

import {
  extractAllOrgProperties,
  computeAllPropertyNames,
  computeAllPropertyValuesFor,
  headerWithPath,
} from './org_utils';

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

describe('Find the headline at the end of the headline-path', () => {
  it('where the headline-path contains template variables as headlines', () => {
    // path to be traced: [today] > <today> > test
    const today = new Date();
    const inactiveTimestampAsHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: true,
      titleLine: {
        title: [
          {
            id: 7,
            type: 'timestamp',
            firstTimestamp: {
              month: format(today, 'MM'),
              dayName: format(today, 'eee'),
              isActive: false,
              day: format(today, 'dd'),
              year: format(today, 'yyyy'),
            },
            secondTimestamp: null,
          },
        ],
        rawTitle: `[${format(today, 'yyyy-MM-dd eee')}]`,
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 1,
      id: 8,
      description: [],
    };
    const activeTimestampAsHeadline = {
      planningItems: [
        {
          type: 'TIMESTAMP_TITLE',
          timestamp: {
            month: format(today, 'MM'),
            dayName: format(today, 'eee'),
            isActive: true,
            day: format(today, 'dd'),
            year: format(today, 'yyyy'),
          },
          id: 147,
        },
      ],
      logBookEntries: [],
      opened: true,
      titleLine: {
        title: [
          {
            id: 9,
            type: 'timestamp',
            firstTimestamp: {
              month: format(today, 'MM'),
              dayName: format(today, 'eee'),
              isActive: true,
              day: format(today, 'dd'),
              year: format(today, 'yyyy'),
            },
            secondTimestamp: null,
          },
        ],
        rawTitle: `<${format(today, 'yyyy-MM-dd eee')}>`,
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 2,
      id: 10,
      description: [],
    };
    const expectedHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: false,
      titleLine: {
        title: [
          {
            type: 'text',
            contents: 'test',
          },
        ],
        rawTitle: 'test',
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 3,
      id: 11,
      description: [],
    };
    const extraSiblingHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: false,
      titleLine: {
        title: [
          {
            type: 'text',
            contents: 'testnot',
          },
        ],
        rawTitle: 'testnot',
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 3,
      id: 200,
      description: [],
    };

    const headers = fromJS([
      inactiveTimestampAsHeadline,
      activeTimestampAsHeadline,
      expectedHeadline,
      extraSiblingHeadline,
    ]);
    const headerPath = fromJS(['%u', '%t', 'test']);

    expect(headerWithPath(headers, headerPath).toJS()).toStrictEqual(expectedHeadline);
  });
});
