/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectComputation", "expectMatch"] }] */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^gics(Or)?$" }] */

import { parseOrg } from './parse_org';
import readFixture from '../../test_helpers/index';
import { isMatch, computeCompletions, computeCompletionsForDatalist } from './headline_filter';
import headline_filter_parser from './headline_filter_parser';

// Helper functions
// Generate tag filter
const gtag = (tag) => [{ type: 'tag', words: [tag], exclude: false }];
const gtags = (tags) => tags.map((x) => ({ type: 'tag', words: [x], exclude: false }));
const gtagsOr = (tagsArr) => tagsArr.map((x) => ({ type: 'tag', words: x, exclude: false }));
// Generate case-sensitive filter
const gcs = (word) => [{ type: 'case-sensitive', words: [word], exclude: false }];
const gcss = (words) => words.map((x) => ({ type: 'case-sensitive', words: [x], exclude: false }));
const gcssOr = (wordsArr) =>
  wordsArr.map((x) => ({ type: 'case-sensitive', words: x, exclude: false }));
// Generate ignore-case filter
const gic = (word) => [{ type: 'ignore-case', words: [word], exclude: false }];
const gics = (words) => words.map((x) => ({ type: 'ignore-case', words: [x], exclude: false }));
const gicsOr = (wordsArr) =>
  wordsArr.map((x) => ({ type: 'ignore-case', words: x, exclude: false }));
// Generate property filter
const gprop = (key, word) => [{ type: 'property', property: key, words: [word], exclude: false }];
const gprops = (props) =>
  props.map(([x, y]) => ({ type: 'property', property: x, words: [y], exclude: false }));
const gpropsOr = (props) =>
  props.map(([x, ys]) => ({ type: 'property', property: x, words: ys, exclude: false }));

