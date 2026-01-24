/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectNewSetFromLine", "expectType"] }] */

import {
  parseOrg,
  parseTodoKeywordConfig,
  parseRawText,
  _parsePlanningItems,
  _parseLogNotes,
  parseMarkupAndCookies,
} from './parse_org';
import readFixture from '../../test_helpers/index';

describe('Test the parser', () => {
  const expectType = (result) => expect(result.map((x) => x.type));
  describe('Parsing inline-markup', () => {
    test('Parses inline-markup where closing delim is followed by ;', () => {
      const result = parseMarkupAndCookies('*bold*;');
      expectType(result).toEqual(['inline-markup', 'text']);
    });
    test('Parses inline-markup surrounded by text', () => {
      const result = parseMarkupAndCookies(' *bold*;');
      expectType(result).toEqual(['text', 'inline-markup', 'text']);
    });
    test('Slashes between words do not imply italic text', () => {
      const result = parseMarkupAndCookies('Foo/Bar/Baz');
      expect(result).toEqual([{ contents: 'Foo/Bar/Baz', type: 'text' }]);
    });
  });

  describe('Parse an header with empty description', () => {
    const parseFirstHeaderFromOrg = (x) => parseOrg(x).toJS().headers[0];
    test('Parse headline without trailing newline', () => {
      const result = parseFirstHeaderFromOrg('* headline');
      expect(result.description).toEqual([]);
      expect(result.rawDescription).toEqual('');
    });
    test('Parse headline with trailing newline but no description', () => {
      const result = parseFirstHeaderFromOrg('* headline\n');
      expect(result.description).toEqual([]);
      expect(result.rawDescription).toEqual('');
    });
    test('Parse headline with an empty line of description', () => {
      const result = parseFirstHeaderFromOrg('* headline\n\n');
      expect(result.description.length).toEqual(1);
      expect(result.rawDescription).toEqual('\n');
    });
    test('Parse headline directly followed by next headline', () => {
      const result = parseFirstHeaderFromOrg('* headline\n* headline 2');
      expect(result.description).toEqual([]);
      expect(result.rawDescription).toEqual('');
    });
  });
});

describe('Test parsing of log notes', () => {
  test('Parses notes when followed by logbook', () => {
    const result = _parseLogNotes('- a note\n  two lines\n:LOGBOOK:\n...');
    expect(result.rawLogNotes).toEqual('- a note\n  two lines');
    expect(result.strippedDescription).toEqual(':LOGBOOK:\n...');
  });
  test('Does not parse notes when no logbook exists (they will go into description)', () => {
    const text = '- a note\n  two lines\n\nrest';
    const result = _parseLogNotes(text);
    expect(result.rawLogNotes).toEqual('');
    expect(result.strippedDescription).toEqual(text);
  });
});

describe('Parse raw text', () => {
  test('Parses empty string', () => {
    expect(parseRawText('').toJS()).toEqual([]);
  });
  test('Parses simple line', () => {
    expect(parseRawText('test').toJS()).toEqual([{ type: 'text', contents: 'test' }]);
  });
  describe('Parse various timestamps', () => {
    function testTimestamp(actual, expected) {
      if (expected == null) expect(actual).toBeNull();
      else {
        // Every key in expected should be present in actual and the values should match
        Object.keys(expected).forEach((key) => expect(actual[key]).toEqual(expected[key]));
        // Keys in actual that are not in expected must map to undefined
        Object.keys(actual).forEach(
          (key) =>
            Object.prototype.hasOwnProperty.call(expected, key) ||
            expect(actual[key]).toBeUndefined()
        );
      }
    }
    function testTimestampText(text, expectedFirstTimestamp, expectedSecondTimestamp) {
      // eslint-disable-next-line jest/expect-expect
      test(`Parse ${text}`, () => {
        const [{ firstTimestamp, secondTimestamp }] = parseRawText(text).toJS();
        testTimestamp(firstTimestamp, expectedFirstTimestamp);
        testTimestamp(secondTimestamp, expectedSecondTimestamp);
      });
    }
    testTimestampText('<2021-05-16>', { isActive: true, year: '2021', month: '05', day: '16' });
    testTimestampText('[2021-05-16]', { isActive: false, year: '2021', month: '05', day: '16' });
    testTimestampText('<2021-05-16 Sun>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
    });
    testTimestampText('<2021-05-16 Sun 12:45>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      startHour: '12',
      startMinute: '45',
    });
    testTimestampText('<2021-05-16 Sun 12:45-13:15>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      startHour: '12',
      startMinute: '45',
      endHour: '13',
      endMinute: '15',
    });
    testTimestampText('<2021-05-16 Sun +1w>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      repeaterType: '+',
      repeaterValue: '1',
      repeaterUnit: 'w',
    });
    testTimestampText('<2021-05-16 Sun .+1w>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      repeaterType: '.+',
      repeaterValue: '1',
      repeaterUnit: 'w',
    });
    testTimestampText('<2021-05-16 Sun .+2d/4d>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      repeaterType: '.+',
      repeaterValue: '2',
      repeaterUnit: 'd',
      repeaterDeadlineValue: '4',
      repeaterDeadlineUnit: 'd',
    });
    testTimestampText('<2021-05-16 Sun .+1w -2d>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      repeaterType: '.+',
      repeaterValue: '1',
      repeaterUnit: 'w',
      delayType: '-',
      delayValue: '2',
      delayUnit: 'd',
    });
    testTimestampText('<2021-05-16 Sun -2d .+1w>', {
      isActive: true,
      year: '2021',
      month: '05',
      day: '16',
      dayName: 'Sun',
      repeaterType: '.+',
      repeaterValue: '1',
      repeaterUnit: 'w',
      delayType: '-',
      delayValue: '2',
      delayUnit: 'd',
    });
    testTimestampText(
      '<2021-05-16>--<2021-05-23>',
      { isActive: true, year: '2021', month: '05', day: '16' },
      { isActive: true, year: '2021', month: '05', day: '23' }
    );
  });
});

