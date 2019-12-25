
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

// :assignee:jak|nik   TODO|DONE    Spec  test    :tag :foo|bar
// TODO detect upper-case unicode chars
// TODO define syntax of tag names and property names (see orgmode)
// TODO define Word
// TODO generate parser (JS API or cmd line)

Expression
  = _* head:Term tail:(_+ Term)* _* {
      return tail.reduce(function(result, element) {
        result.push(element[1]);
        return result;
      }, [head]);
    }

Term "filter term"
  = TermProp
  / TermText
  / TermTag

TermText "ignore-case term"
  = a:Alternatives {
        let type = 'ignore-case';
  		if (text().match(/[A-Z]/))
          type = 'case-sensitive';
  		return {type: type, words: a} } // [a-z0-9]+

TermTag "tag term"
  = ":" a:Alternatives { return {type: 'tag', words: a} }

TermProp "property term"
  = ":" a:Word ":" b:Alternatives? { return {key: a, value: b === null ? '' : b} };

Alternatives "alternative words"
  = head:Word tail:("|" Word)* {
       return tail.reduce((result, element) => {
         result.push(element[1]);
         return result;
       }, [head])
     }

Word "word"
  = [A-Za-z0-9]+ {return text()}

// TagName   PropertyName

_ "whitespace"
  = [ \t\n\r]

