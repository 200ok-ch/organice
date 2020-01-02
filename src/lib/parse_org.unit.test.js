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
      test('no parentheses', () => {
        const line = `${t}: START INPROGRESS STALLED | FINISHED`;
        const result = parseTodoKeywordConfig(line);
        expect(result.toJS()).toEqual({
          completedKeywords: ['FINISHED'],
          configLine: line,
          default: false,
          keywords: ['START', 'INPROGRESS', 'STALLED', 'FINISHED'],
        });
      });
    });
  });
});