describe('Match function for headline filter', () => {
  const testOrgFile = readFixture('headline_filter');
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const header = headers.get(0);

  const expectMatch = (filterExpr) => expect(isMatch(filterExpr)(header));

  describe('Tests for tag matching', () => {
    test('Matches if no filter is given', () => {
      const filterExpr = [];
      expectMatch(filterExpr).toBe(true);
    });
    test('Matches single tag', () => {
      const filterExpr = gtag('spec_tag');
      expectMatch(filterExpr).toBe(true);
    });
    test('Not matches wrong tag', () => {
      const filterExpr = gtag('non-existing-tag');
      expectMatch(filterExpr).toBe(false);
    });
    test('Only matches exact tag names', () => {
      const filterExpr = gtag('spec_');
      expectMatch(filterExpr).toBe(false);
    });
    test('Only matches if all tags are matched (AND)', () => {
      const filterExpr = gtags(['tag2', 'spec_tag']);
      expectMatch(filterExpr).toBe(true);
    });
    test('Match tag1 OR tag2', () => {
      const filterExpr = gtagsOr([['nonexisting', 'spec_tag']]);
      expectMatch(filterExpr).toBe(true);
    });
    test('Match (tag1 OR tag2) AND (tag3 OR tag4)', () => {
      const filterExpr = gtagsOr([
        ['nonexisting', 'spec_tag'],
        ['tag2', 'nonexisting2'],
      ]);
      expectMatch(filterExpr).toBe(true);
    });
    test('Matching tag with #', () => {
      const filterExpr = gtag('#technology');
      expectMatch(filterExpr).toBe(true);
    });
  });

  describe('Tests for case-sensitive matching in headline text', () => {
    test('Match TODO', () => {
      const filterExpr = gcs('TODO');
      expectMatch(filterExpr).toBe(true);
    });
    test('Match for substring of TODO', () => {
      const filterExpr = gcs('TOD');
      expectMatch(filterExpr).toBe(true);
    });
    test('No match for wrongly spelled TODO', () => {
      const filterExpr = gcs('TIDI');
      expectMatch(filterExpr).toBe(false);
    });
    test('Match for two substrings with AND', () => {
      const filterExpr = gcss(['TODO', 'Spec']);
      expectMatch(filterExpr).toBe(true);
    });
    test('Match for two substrings with AND, one with OR', () => {
      const filterExpr = gcssOr([['TODO', 'FIXME'], ['Spec']]);
      expectMatch(filterExpr).toBe(true);
    });
    test('Not match (misspelled) for two substrings with AND, one with OR', () => {
      const filterExpr = gcssOr([['TIDI', 'FIXME'], ['Spec']]);
      expectMatch(filterExpr).toBe(false);
    });
  });

  describe('Tests for ignore-case matching in headline text', () => {
    test('Match a word', () => {
      const filterExpr = gic('spec');
      expectMatch(filterExpr).toBe(true);
    });
    test('Match a word with really ignore-case', () => {
      const filterExpr = gic('SPEC');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match a quoted string', () => {
      const filterExpr = gic('spec head');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match a word', () => {
      const filterExpr = gic('xyz');
      expectMatch(filterExpr).toBe(false);
    });
  });

  describe('Tests for property matching', () => {
    test('Match property with value', () => {
      const filterExpr = gprop('prop1', 'abc');
      expectMatch(filterExpr).toBe(true);
    });
    test('Match property with value (name/key matches case-insensitive)', () => {
      const filterExpr = gprop('PROP1', 'abc');
      expectMatch(filterExpr).toBe(true);
    });
    test('Match property with part of value', () => {
      const filterExpr = gprop('prop1', 'b');
      expectMatch(filterExpr).toBe(true);
    });
    test('Not match property with wrong value', () => {
      const filterExpr = gprop('prop1', 'aaa');
      expectMatch(filterExpr).toBe(false);
    });
    test('Match two properties (AND)', () => {
      const filterExpr = gprops([
        ['prop1', 'abc'],
        ['prop2', 'xyz'],
      ]);
      expectMatch(filterExpr).toBe(true);
    });
    test('Match two properties but one is wrong', () => {
      const filterExpr = gprops([
        ['prop1', 'abc'],
        ['prop2', 'xxx'],
      ]);
      expectMatch(filterExpr).toBe(false);
    });
    test('Match two times the same property with different values (see example org)', () => {
      const filterExpr = gprops([
        ['prop1', 'abc'],
        ['prop1', 'def'],
      ]);
      expectMatch(filterExpr).toBe(true);
    });
    test('Match property with no value', () => {
      const filterExpr = gprop('prop3', '');
      expectMatch(filterExpr).toBe(true);
    });
    test('Not match property with no value', () => {
      const filterExpr = gprop('prop3', 'xxx');
      expectMatch(filterExpr).toBe(false);
    });
    test('Match property without providing a value', () => {
      const filterExpr = gprop('prop1', '');
      expectMatch(filterExpr).toBe(true);
    });
    test('Match property with either value (OR)', () => {
      const filterExpr = gpropsOr([['prop1', ['aaa', 'abc']]]);
      expectMatch(filterExpr).toBe(true);
    });
  });

  describe('Tests for exclude matching', () => {
    const makeExclude = (xs) =>
      xs.map((x) => {
        x.exclude = true;
        return x;
      });
    test('Not match text when using exclude filter #1', () => {
      let filterExpr = gic('header');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(false);
    });
    test('Not match text when using exclude filter #2', () => {
      let filterExpr = gcs('Spec');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(false);
    });
    test('Not match tag when using exclude filter', () => {
      let filterExpr = gtag('tag2');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(false);
    });
    test('Not match property when using exclude filter', () => {
      let filterExpr = gprop('prop1', 'abc');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(false);
    });
    test('Match property when using exclude filter with non-matching value', () => {
      let filterExpr = gprop('prop1', 'xxxxx');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(true);
    });
    test('Not match property when using exclude filter on empty property', () => {
      let filterExpr = gprop('prop3', '');
      filterExpr = makeExclude(filterExpr);
      expectMatch(filterExpr).toBe(false);
    });
  });

  describe('Tests for combined matching', () => {
    test('Empty filter matches everything', () => {
      const filterExpr = [];
      expectMatch(filterExpr).toBe(true);
    });
    test('Match tag and TODO', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'));
      expectMatch(filterExpr).toBe(true);
    });
    test('Not match misspelled tag and correct TODO', () => {
      const filterExpr = gtag('spec_').concat(gcs('TODO'));
      expectMatch(filterExpr).toBe(false);
    });
    test('Match tag, TODO, and ignore-case', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'), gic('spec'));
      expectMatch(filterExpr).toBe(true);
    });
    test('Match tag, TODO, ignore-case, and property', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'), gic('spec'), gprop('prop1', 'def'));
      expectMatch(filterExpr).toBe(true);
    });
  });
});

