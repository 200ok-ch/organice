
// Matcher

import { attributedStringToRawText } from './export_org.js';

export const isMatch = (filterExpr) => (header) => {
  const headLine = header.get('titleLine');
  const tags = headLine.get('tags');
  const todoKeyword = headLine.get('todoKeyword');
  const rawTitle = headLine.get('rawTitle');
  const headlineText = todoKeyword ? `${todoKeyword} ${rawTitle}` : rawTitle;
  const properties = header.get('propertyListItems')
    .map(p => [p.get('property'), attributedStringToRawText(p.get('value'))]);

  const filterTags = filterExpr.filter(x => x.type === 'tag')
    .map(x => x.words);
  const filterCS = filterExpr.filter(x => x.type === 'case-sensitive')
    .map(x => x.words);
  const filterIC = filterExpr.filter(x => x.type === 'ignore-case')
    .map(x => x.words);
  const filterProps = filterExpr.filter(x => x.type === 'property')
    .map(x => [x.property, x.words]);

  const orChain = source => xs => xs.some(x => source.includes(x));
  const propertyFilter = ([x, ys]) => ! properties.filter(([key, val]) => {
    // Property names (keys) are case-insensitive - https://orgmode.org/manual/Property-Syntax.html
    const nameMatch = key.toLowerCase() === x.toLowerCase();
    const valueMatch = ys.some(y => val.includes(y));
    return nameMatch && valueMatch;
  }).isEmpty();
  return filterTags.every(orChain(tags))
      && filterCS.every(orChain(headlineText))
      && filterIC.every(orChain(headlineText.toLowerCase()))
      && filterProps.every(propertyFilter);
};

// Parser

import fs from 'fs';
import path from 'path';
import peg from 'pegjs';

const grammar = fs.readFileSync(path.join(__dirname, './headline_filter_parser.grammar.js')).toString();
export const parser = peg.generate(grammar);

// Suggestions / Completions

export const computeCompletions = (todoKeywords, tagNames, allProperties) => (filterString, curserPosition) => {
  const tagAndPropNames = [].concat(tagNames, allProperties.map(([x]) => x));

  // let expr = null;
  // try {
  //   expr = parser.parse(filterString)
  // } catch {
  // };

  if (curserPosition === 0) {
    return todoKeywords;
  }

  const charBeforeCursor = filterString.charAt(curserPosition - 1);
  if (charBeforeCursor === ':') {
    const indexOfOtherColon = filterString.substring(0, curserPosition - 1).lastIndexOf(':');
    const maybePropertyName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
    if (maybePropertyName.match(/[^ ]/)) {
      // No space in property name -> is property -> return values
      return allProperties.filter(([x]) => x === maybePropertyName).map(([_, y]) => y);
    } else {
      return tagAndPropNames;
    }
    return tagAndPropNames;
  } else if (charBeforeCursor === '|') {
    const indexOfOtherColon = filterString.substring(0, curserPosition).lastIndexOf(':');
    const maybeTagName = filterString.substring(indexOfOtherColon + 1, curserPosition - 1);
    console.log(maybeTagName);
    if (indexOfOtherColon > -1 && !maybeTagName.match(/ /)) {
      // No space between : and |  ->  | is in a tag filter
      return tagNames;
    } else {
      return todoKeywords;
    }
  }

  return todoKeywords;
};
