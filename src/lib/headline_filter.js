// Matcher

import { fromJS } from 'immutable';
import { attributedStringToRawText } from './export_org.js';
import { computeAllPropertyNames, computeAllPropertyValuesFor } from './org_utils';

export const isMatch = filterExpr => header => {
  const headLine = header.get('titleLine');
  const tags = headLine.get('tags');
  const todoKeyword = headLine.get('todoKeyword');
  const rawTitle = headLine.get('rawTitle');
  const headlineText = todoKeyword ? `${todoKeyword} ${rawTitle}` : rawTitle;
  const properties = header
    .get('propertyListItems')
    .map(p => [p.get('property'), attributedStringToRawText(p.get('value'))]);

  const filterFilter = (type, exclude) => x => x.type === type && x.exclude === exclude;
  const words = x => x.words;

  const filterTags = filterExpr.filter(filterFilter('tag', false)).map(words);
  const filterCS = filterExpr.filter(filterFilter('case-sensitive', false)).map(words);
  const filterIC = filterExpr.filter(filterFilter('ignore-case', false)).map(words);
  const filterProps = filterExpr
    .filter(filterFilter('property', false))
    .map(x => [x.property, x.words]);

  const filterTagsExcl = filterExpr.filter(filterFilter('tag', true)).map(words);
  const filterCSExcl = filterExpr.filter(filterFilter('case-sensitive', true)).map(words);
  const filterICExcl = filterExpr.filter(filterFilter('ignore-case', true)).map(words);
  const filterPropsExcl = filterExpr
    .filter(filterFilter('property', true))
    .map(x => [x.property, x.words]);

  const orChain = source => xs => xs.some(x => source.includes(x));
  const propertyFilter = ([x, ys]) =>
    !properties
      .filter(([key, val]) => {
        // Property names (keys) are case-insensitive
        // https://orgmode.org/manual/Property-Syntax.html
        const nameMatch = key.toLowerCase() === x.toLowerCase();
        const valueMatch = ys.some(y => val.includes(y));
        return nameMatch && valueMatch;
      })
      .isEmpty();
  return (
    filterTags.every(orChain(tags)) &&
    filterCS.every(orChain(headlineText)) &&
    filterIC.every(orChain(headlineText.toLowerCase())) &&
    filterProps.every(propertyFilter) &&
    !filterTagsExcl.some(orChain(tags)) &&
    !filterCSExcl.some(orChain(headlineText)) &&
    !filterICExcl.some(orChain(headlineText.toLowerCase())) &&
    !filterPropsExcl.some(propertyFilter)
  );
};

// Suggestions / Completions

// The computation of completions rely on the fact, that the filter syntax does NOT
// support quoted strings (i.e. no search for a quoted 'master headline').

// This function is complex and still not perfect. It resembles parts of the
// filter syntax parser. If the parser would annotate all parsed symbols with
// offsets information, computeLogicalPosition could simplify the algorithm as
// long as the filter string is parsed successfully.

