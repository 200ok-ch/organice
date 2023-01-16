// Matcher

import { fromJS } from 'immutable';
import {
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from 'date-fns';
import { attributedStringToRawText } from './export_org.js';
import { computeAllPropertyNames, computeAllPropertyValuesFor } from './org_utils';
import {
  addTimestampUnitToDate,
  subtractTimestampUnitFromDate,
  dateForTimestamp,
} from './timestamps';

const startOfDate = (from) => {
  const temp = new Date();
  temp.setFullYear(from.year);
  if (from.month === null) {
    return startOfYear(temp);
  } else if (from.day === null) {
    temp.setMonth(from.month - 1);
    return startOfMonth(temp);
  } else {
    temp.setMonth(from.month - 1);
    temp.setDate(from.day);
    return startOfDay(temp);
  }
};

const endOfDate = (to) => {
  const temp = new Date();
  temp.setFullYear(to.year);
  if (to.month === null) {
    return endOfYear(temp);
  } else if (to.day === null) {
    temp.setMonth(to.month - 1);
    return endOfMonth(temp);
  } else {
    temp.setMonth(to.month - 1);
    temp.setDate(to.day);
    return endOfDay(temp);
  }
};

const fromSpecial = (from) => {
  const temp = new Date();
  if (from.value === 'now') {
    return temp;
  } else if (from.value === 'today') {
    return startOfDay(temp);
  }
};

const toSpecial = (to) => {
  const temp = new Date();
  if (to.value === 'now') {
    return temp;
  } else if (to.value === 'today') {
    return endOfDay(temp);
  }
};

const fromUnit = (date, unit) => {
  const d = new Date(date);
  switch (unit) {
    case 'h':
      return startOfHour(d);
    case 'd':
      return startOfDay(d);
    case 'w':
      return startOfWeek(d);
    case 'm':
      return startOfMonth(d);
    case 'y':
      return startOfYear(d);
    default:
      throw Error('unknown `unit` for timerange search');
  }
};

const toUnit = (date, unit) => {
  const d = new Date(date);
  switch (unit) {
    case 'h':
      return endOfHour(d);
    case 'd':
      return endOfDay(d);
    case 'w':
      return endOfWeek(d);
    case 'm':
      return endOfMonth(d);
    case 'y':
      return endOfYear(d);
    default:
      throw Error('unknown `unit` for timerange search');
  }
};

const resolveFrom = (from) => {
  if (from === null) {
    return new Date();
  } else if (from.type === 'timestamp') {
    return startOfDate(from);
  } else if (from.type === 'special') {
    return fromSpecial(from);
  } else if (from.type === 'offset') {
    return subtractTimestampUnitFromDate(new Date(), from.value, from.unit);
  } else if (from.type === 'unit') {
    return fromUnit(new Date(), from.unit);
  }
};

const resolveTo = (to) => {
  if (to === null) {
    return new Date();
  } else if (to.type === 'timestamp') {
    return endOfDate(to);
  } else if (to.type === 'special') {
    return toSpecial(to);
  } else if (to.type === 'offset') {
    return addTimestampUnitToDate(new Date(), to.value, to.unit);
  } else if (to.type === 'unit') {
    return toUnit(new Date(), to.unit);
  }
};

const isRelative = (moment) => {
  return moment.type === 'offset' || moment.type === 'unit';
};

export const timeFilter = (filterDescription) => {
  const timeFilterDescription = filterDescription.field.timerange;
  let lower;
  let upper;
  if (timeFilterDescription.type === 'point') {
    const point = timeFilterDescription.point;
    if (point.type === 'offset') {
      lower = new Date();
      upper = addTimestampUnitToDate(new Date(lower));
    } else {
      lower = resolveFrom(point);
      upper = resolveTo(point);
    }
    return (timestamp) =>
      lower <= dateForTimestamp(timestamp) && dateForTimestamp(timestamp) <= upper;
  } else if (timeFilterDescription.type === 'range') {
    const from = timeFilterDescription.from
      ? timeFilterDescription.from
      : { type: 'special', value: 'now' };
    const to = timeFilterDescription.to
      ? timeFilterDescription.to
      : { type: 'special', value: 'now' };
    let lower;
    let upper;
    if (isRelative(from) === isRelative(to)) {
      lower = resolveFrom(from);
      upper = resolveTo(to);
    } else if (from.type === 'offset') {
      upper = resolveTo(to);
      lower = subtractTimestampUnitFromDate(new Date(upper), from.value, from.unit);
    } else if (to.type === 'offset') {
      lower = resolveFrom(from);
      upper = addTimestampUnitToDate(new Date(lower), to.value, to.unit);
    } else if (from.type === 'unit') {
      upper = resolveTo(to);
      lower = fromUnit(upper, from.unit);
    } else if (to.type === 'unit') {
      lower = resolveFrom(from);
      upper = toUnit(lower, to.unit);
    } else {
      throw Error('unable to construct timerangefilter');
    }
    return (timestamp) =>
      lower <= dateForTimestamp(timestamp) && dateForTimestamp(timestamp) <= upper;
  } else if (timeFilterDescription.type === 'all') {
    return (_) => true;
  } else {
    throw Error('unable to construct timefilter');
  }
};

const orChain = (source) => (xs) => xs.some((x) => source.includes(x));
const orChainDate = (dates) => (filter) => dates.size !== 0 && dates.some((x) => filter(x));

export const isMatch = (filterExpr) => {
  const filterFilter = (type, exclude) => (x) => x.type === type && x.exclude === exclude;
  const words = (x) => x.words;
  const wordsLowerCase = (x) => x.words.map((y) => y.toLowerCase());

  const filterTags = filterExpr.filter(filterFilter('tag', false)).map(words);
  const filterCS = filterExpr.filter(filterFilter('case-sensitive', false)).map(words);
  const filterIC = filterExpr.filter(filterFilter('ignore-case', false)).map(wordsLowerCase);
  const filterProps = filterExpr
    .filter(filterFilter('property', false))
    .map((x) => [x.property, x.words]);
  const filterField = filterExpr.filter(filterFilter('field', false));
  const filterDate = filterField.filter((f) => f.field.type === 'date').map(timeFilter);
  //const filterClock = filterField.filter((f) => f.field.type === 'clock').map(timeFilter);
  const filterSchedule = filterField.filter((f) => f.field.type === 'scheduled').map(timeFilter);
  const filterDeadline = filterField.filter((f) => f.field.type === 'deadline').map(timeFilter);

  const filterTagsExcl = filterExpr.filter(filterFilter('tag', true)).map(words);
  const filterCSExcl = filterExpr.filter(filterFilter('case-sensitive', true)).map(words);
  const filterICExcl = filterExpr.filter(filterFilter('ignore-case', true)).map(wordsLowerCase);
  const filterPropsExcl = filterExpr
    .filter(filterFilter('property', true))
    .map((x) => [x.property, x.words]);

  const filterDesc = filterField
    .filter((f) => f.field.type === 'description' && f.field.text.type === 'ignore-case')
    .map((x) => x.field.text.words.map((y) => y.toLowerCase()));
  const filterDescCS = filterField
    .filter((f) => f.field.type === 'description' && f.field.text.type === 'case-sensitive')
    .map((x) => x.field.text.words);

  return (header) => {
    const headLine = header.get('titleLine');
    const tags = headLine.get('tags');
    const todoKeyword = headLine.get('todoKeyword');
    const rawTitle = headLine.get('rawTitle');
    const headlineText = todoKeyword ? `${todoKeyword} ${rawTitle}` : rawTitle;
    const properties = header
      .get('propertyListItems')
      .map((p) => [p.get('property'), attributedStringToRawText(p.get('value'))]);
    const planningItems = header
      .get('planningItems')
      .filter((p) => p.get('timestamp').get('isActive') === true);
    const dates = planningItems.map((p) => p.get('timestamp'));
    const scheduleds = planningItems
      .filter((p) => p.get('type') === 'SCHEDULED')
      .map((p) => p.get('timestamp'));
    const deadlines = planningItems
      .filter((p) => p.get('type') === 'DEADLINE')
      .map((p) => p.get('timestamp'));

    var description = '';
    if (filterDesc.length > 0 || filterDescCS.length > 0) {
      const stripMarkup = (text) => text.replace(/\*([\w]*)\*/, (match, p1, _, __) => p1);
      description = stripMarkup(header.get('rawDescription'));
    }

    //const clocks = header
    //  .get('logBookEntries')
    //  .flatMap((l) => [l.get('start'), l.get('end')])
    //  .filter((t) => t !== undefined && t !== null);
    const propertyFilter = ([x, ys]) =>
      !properties
        .filter(([key, val]) => {
          // Property names (keys) are case-insensitive
          // https://orgmode.org/manual/Property-Syntax.html
          const nameMatch = key.toLowerCase() === x.toLowerCase();
          const valueMatch = ys.some((y) => val.includes(y));
          return nameMatch && valueMatch;
        })
        .isEmpty();

    return (
      filterTags.every(orChain(tags)) &&
      filterCS.every(orChain(headlineText)) &&
      filterIC.every(orChain(headlineText.toLowerCase())) &&
      filterProps.every(propertyFilter) &&
      filterDate.every(orChainDate(dates)) &&
      //filterClock.every(orChainDate(clocks)) &&
      filterSchedule.every(orChainDate(scheduleds)) &&
      filterDeadline.every(orChainDate(deadlines)) &&
      filterDesc.every(orChain(description.toLowerCase())) &&
      filterDescCS.every(orChain(description)) &&
      !filterTagsExcl.some(orChain(tags)) &&
      !filterCSExcl.some(orChain(headlineText)) &&
      !filterICExcl.some(orChain(headlineText.toLowerCase())) &&
      !filterPropsExcl.some(propertyFilter)
    );
  };
};

// Suggestions / Completions

// The computation of completions rely on the fact, that the filter syntax does NOT
// support quoted strings (i.e. no search for a quoted 'master headline').

// This function is complex and still not perfect. It resembles parts of the
// filter syntax parser. If the parser would annotate all parsed symbols with
// offsets information, computeLogicalPosition could simplify the algorithm as
// long as the filter string is parsed successfully.

export const computeCompletions =
  (todoKeywords, tagNames, allProperties) => (filterExpr, filterString, curserPosition) => {
    const tagAndPropNames = [].concat(
      tagNames,
      computeAllPropertyNames(fromJS(allProperties))
        .toJS()
        .map((x) => x + ':')
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
          .filter((x) => x.startsWith(textBeforeCursor))
          .map((x) => x.substring(textBeforeCursor.length));
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
          const maybePropertyName = filterString.substring(
            indexOfOtherColon + 1,
            curserPosition - 1
          );
          const quoteStringIfPossible = (x) => {
            if (x.match(/ /)) {
              if (!x.match(/"/)) return [`"${x}"`];
              if (!x.match(/'/)) return [`'${x}'`];
              const match = x.match(/^[^ ]*/);
              return [match[0]];
            }
            return [x];
          };
          if (indexOfOtherColon >= 0 && maybePropertyName.match(/^[^ ]+$/)) {
            // No space in property name -> is property -> return values for that property
            return computeAllPropertyValuesFor(fromJS(allProperties), maybePropertyName)
              .flatMap(quoteStringIfPossible)
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

export const computeCompletionsForDatalist =
  (todoKeywords, tagNames, allProperties) => (filterExpr, filterString, curserPosition) => {
    const completions = computeCompletions(todoKeywords, tagNames, allProperties)(
      filterExpr,
      filterString,
      curserPosition
    );
    return completions.map(
      (x) => filterString.substring(0, curserPosition) + x + filterString.substring(curserPosition)
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