describe('Computation of completions and suggestions for task filter', () => {
  const todoKeywords = ['TODO', 'DONE'];
  const tagNames = ['t1', 't2'];
  const allProperties = [
    ['prop1', 'val1'],
    ['prop1', 'val2'],
    ['prop3', 'val 3'],
  ];
  const tagAndPropNames = [].concat(tagNames, ['prop1:', 'prop3:']);
  const propValsForProp1 = ['val1', 'val2'];
  const propValsForProp3 = ['"val 3"'];

  describe('Computation of completions', () => {
    // Function under test:
    const compute = computeCompletions(todoKeywords, tagNames, allProperties);

    // Helper:
    const expectComputation = (filterString, curserPosition) => {
      let filterExpr;
      try {
        filterExpr = headline_filter_parser.parse(filterString);
      } catch {}
      return expect(compute(filterExpr, filterString, curserPosition));
    };

    describe('Completions for TODO keywords after space or at begin of line', () => {
      test('Suggests keywords at begin of empty line', () => {
        expectComputation('', 0).toEqual(todoKeywords);
      });
      test('Suggests keywords after space', () => {
        expectComputation(' ', 1).toEqual(todoKeywords);
      });
      test('Suggests keywords after | when it is a text filter', () => {
        expectComputation('a|', 2).toEqual(todoKeywords);
      });
      test('Suggests keywords after | when it is a text filter after space', () => {
        expectComputation(' a| ', 3).toEqual(todoKeywords);
      });
    });

    describe('Filtered completions for TODO keywords after [A-Z] in a text filter', () => {
      test('Completions after [A-Z] at begin of line', () => {
        expectComputation('T', 1).toEqual(['ODO']);
      });
      test('Completions after [A-Z] after space', () => {
        expectComputation(' T', 2).toEqual(['ODO']);
      });
      test('No completions after [A-Z] after space', () => {
        expectComputation(' X', 2).toEqual([]);
      });
      test('Completions after [A-Z] after |', () => {
        expectComputation('x|T', 3).toEqual(['ODO']);
      });
      test('No completions after [A-Z] after | in a tag filter', () => {
        expectComputation(':x|T', 4).toEqual([]);
      });
      test('No completions after [A-Z] after :', () => {
        expectComputation('x:T', 3).toEqual([]);
      });
      test('Completions after space after [A-Z] after space', () => {
        expectComputation(':a D ', 4).toEqual(['ONE']);
      });
      test('No completions after [A-Z]{2}', () => {
        expectComputation('TO ', 2).toEqual([]);
      });
      test('No completions after [A-Z]{2} after space', () => {
        expectComputation(' TO ', 3).toEqual([]);
      });
    });

    describe('Completions for property/tag names after :', () => {
      test('Completions after : #1', () => {
        expectComputation(':', 1).toEqual(tagAndPropNames);
      });
      test('Completions after : #2', () => {
        expectComputation(' : ', 2).toEqual(tagAndPropNames);
      });
      test('Completions after : #3', () => {
        expectComputation('a : ', 3).toEqual(tagAndPropNames);
      });
    });

    describe('No completions after : when within text filter', () => {
      test('No completion when : within text filter', () => {
        expectComputation(' a:', 3).toEqual([]);
      });
    });

    describe('Completions for property values after second :', () => {
      test('Completions for property value after : #1', () => {
        expectComputation(':prop1:', 7).toEqual(propValsForProp1);
      });
      test('Completions for property value after : #2', () => {
        expectComputation(' :prop1: ', 8).toEqual(propValsForProp1);
      });
      test('Completions for property value after : #3', () => {
        expectComputation('a :prop1: ', 9).toEqual(propValsForProp1);
      });
      test('Completions for property value must be the value part up to the first whitespace', () => {
        expectComputation(':prop3: ', 7).toEqual(propValsForProp3);
      });
    });

    describe('Completions for tag names after | in a tag filter', () => {
      test('Completions for tag after | in a tag filter #1', () => {
        expectComputation(':foo|', 5).toEqual(tagNames);
      });
      test('Completions for tag after | in a tag filter #2', () => {
        expectComputation(' :foo| ', 6).toEqual(tagNames);
      });
      test('Completions for tag after | in a tag filter #3', () => {
        expectComputation('a :foo| ', 7).toEqual(tagNames);
      });
    });

    describe('Completions for exclude filters with - in front', () => {
      test('Completions for tag after | in a tag filter', () => {
        expectComputation('-:foo|', 6).toEqual(tagNames);
      });
      test('Completions for tag : in a tag filter', () => {
        expectComputation('-:', 2).toEqual(tagAndPropNames);
      });
      test('Completions for TODO keywords #1', () => {
        expectComputation('-', 1).toEqual(todoKeywords);
      });
      test('Completions for TODO keywords #2', () => {
        expectComputation(' a -', 4).toEqual(todoKeywords);
      });
      test('No completions for TODO keywords after --', () => {
        expectComputation('--', 2).toEqual([]);
      });
    });

    describe('No completions when it makes no sense', () => {
      test('No completion when after lower-case text filter #1', () => {
        expectComputation('a', 1).toEqual([]);
      });
      test('No completion when after lower-case text filter #2', () => {
        expectComputation(' a', 2).toEqual([]);
      });
      test('No completion when in lower-case text filter', () => {
        expectComputation('hallo', 2).toEqual([]);
      });
      test('No completion when after tag filter', () => {
        expectComputation(':a', 2).toEqual([]);
      });
      test('No completion when after property filter', () => {
        expectComputation(':a:b', 4).toEqual([]);
      });
      test('No completion when in property filter', () => {
        expectComputation(':a:hallo', 5).toEqual([]);
      });
    });
  });

  describe('Computation of suggestions for datalist', () => {
    // Function under test:
    const compute = computeCompletionsForDatalist(todoKeywords, tagNames, allProperties);

    // Helper:
    const expectComputation = (filterString, curserPosition) => {
      let filterExpr;
      try {
        filterExpr = headline_filter_parser.parse(filterString);
      } catch {}
      return expect(compute(filterExpr, filterString, curserPosition));
    };

    test('Begin of empty line', () => {
      expectComputation('', 0).toEqual(todoKeywords);
    });
    test('After :', () => {
      expectComputation(': ', 1).toEqual(tagAndPropNames.map((x) => `:${x} `));
    });
    test('After space', () => {
      expectComputation('a ', 2).toEqual(todoKeywords.map((x) => `a ${x}`));
    });
    test('After | in a text filter', () => {
      expectComputation('a| b', 2).toEqual(todoKeywords.map((x) => `a|${x} b`));
    });
    test('After : in a tag filter', () => {
      expectComputation(':a| ', 3).toEqual(tagNames.map((x) => `:a|${x} `));
    });
  });
});
