import { toJS, List } from 'immutable';
import { parseTodoKeywordConfig } from './parse_org.js';

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
