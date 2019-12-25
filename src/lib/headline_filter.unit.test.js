import { parseOrg } from './parse_org';
import readFixture from '../../test_helpers/index';
import { isMatch, computeCompletions } from './headline_filter';

// Helper functions
// Generate tag filter
const gtag = tag => ([{type: 'tag', words: [tag]}]);
const gtags = tags => tags.map(x => ({type: 'tag', words: [x]}));
const gtagsOr = tagsArr => tagsArr.map(x => ({type: 'tag', words: x}));
// Generate case-sensitive filter
const gcs = word => ([{type: 'case-sensitive', words: [word]}]);
const gcss = words => words.map(x => ({type: 'case-sensitive', words: [x]}));
const gcssOr = wordsArr => wordsArr.map(x => ({type: 'case-sensitive', words: x}));
// Generate ignore-case filter
const gic = word => ([{type: 'ignore-case', words: [word]}]);
const gics = words => words.map(x => ({type: 'ignore-case', words: [x]}));
const gicsOr = wordsArr => wordsArr.map(x => ({type: 'ignore-case', words: x}));
// Generate property filter
const gprop = (key, word) => ([{type: 'property', property: key, words: [word]}]);
const gprops = props => props.map(([x, y]) => ({type: 'property', property: x, words: [y]}));
const gpropsOr = props => props.map(([x, ys]) => ({type: 'property', property: x, words: ys}));

describe('Match function for headline filter', () => {
  const testOrgFile = readFixture('headline_filter');
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const header = headers.get(0);

  describe('Tests for tag matching', () => {
    test('Matches if no filter is given', () => {
      const filterExpr = [];
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Matches single tag', () => {
      const filterExpr = gtag('spec_tag');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not matches wrong tag', () => {
      const filterExpr = gtag('non-existing-tag');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Only matches exact tag names', () => {
      const filterExpr = gtag('spec_');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Only matches if all tags are matched (AND)', () => {
      const filterExpr = gtags(['tag2', 'spec_tag']);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match tag1 OR tag2', () => {
      const filterExpr = gtagsOr([['nonexisting', 'spec_tag']]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match (tag1 OR tag2) AND (tag3 OR tag4)', () => {
      const filterExpr = gtagsOr([['nonexisting', 'spec_tag'], ['tag2', 'nonexisting2']]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
  });

  describe('Tests for case-sensitive matching in headline text', () => {
    test('Match TODO', () => {
      const filterExpr = gcs('TODO');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match for substring of TODO', () => {
      const filterExpr = gcs('TOD');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('No match for wrongly spelled TODO', () => {
      const filterExpr = gcs('TIDI');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Match for two substrings with AND', () => {
      const filterExpr = gcss(['TODO', 'Spec']);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match for two substrings with AND, one with OR', () => {
      const filterExpr = gcssOr([['TODO', 'FIXME'], ['Spec']]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match (misspelled) for two substrings with AND, one with OR', () => {
      const filterExpr = gcssOr([['TIDI', 'FIXME'], ['Spec']]);
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
  });

  describe('Tests for ignore-case matching in headline text', () => {
    test('Match a word', () => {
      const filterExpr = gic('spec');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match a word', () => {
      const filterExpr = gic('xyz');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
  });

  describe('Tests for property matching', () => {
    test('Match property with value', () => {
      const filterExpr = gprop('prop1', 'abc');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match property with value (name/key matches case-insensitive)', () => {
      const filterExpr = gprop('PROP1', 'abc');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match property with part of value', () => {
      const filterExpr = gprop('prop1', 'b');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match property with wrong value', () => {
      const filterExpr = gprop('prop1', 'aaa');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Match two properties (AND)', () => {
      const filterExpr = gprops([['prop1', 'abc'], ['prop2', 'xyz']]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match two properties but one is wrong', () => {
      const filterExpr = gprops([['prop1', 'abc'], ['prop2', 'xxx']]);
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Match two times the same property with different values (see example org)', () => {
      const filterExpr = gprops([['prop1', 'abc'], ['prop1', 'def']]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match property with no value', () => {
      const filterExpr = gprop('prop3', '');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match property with no value', () => {
      const filterExpr = gprop('prop3', 'xxx');
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Match property without providing a value', () => {
      const filterExpr = gprop('prop1', '');
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match property with either value (OR)', () => {
      const filterExpr = gpropsOr([['prop1', ['aaa', 'abc']]]);
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
  });

  describe('Tests for combined matching', () => {
    test('Match tag and TODO', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'));
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Not match misspelled tag and correct TODO', () => {
      const filterExpr = gtag('spec_').concat(gcs('TODO'));
      expect(isMatch(filterExpr)(header)).toBe(false);
    });
    test('Match tag, TODO, and ignore-case', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'), gic('spec'));
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
    test('Match tag, TODO, ignore-case, and property', () => {
      const filterExpr = gtag('spec_tag').concat(gcs('TODO'), gic('spec'), gprop('prop1', 'def'));
      expect(isMatch(filterExpr)(header)).toBe(true);
    });
  });
});

describe('Computation of completions / suggestions', () => {

  const todoKeywords = ['TODO', 'DONE'];
  const tagNames = ['t1', 't2'];
  const allProperties = [['prop1', 'val1'], ['prop1', 'val2'], ['prop3', 'val3']];
  const tagAndPropNames = [].concat(tagNames, allProperties.map(([x]) => x));
  const propValsForProp1 = allProperties.filter(([x]) => x === 'prop1').map(([_, y]) => y);

  // Function under test:
  const compute = computeCompletions(todoKeywords, tagNames, allProperties);

  // Helper:
  const expectComputation = (filterString, curserPosition) => expect(compute(filterString, curserPosition));

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
    test('Suggests keywords after | when it is a text filter', () => {
      expectComputation(' a| ', 3).toEqual(todoKeywords);
    });
  });

  describe('Completions for TODO keywords after [A-Z] at \\b', () => {
  });

  describe('Completions for TODO keywords after [A-Z] at | in text filter', () => {
  });

  describe('Completions for property/tag names after :', () => {
    test('Completions after : #1', () => {
      expectComputation(':', 1).toEqual(tagAndPropNames);
    });
    test('Completions after : #2', () => {
      expectComputation(' : ', 2).toEqual(tagAndPropNames);
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
