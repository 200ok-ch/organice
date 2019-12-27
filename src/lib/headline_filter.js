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

  const filterTags = filterExpr.filter(x => x.type === 'tag').map(x => x.words);
  const filterCS = filterExpr.filter(x => x.type === 'case-sensitive').map(x => x.words);
  const filterIC = filterExpr.filter(x => x.type === 'ignore-case').map(x => x.words);
  const filterProps = filterExpr.filter(x => x.type === 'property').map(x => [x.property, x.words]);

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
    filterProps.every(propertyFilter)
  );
};

// Suggestions / Completions

// The computation of completions rely on the fact, that the filter syntax does NOT
// support quoted strings (i.e. no search for a quoted 'master headline').

const isInTextFilter = (filterString, curserPosition) => {
  if (filterString.length === 0) return false;
  const indexOfLastSpace = filterString.substring(0, curserPosition).lastIndexOf(' ');
  return filterString.charAt(indexOfLastSpace + 1) !== ':';
};

// TODO: This function is complex and still not perfect. It resembles
// parts of the filter syntax parser. It would be better to run the
// actual parser and using the parse results to decide on completions.
// Open question: What if the parser fails (invalid filter string)?

export const computeCompletions = (todoKeywords, tagNames, allProperties) => (
  filterString,
  curserPosition
) => {
  const tagAndPropNames = [].concat(
    tagNames,
    computeAllPropertyNames(fromJS(allProperties)).toJS().map(x => x + ':')
  );

  if (curserPosition === 0) {
    return todoKeywords;
  }

  const charBeforeCursor = filterString.charAt(curserPosition - 1);
  const charTwoBeforeCursor = curserPosition > 1 ? filterString.charAt(curserPosition - 2) : '';
  if (charBeforeCursor === ' ') {
    return todoKeywords;
  } else if (charBeforeCursor === ':') {
    if (charTwoBeforeCursor === ' ' || charTwoBeforeCursor === '') {
      return tagAndPropNames;
    } else {
      // Either property name or text filter
      const indexOfOtherColon = filterString.substring(0, curserPosition - 1).lastIndexOf(':');
      const maybePropertyName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
      if (indexOfOtherColon >= 0 && maybePropertyName.match(/^[^ ]+$/)) {
        // No space in property name -> is property -> return values for that property
        return computeAllPropertyValuesFor(fromJS(allProperties), maybePropertyName).toJS();
      }
    }

  } else if (charBeforeCursor === '|') {
    const indexOfOtherColon = filterString.substring(0, curserPosition).lastIndexOf(':');
    const maybeTagName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
    if (indexOfOtherColon > -1 && !maybeTagName.match(/ /)) {
      // No space between : and |  ->  | is in a tag filter
      return tagNames;
    } else {
      return todoKeywords;
    }
  } else if (charBeforeCursor.match(/[A-Z]/)) {
    const filteredTodoKeywords = todoKeywords
      .filter(x => x.startsWith(charBeforeCursor))
      .map(x => x.substring(1));
    if (charTwoBeforeCursor === ' ' || charTwoBeforeCursor === '') {
      return filteredTodoKeywords;
    } else if (charTwoBeforeCursor === '|') {
      // Only if in a text filter (not tag or property filter)
      if (isInTextFilter(filterString, curserPosition)) return filteredTodoKeywords;
    }
  }

  return [];
};

export const computeCompletionsForDatalist = (todoKeywords, tagNames, allProperties) => (
  filterString,
  curserPosition
) => {
  const completions = computeCompletions(
    todoKeywords,
    tagNames,
    allProperties
  )(filterString, curserPosition);
  return completions.map(
    x => filterString.substring(0, curserPosition) + x + filterString.substring(curserPosition)
  );
};
