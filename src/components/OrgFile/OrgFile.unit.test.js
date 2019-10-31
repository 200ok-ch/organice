import { parseOrg, _parsePlanningItems } from '../../lib/parse_org';
import exportOrg from '../../lib/export_org';
import readFixture from '../../../test_helpers/index';

/**
 * This is a convenience wrapper around paring an org file using
 * `parseOrg` and then export it using `exportOrg`.
 * @param {String} testOrgFile - contents of an org file
 */
function parseAndExportOrgFile(testOrgFile) {
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const todoKeywordSets = parsedFile.get('todoKeywordSets');
  const fileConfigLines = parsedFile.get('fileConfigLines');
  const linesBeforeHeadings = parsedFile.get('linesBeforeHeadings');
  const exportedFile = exportOrg(headers, todoKeywordSets,fileConfigLines,linesBeforeHeadings);
  return exportedFile;
}

describe('Unit Tests for org file', () => {
  describe('Parsing', () => {
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
            const parsedFile = _parsePlanningItems(
              `SCHEDULED: <2019-07-30 Tue>\n${testDescription}`
            );
            expect(parsedFile.strippedDescription).toEqual(testDescription);
          });
        });

        describe('Planning items are formatted as is default Emacs', () => {
          test('For basic files', () => {
            const testOrgFile = readFixture('schedule');
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            // The call to `trimRight` is a work-around, because organice
            // doesn't export files with a trailing newline at this
            // moment. This is best-practice for any text-file and Emacs
            // does it for org-files, too. However, this is to be fixed
            // at another time. And when it is, this expectation will
            // fail and the call to `trimRight` can be safely removed.
            expect(exportedFile).toEqual(testOrgFile.trimRight());
          });

          test('For files with multiple planning items', () => {
            const testOrgFile = readFixture('schedule_and_deadline');
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            expect(exportedFile).toEqual(testOrgFile.trimRight());
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
  });
});
