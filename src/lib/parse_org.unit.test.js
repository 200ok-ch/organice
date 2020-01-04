import { toJS, List } from 'immutable';

import {
  parseOrg,
  parseTodoKeywordConfig,
  _parsePlanningItems,
  parseMarkupAndCookies,
} from './parse_org';
import exportOrg from './export_org';
import readFixture from '../../test_helpers/index';

/**
 * This is a convenience wrapper around parsing an org file using
 * `parseOrg` and then export it using `exportOrg`.
 * @param {String} testOrgFile - contents of an org file
 */
function parseAndExportOrgFile(testOrgFile) {
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const todoKeywordSets = parsedFile.get('todoKeywordSets');
  const fileConfigLines = parsedFile.get('fileConfigLines');
  const linesBeforeHeadings = parsedFile.get('linesBeforeHeadings');
  const exportedFile = exportOrg(headers, todoKeywordSets, fileConfigLines, linesBeforeHeadings);
  return exportedFile;
}

describe('Test the parser', () => {
  const expectType = result => expect(result.map(x => x.type));
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
});

describe('Parsing and exporting should not alter the original file', () => {
  test("Parsing and exporting shouldn't alter the original file", () => {
    const testOrgFile = readFixture('indented_list');
    const exportedFile = parseAndExportOrgFile(testOrgFile);

    // Should have the same amount of lines. Safeguard for the next
    // expectation.
    const exportedFileLines = exportedFile.split('\n');
    const testOrgFileLines = testOrgFile.split('\n');
    expect(exportedFileLines.length).toEqual(testOrgFileLines.length);

    exportedFileLines.forEach((line, index) => {
      expect(line).toEqual(testOrgFileLines[index]);
    });
  });

  test('Parses and exports a file which contains all features of organice', () => {
    const testOrgFile = readFixture('all_the_features');
    const exportedFile = parseAndExportOrgFile(testOrgFile);
    expect(exportedFile).toEqual(testOrgFile);
  });

  describe('Boldness', () => {
    test('Parsing lines with bold text', () => {
      const testOrgFile = readFixture('bold_text');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
  });

  describe('Parsing inline-markup', () => {
    test('Parses inline-markup where closing delim is followed by ;', () => {
      const result = parseMarkupAndCookies('*bold*;');
      expect(result.length).toEqual(2);
    });
  });

  describe('HTTP URLs', () => {
    test('Parse a line containing an URL but no /italic/ text before the URL', () => {
      const testOrgFile = readFixture('url');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
  });

  describe('www URLs', () => {
    const testOrgFile = readFixture('www_url');
    test('Parse a line containing an URL starting with www', () => {
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
    test('Parses all valid URLs starting with www', () => {
      const parsedFile = parseOrg(testOrgFile);
      const firstHeader = parsedFile.get('headers').first();
      const parsedUrls = firstHeader.get('description').filter(x => x.get('type') === 'www-url');
      expect(parsedUrls.size).toEqual(2);
    });
  });

  describe('E-mail address', () => {
    test('Parse a line containing an e-mail address', () => {
      const testOrgFile = readFixture('email');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
  });

  describe('Phone number in canonical format (+xxxxxx)', () => {
    test('Parse a line containing a phone number but no +striked+ text after the number', () => {
      const testOrgFile = readFixture('phonenumber');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
  });

  describe('Newlines', () => {
    test('Newlines in between headers and items are preserved', () => {
      const testOrgFile = readFixture('newlines');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
    });
  });

  test('Config and content lines before first heading line are kept', () => {
    const testOrgFile = readFixture('before-first-headline');
    const exportedFile = parseAndExportOrgFile(testOrgFile);
    expect(exportedFile).toEqual(testOrgFile);
  });

  describe('Planning items', () => {
    describe('Formatting is the same as in Emacs', () => {
      describe('List formatting', () => {
        test('Parsing a basic list should not mangle the list', () => {
          const testDescription = '  - indented list\n     - Foo';
          const parsedFile = _parsePlanningItems(testDescription);
          expect(parsedFile.strippedDescription).toEqual(testDescription);
        });

        test('Parsing a list with planning items should not mangle the list', () => {
          const testDescription = '  - indented list\n     - Foo';
          const parsedFile = _parsePlanningItems(`SCHEDULED: <2019-07-30 Tue>\n${testDescription}`);
          expect(parsedFile.strippedDescription).toEqual(testDescription);
        });
      });

      describe('Planning items are formatted as is default Emacs', () => {
        test('For basic files', () => {
          const testOrgFile = readFixture('schedule');
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile);
        });

        test('For files with multiple planning items', () => {
          const testOrgFile = readFixture('schedule_and_deadline');
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile);
        });
      });

      test('Properties are formatted as is default in Emacs', () => {
        const testOrgFile = readFixture('properties');
        const exportedFile = parseAndExportOrgFile(testOrgFile);
        expect(exportedFile).toEqual(testOrgFile);
      });

      test('Tags are formatted as is default in Emacs', () => {
        const testOrgFile = readFixture('tags');
        const exportedFile = parseAndExportOrgFile(testOrgFile);
        expect(exportedFile).toEqual(testOrgFile);
      });
    });
  });
  describe('Logbook entries', () => {
    test('Logbook entries are formatted as is default in Emacs', () => {
      const testOrgFile = readFixture('logbook');
      const exportedFile = parseAndExportOrgFile(testOrgFile);
      expect(exportedFile).toEqual(testOrgFile);
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

  ['#+TODO', '#+TYP_TODO'].forEach(t => {
    describe(t, () => {
      const expectNewSetFromLine = line => {
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
});