export const computeCompletions = (todoKeywords, tagNames, allProperties) => (
  filterExpr,
  filterString,
  curserPosition
) => {
  const tagAndPropNames = [].concat(
    tagNames,
    computeAllPropertyNames(fromJS(allProperties))
      .toJS()
      .map(x => x + ':')
  );

  const logicalCursorPosition = filterExpr
    ? computeLogicalPosition(filterExpr, filterString, curserPosition)
    : null;

  const charBeforeCursor = filterString.charAt(curserPosition - 1);
  const charTwoBeforeCursor = curserPosition > 1 ? filterString.charAt(curserPosition - 2) : '';

  if (logicalCursorPosition === null) {
  } else if (logicalCursorPosition === SPACE_SURROUNDED) {
    return todoKeywords;
  } else if (logicalCursorPosition.type === 'case-sensitive') {
    if (charBeforeCursor.match(/[A-Z]/)) {
      const textBeforeCursor = charBeforeCursor;
      const filteredTodoKeywords = todoKeywords
        .filter(x => x.startsWith(textBeforeCursor))
        .map(x => x.substring(textBeforeCursor.length));
      if ([' ', '', '|', '-'].includes(charTwoBeforeCursor)) {
        return filteredTodoKeywords;
      }
    }
  } else if (logicalCursorPosition.type === 'ignore-case') {
    // A text filter starting with '-' turns into an exclude filter as soon as text is appended
    if (charBeforeCursor === '-' && [' ', ''].includes(charTwoBeforeCursor)) return todoKeywords;
    return [];
  } else if (logicalCursorPosition.type === 'tag') {
    // This case will likely not occur because ':' alone cannot be parsed
    if (charBeforeCursor === ':') return tagAndPropNames;
  } else if (logicalCursorPosition.type === 'property') {
    if (charBeforeCursor === ':') {
      if (charTwoBeforeCursor === ' ' || charTwoBeforeCursor === '') return tagAndPropNames;
      else {
        // Either property name or text filter
        const indexOfOtherColon = filterString.substring(0, curserPosition - 1).lastIndexOf(':');
        const maybePropertyName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
        const onlyFirstPartOfValue = x => {
          const match = x.match(/^[^ ]*/);
          return match ? [match[0]] : [];
        };
        if (indexOfOtherColon >= 0 && maybePropertyName.match(/^[^ ]+$/)) {
          // No space in property name -> is property -> return values for that property
          return computeAllPropertyValuesFor(fromJS(allProperties), maybePropertyName)
            .flatMap(onlyFirstPartOfValue)
            .toJS();
        }
      }
    }
  }

  // If ':' or '|' is before cursor, the filter string is likely not
  // successfully parsed and therefore cannot be handled above.
  if (charBeforeCursor === ':') {
    if ([' ', '', '-'].includes(charTwoBeforeCursor)) {
      return tagAndPropNames;
    }
  } else if (charBeforeCursor === '|') {
    const indexOfOtherColon = filterString.substring(0, curserPosition).lastIndexOf(':');
    const maybeTagName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
    if (indexOfOtherColon > -1 && !maybeTagName.match(/ /)) {
      // No space characters between ':' and '|'  ->  '|' is in a tag filter
      return tagNames;
    } else {
      return todoKeywords;
    }
  }

  return [];
};

export const computeCompletionsForDatalist = (todoKeywords, tagNames, allProperties) => (
  filterExpr,
  filterString,
  curserPosition
) => {
  const completions = computeCompletions(todoKeywords, tagNames, allProperties)(
    filterExpr,
    filterString,
    curserPosition
  );
  return completions.map(
    x => filterString.substring(0, curserPosition) + x + filterString.substring(curserPosition)
  );
};

const SPACE_SURROUNDED = ' ';

// Compute the logical curser position within the parsed filter expression.
// Return SPACE_SURROUNDED if the curser is inbetween two expressions and
// surrounded by spaces (begin and end of line count as space).
// Return the the filter term if the curser is in or at the edge of an filter term.
const computeLogicalPosition = (filterExpr, filterString, curserPosition) => {
  if (filterExpr.length === 0) return SPACE_SURROUNDED;
  const tup = (x, y) => ({ value: x, elem: y });
  const firstElem = { offset: -1, endOffset: -1 };
  const { value } = filterExpr.reduce(
    ({ value, elem }, next) => {
      if (elem === null) {
        return tup(value, null); // short-circuit if already found
      }
      if (curserPosition >= next.offset && curserPosition <= next.endOffset) {
        return tup(next, null);
      }
      if (curserPosition > elem.endOffset && curserPosition < next.offset) {
        return tup(SPACE_SURROUNDED, null);
      }
      return tup(null, next);
    },
    { value: null, elem: firstElem }
  );
  if (curserPosition > filterExpr[filterExpr.length - 1].endOffset) return SPACE_SURROUNDED;
  return value;
};