describe('Parse headline with planning items and active timestamps', () => {
  test('Planning items should contain active timestamps from title and description as well', () => {
    const testOrgFile = readFixture('schedule_and_timestamps');
    const parsedFile = parseOrg(testOrgFile);
    const headers = parsedFile.get('headers').toJS();
    const header = headers[0];
    expect(header.planningItems.length).toEqual(3);
  });
});

describe('Parse in-buffer TODO keyword settings', () => {
  test('Normal headline', () => {
    const result = parseTodoKeywordConfig('*** foo');
    expect(result).toBeNull();
  });

  test('Normal text line', () => {
    const result = parseTodoKeywordConfig('foo');
    expect(result).toBeNull();
  });

  test('Other in-buffer setting', () => {
    const result = parseTodoKeywordConfig('#+STARTUP: nologrepeat');
    expect(result).toBeNull();
  });

  ['#+TODO', '#+TYP_TODO'].forEach((t) => {
    describe(t, () => {
      const expectNewSetFromLine = (line) => {
        const result = parseTodoKeywordConfig(line);
        const expectedNewSet = {
          completedKeywords: ['FINISHED'],
          configLine: line,
          default: false,
          keywords: ['START', 'INPROGRESS', 'STALLED', 'FINISHED'],
        };
        expect(result.toJS()).toEqual(expectedNewSet);
      };

      test('no parentheses', () => {
        const line = `${t}: START INPROGRESS STALLED | FINISHED`;
        expectNewSetFromLine(line);
      });

      test('some (x) keyboard shortcuts', () => {
        const line = `${t}: START INPROGRESS(i) STALLED(.) | FINISHED(f)`;
        expectNewSetFromLine(line);
      });

      test('recording timestamp / note on entry', () => {
        const line = `${t}: START INPROGRESS(!) STALLED | FINISHED(@)`;
        expectNewSetFromLine(line);
      });

      test('shortcut plus recording timestamp / note on entry', () => {
        const line = `${t}: START(s) INPROGRESS(i!) STALLED(.) | FINISHED(f@)`;
        expectNewSetFromLine(line);
      });

      test('recording timestamp / note on exit', () => {
        const line = `${t}: START(s) INPROGRESS(/!) STALLED | FINISHED(/@)`;
        expectNewSetFromLine(line);
      });

      test('shortcut plus recording timestamp / note on exit', () => {
        const line = `${t}: START(s) INPROGRESS(i/!) STALLED(.) | FINISHED(f/@)`;
        expectNewSetFromLine(line);
      });

      test('recording timestamp / note on entry and exit', () => {
        const line = `${t}: START(s) INPROGRESS(/!) STALLED | FINISHED(/@)`;
        expectNewSetFromLine(line);
      });

      test('shortcut plus recording timestamp / note on entry and exit', () => {
        const line = `${t}: START(s@/@) INPROGRESS(i!/!) STALLED(.@/!) | FINISHED(f!/@)`;
        expectNewSetFromLine(line);
      });
    });
  });

  test('TODO keywords at EOF parsed correctly', () => {
    const testOrgFile = readFixture('todo_keywords_interspersed');
    const parsedFile = parseOrg(testOrgFile);
    const headers = parsedFile.get('headers').toJS();
    expect(headers.length).toEqual(15);
    expect(headers[7].titleLine.rawTitle).toEqual('orgmode settings in middle of file');
    expect(headers[14].titleLine.rawTitle).toEqual('orgmode settings at end of file');
    const todoKeywordSets = parsedFile.get('todoKeywordSets').toJS();
    expect(todoKeywordSets.length).toEqual(3);
    expect(todoKeywordSets[0].keywords).toEqual(['NEXT', 'DONE']);
    expect(todoKeywordSets[0].completedKeywords).toEqual(['DONE']);
    expect(todoKeywordSets[1].keywords).toEqual(['START', 'FINISHED']);
    expect(todoKeywordSets[1].completedKeywords).toEqual(['FINISHED']);
    expect(todoKeywordSets[2].keywords).toEqual(['PROJECT', 'PROJDONE']);
    expect(todoKeywordSets[2].completedKeywords).toEqual(['PROJDONE']);
  });
});
