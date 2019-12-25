
import { attributedStringToRawText } from './export_org.js';

export const isMatch = (filterExpr) => (header) => {
  const headLine = header.get('titleLine');
  const tags = headLine.get('tags');
  const todoKeyword = headLine.get('todoKeyword');
  const rawTitle = headLine.get('rawTitle');
  const headlineText = todoKeyword ? `${todoKeyword} ${rawTitle}` : rawTitle;
  const properties = header.get('propertyListItems')
    .map(p => [p.get('property'), attributedStringToRawText(p.get('value'))]);

  const filterTags = filterExpr.filter(x => x.type == 'tag')
    .map(x => x.words);
  const filterCS = filterExpr.filter(x => x.type == 'case-sensitive')
    .map(x => x.words);
  const filterIC = filterExpr.filter(x => x.type == 'ignore-case')
    .map(x => x.words);
  const filterProps = filterExpr.filter(x => x.type == 'property')
    .map(x => [x.property, x.words]);

  const orChain = source => xs => xs.some(x => source.includes(x));
  const propertyFilter = ([x, ys]) => ! properties.filter(([key, val]) =>
    key == x && ys.some(y => val.includes(y))).isEmpty();
  return filterTags.every(orChain(tags))
      && filterCS.every(orChain(headlineText))
      && filterIC.every(orChain(headlineText.toLowerCase()))
      && filterProps.every(propertyFilter);
};
