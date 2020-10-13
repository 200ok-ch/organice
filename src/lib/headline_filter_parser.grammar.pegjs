
// Grammar for the parser for the headline filter.

// It will automatically be compiled to the parser JavaScript file using the
// parser generator pegjs.

// You can use https://pegjs.org/online to debug it.

// Note: As suggested by alphapapa, the parser can be extended to support
// additional types of filter terms ("predicates"), e.g. ts:on=today
// ts-active:from=2019-12-31 priority:A,B
// - https://github.com/alphapapa/org-ql#non-sexp-query-syntax

// Note: The parser will fail when the syntax does not match the grammar.
// For example, it fails for filter strings like ":" or "this|" because the
// grammar dictates a property or tag after ":" and an alternative word after
// "|". That is intended. Handling this edge cases would add complexity.
// Just wrap parser.parse() in a try-catch block and handle the case of an
// incomplete/incorrect filter string.

{
  const checkDate = (year, month, day) => {
    if (month === null) {
      return { type: 'timestamp', year: parseInt(year), month, day };
    } else {
      const date = new Date(year + "-" + month + "-" + (day === null ? "01" : day));
      if (isNaN(date.valueOf())) {
        throw {message: 'invalid date'};
      }
    }
    return { 
      type: 'timestamp', 
      year: parseInt(year), 
      month: parseInt(month), 
      day: day === null ? null : parseInt(day) 
    };
  };

}

Expression "filter expression"
  = _* head:LocationAnnotedTerm tail:(_+ LocationAnnotedTerm)* _* {
      return tail.reduce((result, element) => {
        result.push(element[1]);
        return result;
      }, [head]);
    }
 / _* { return [] }

// Used for computation of completions
LocationAnnotedTerm
  = a:Term {
        a.offset = location().start.offset;
        a.endOffset = location().end.offset;
        return a;
      };

// The order of lines is important here.
Term "filter term"
  = "-" a:PlainTerm { a.exclude = true;  return a; }
  /     a:PlainTerm { a.exclude = false; return a; }

PlainTerm
  = TermField
  / TermText
  / TermProp
  / TermTag

TermText "text filter term"
  = a:StringAlternatives {
        let type = 'ignore-case';
        // It's hard to check for upper-case chars in JS.
        // Best approach: https://stackoverflow.com/a/31415820/999007
        // Simplest approach for now:
        if (text().match(/[A-Z]/))
          type = 'case-sensitive';

        return {type: type, words: a}
  }

TermTag "tag filter term"
  = ":" a:TagAlternatives { return {type: 'tag', words: a} }

TermProp "property filter term"
  = ":" a:PropertyName ":" b:StringAlternatives? {
          return {
            type: 'property',
            property: a,
            words: b === null ? [''] : b
          }
        };

TermField "search outside of header"
  = "clock:"     a:TimeRange { return { type: 'field', field: { type: 'clock',     timerange: a } }; }
  / "sched:"     a:TimeRange { return { type: 'field', field: { type: 'scheduled', timerange: a } }; }
  / "scheduled:" a:TimeRange { return { type: 'field', field: { type: 'scheduled', timerange: a } }; }
  / "dead:"      a:TimeRange { return { type: 'field', field: { type: 'deadline',  timerange: a } }; }
  / "deadline:"  a:TimeRange { return { type: 'field', field: { type: 'deadline',  timerange: a } }; }

TimeRange "moments and timeranges"
  = ".." a:Moment { return { type: 'range', from: null, to: a }; }
  / a:Moment? ".." b:Moment? { 
      if (a === null && b === null) {
        return { type: 'all'};
      }
      return { type: 'range', from: a, to: b }; 
    }
  / a:Moment { return { type: 'date', date: a }; }

Moment "moment"
  = TimeOffset
  / TimeStamp
  / TimeUnit
  / "today" { return { type: 'special', value: 'today' }; }
  / "now" { return { type: 'special', value: 'now' }; }

TimeStamp
  = year:Year [-./]? month:Month? [-./]? day:Day? { return checkDate(year, month, day); }

TimeUnit
  = a:[hdwmy] { return { type: 'unit', unit: a }; }

Year "year"
  = a:$([0-9][0-9][0-9][0-9]) { return a; }

Month "month"
  = a:$([0-9][0-9]) { return a; }

Day "day"
  =  a:$([0-9][0-9]) { return a; }

TimeOffset "offset"
  = a:$([0-9]+) b:([hdwmy]) { return { type: 'offset', value: parseInt(a), unit: b, }; }

StringAlternatives "alternatives"
  = head:String tail:("|" String)* {
       return tail.reduce((result, element) => {
         result.push(element[1]);
         return result;
       }, [head])
     }

TagAlternatives "tag alternatives"
  = head:TagName tail:("|" TagName)* {
       return tail.reduce((result, element) => {
         result.push(element[1]);
         return result;
       }, [head])
     }

String "string"
  = [^: \t|'"]+ { return text() }
  / "'" a:([^']+) "'" { return a.join('') }
  / '"' a:([^"]+) '"' { return a.join('') }

// https://orgmode.org/manual/Property-Syntax.html
// - Property names (keys) are case-insensitive
// - Property names must not contain space
PropertyName "property name"
  = [^: \t]+ { return text() }

// https://orgmode.org/manual/Tags.html
TagName "tag name"
  = [a-zA-Z0-9_@]+ { return text() }

_ "whitespace"
  = [ \t]
