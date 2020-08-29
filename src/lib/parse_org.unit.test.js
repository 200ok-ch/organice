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
  test('Parses notes when not followed by logbook but an empty line', () => {
    const result = _parseLogNotes('- a note\n  two lines\n\nrest');
    expect(result.rawLogNotes).toEqual('- a note\n  two lines');
    expect(result.strippedDescription).toEqual('\nrest');
  });
  test('Parses notes when not followed by anything', () => {
    const result = _parseLogNotes('- a note\n  two lines\n- another\n');
    expect(result.rawLogNotes).toEqual('- a note\n  two lines\n- another');
    expect(result.strippedDescription).toEqual('');
  });
});

describe('Parse raw text', () => {
  test('Parses empty string', () => {
    expect(parseRawText('').toJS()).toEqual([]);
  });
  test('Parses simple line', () => {
    expect(parseRawText('test').toJS()).toEqual([{ type: 'text', contents: 'test' }]);
  });
});

describe('Parsing and exporting should not alter the original file', () => {
  describe('Planning items', () => {
    describe('Formatting is the same as in Emacs', () => {
      describe('List formatting', () => {
        test('Planning items should contain active timestamps from title and description as well', () => {
          const testOrgFile = readFixture('schedule_and_timestamps');
          const parsedFile = parseOrg(testOrgFile);
          const headers = parsedFile.get('headers').toJS();
          expect(headers.length).toEqual(1);
          const header = headers[0];
          expect(header.planningItems.length).toEqual(3);
        });
      });
    });
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
