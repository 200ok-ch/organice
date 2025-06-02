import generateId from './id_generator';
import { hasActiveClock, updateHeadersTotalTimeLoggedRecursive } from './clocking';

import { fromJS, List } from 'immutable';
import _ from 'lodash';

// TODO: Extract all match groups of `beginningRegexp` (for example
// like `emailRegexp`), so that they can be documented and are less
// unwieldly.
const beginningRegexp =
  /(\[\[([^\]]*)\]\]|\[\[([^\]]*)\]\[([^\]]*)\]\])|(\[((\d*%)|(\d*\/\d*))\])|((^|\s|[({'"])([*/~=_+])([^\s,'](.*?))\11([\s\-.,:;!?'")}]?))/;

// Regexp taken from https://stackoverflow.com/a/3809435/999007
const httpUrlRegexp =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*))/;

// Regexp taken from https://stackoverflow.com/a/1373724/999007
const urlRegexp =
  /([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)/;

const internationalPhoneRegexp = /((\+|00)\d{8,30})/;

// Regexp taken from https://stackoverflow.com/a/16699507/252585
const usPhoneRegexp = /((\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/;

// Works for formatted mobile phone numbers like "078 326 86 74"
const swissPhoneRegexp1 = /(0[1-9]{2}\s[0-9]{3}\s[0-9]{2}\s[0-9]{2})/;

// Works for unformatted mobile phone numbers like "0783268674" and
// unformatted landline numbers like "041783268675"
const swissPhoneRegexp2 = /(0[0-9]{9,11})/;

const wwwUrlRegexp = /(www(\.[-_a-zA-Z0-9]+){2,}(\/[-_a-zA-Z0-9]+)*)/;

const timestampOptionalRepeaterOrDelayRegexp =
  /(?: (\+|\+\+|\.\+|-|--)(\d+)([hdwmy])(?:\/(\d+)([hdwmy]))?)?/;
const timestampRegex = new RegExp(
  [
    /([<[])/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(?: ([^0-9\s]{1,9}))?/,
    /(?: ([012]?\d:[0-5]\d))?(?:-([012]?\d:[0-5]\d))?/,
    timestampOptionalRepeaterOrDelayRegexp,
    timestampOptionalRepeaterOrDelayRegexp,
    /[>\]]/,
  ]
    .map((re) => re.source)
    .join('')
);

const markupAndCookieRegex = new RegExp(
  [
    beginningRegexp.source,
    `(${timestampRegex.source}(?:--${timestampRegex.source})?)`,
    httpUrlRegexp.source,
    urlRegexp.source,
    internationalPhoneRegexp.source,
    usPhoneRegexp.source,
    swissPhoneRegexp1.source,
    swissPhoneRegexp2.source,
    wwwUrlRegexp.source,
  ].join('|'),
  'g'
);

// INFO: https://www.debuggex.com/ is a good tool to inspect how the
// matches work.
// console.log(markupAndCookieRegex);

const timestampFromRegexMatch = (match, partIndices) => {
  const [
    typeBracket,
    year,
    month,
    day,
    dayName,
    timeStart,
    timeEnd,
    firstDelayRepeatType,
    firstDelayRepeatValue,
    firstDelayRepeatUnit,
    firstRepeaterDeadlineValue,
    firstRepeaterDeadlineUnit,
    secondDelayRepeatType,
    secondDelayRepeatValue,
    secondDelayRepeatUnit,
    secondRepeaterDeadlineValue,
    secondRepeaterDeadlineUnit,
  ] = partIndices.map((partIndex) => match[partIndex]);

  if (!year) {
    return null;
  }

  const [startHour, startMinute] = !!timeStart ? timeStart.split(':') : [];
  const [endHour, endMinute] = !!timeEnd ? timeEnd.split(':') : [];

  let repeaterType, repeaterValue, repeaterUnit, repeaterDeadlineValue, repeaterDeadlineUnit;
  let delayType, delayValue, delayUnit;

  if (['+', '++', '.+'].includes(firstDelayRepeatType)) {
    repeaterType = firstDelayRepeatType;
    repeaterValue = firstDelayRepeatValue;
    repeaterUnit = firstDelayRepeatUnit;
    repeaterDeadlineValue = firstRepeaterDeadlineValue;
    repeaterDeadlineUnit = firstRepeaterDeadlineUnit;
  } else if (['-', '--'].includes(firstDelayRepeatType)) {
    delayType = firstDelayRepeatType;
    delayValue = firstDelayRepeatValue;
    delayUnit = firstDelayRepeatUnit;
  }
  if (['+', '++', '.+'].includes(secondDelayRepeatType)) {
    repeaterType = secondDelayRepeatType;
    repeaterValue = secondDelayRepeatValue;
    repeaterUnit = secondDelayRepeatUnit;
    repeaterDeadlineValue = secondRepeaterDeadlineValue;
    repeaterDeadlineUnit = secondRepeaterDeadlineUnit;
  } else if (['-', '--'].includes(secondDelayRepeatType)) {
    delayType = secondDelayRepeatType;
    delayValue = secondDelayRepeatValue;
    delayUnit = secondDelayRepeatUnit;
  }

  return {
    isActive: typeBracket === '<',
    year,
    month,
    day,
    dayName,
    startHour,
    startMinute,
    endHour,
    endMinute,
    repeaterType,
    repeaterValue,
    repeaterUnit,
    delayType,
    delayValue,
    delayUnit,
    repeaterDeadlineValue,
    repeaterDeadlineUnit,
  };
};

export const parseMarkupAndCookies = (rawText, { shouldAppendNewline = false } = {}) => {
  const matches = [];
  let match = markupAndCookieRegex.exec(rawText);
  while (match) {
    if (!!match[2]) {
      matches.push({
        type: 'link',
        rawText: match[0],
        uri: match[2],
        index: match.index,
      });
    } else if (!!match[3] && !!match[4]) {
      matches.push({
        type: 'link',
        rawText: match[0],
        uri: match[3],
        title: match[4],
        index: match.index,
      });
    } else if (!!match[7]) {
      const percentCookieMatch = match[7].match(/(\d*)%/);
      matches.push({
        type: 'percentage-cookie',
        rawText: match[0],
        percentage: percentCookieMatch[1],
        index: match.index,
      });
    } else if (!!match[8]) {
      const fractionCookieMatch = match[8].match(/(\d*)\/(\d*)/);
      matches.push({
        type: 'fraction-cookie',
        rawText: match[0],
        fraction: [fractionCookieMatch[1], fractionCookieMatch[2]],
        index: match.index,
      });
    } else if (!!match[11]) {
      const markupType = {
        '~': 'inline-code',
        '*': 'bold',
        '/': 'italic',
        '+': 'strikethrough',
        _: 'underline',
        '=': 'verbatim',
      }[match[11]];

      const markupPrefixLength = match[10].length;

      matches.push({
        type: 'inline-markup',
        rawText: match[0].substring(markupPrefixLength, match[12].length + 2 + markupPrefixLength),
        index: match.index + markupPrefixLength,
        content: match[12],
        markupType,
      });
    } else if (!!match[15]) {
      const firstTimestamp = timestampFromRegexMatch(match, _.range(16, 33));
      const secondTimestamp = timestampFromRegexMatch(match, _.range(33, 50));

      matches.push({
        type: 'timestamp',
        rawText: match[0],
        index: match.index,
        firstTimestamp,
        secondTimestamp,
      });
    } else if (!!match[50]) {
      matches.push({
        type: 'url',
        rawText: match[0],
        index: match.index,
      });
    } else if (!!match[53]) {
      matches.push({
        type: 'e-mail',
        rawText: match[0],
        index: match.index,
      });
    } else if (!!match[54] || !!match[56] || !!match[58] || !!match[59]) {
      matches.push({
        type: 'phone-number',
        rawText: match[0],
        index: match.index,
      });
    } else if (!!match[60]) {
      matches.push({
        type: 'www-url',
        rawText: match[0],
        index: match.index,
      });
    }
    match = markupAndCookieRegex.exec(rawText);
  }

  const lineParts = [];
  let startIndex = 0;
  matches.forEach((match) => {
    let index = match.index;

    // Get the part before the first match:
    if (index !== startIndex) {
      const text = rawText.substring(startIndex, index);
      lineParts.push({
        type: 'text',
        contents: text,
      });
    }

    // Get this match:
    const part = computeParseResults(rawText, match);
    lineParts.push(part);

    startIndex = match.index + match.rawText.length;
  });

  if (startIndex !== rawText.length || shouldAppendNewline) {
    const trailingText =
      rawText.substring(startIndex, rawText.length) + (shouldAppendNewline ? '\n' : '');
    lineParts.push({
      type: 'text',
      contents: trailingText,
    });
  }

  return lineParts;
};

const computeParseResults = (rawText, match) => {
  switch (match.type) {
    case 'link':
      const linkPart = {
        id: generateId(),
        type: 'link',
        contents: {
          uri: match.uri,
        },
      };
      if (match.title) {
        linkPart.contents.title = match.title;
      }
      return linkPart;
    case 'percentage-cookie':
      return {
        id: generateId(),
        type: 'percentage-cookie',
        percentage: match.percentage,
      };
    case 'fraction-cookie':
      return {
        id: generateId(),
        type: 'fraction-cookie',
        fraction: match.fraction,
      };
    case 'inline-markup':
      return {
        id: generateId(),
        type: 'inline-markup',
        content: match.content,
        markupType: match.markupType,
      };
    case 'timestamp':
      return {
        id: generateId(),
        type: 'timestamp',
        firstTimestamp: match.firstTimestamp,
        secondTimestamp: match.secondTimestamp,
      };
    case 'url':
    case 'www-url':
    case 'e-mail':
    case 'phone-number':
      return {
        id: generateId(),
        type: match.type,
        content: match.rawText,
      };
    default:
      throw Error(
        'The regex parser parsed something but it is not converted to proper data structure.'
      );
  }
};

const parseTable = (tableLines) => {
  const table = {
    id: generateId(),
    type: 'table',
    contents: [[]],
    columnProperties: [],
  };

  tableLines
    .map((line) => line.trim())
    .forEach((line) => {
      if (line.startsWith('|-')) {
        table.contents.push([]);
      } else {
        const lastRow = _.last(table.contents);
        const lineCells = line.substr(1, line.length - 2).split('|');

        if (lastRow.length === 0) {
          lineCells.forEach((cell) => lastRow.push(cell));
        } else {
          lineCells.forEach((cellContents, cellIndex) => {
            lastRow[cellIndex] += `\n${cellContents}`;
          });
        }
      }
    });

  // Parse the contents of each cell.
  table.contents = table.contents.map((row) => ({
    id: generateId(),
    contents: row.map((rawContents) => ({
      id: generateId(),
      contents: parseMarkupAndCookies(rawContents, { excludeCookies: true }),
      rawContents,
    })),
  }));

  // We sometimes end up with an extra, empty row - remove it if so.
  if (_.last(table.contents).contents.length === 0) {
    table.contents = table.contents.slice(0, table.contents.length - 1);
  }

  // Make sure each row has the same number of columns.
  const maxNumColumns = Math.max(...table.contents.map((row) => row.contents.length));
  table.contents.forEach((row) => {
    if (row.contents.length < maxNumColumns) {
      _.times(maxNumColumns - row.contents.length, () => {
        row.contents.push({
          id: generateId(),
          contents: [],
          rawContents: '',
        });
      });
    }
  });

  return table;
};

export const parseRawText = (rawText, { excludeContentElements = false } = {}) => {
  const lines = rawText.split('\n');

  const LIST_HEADER_REGEX = /^\s*([-+*]|(\d+(\.|\)))) (.*)/;

  let currentListHeaderNestingLevel = null;
  const rawLineParts = _.flatten(
    lines.map((line, lineIndex) => {
      const numLeadingSpaces = line.match(/^( *)/)[0].length;

      if (
        currentListHeaderNestingLevel !== null &&
        (numLeadingSpaces > currentListHeaderNestingLevel || !line.trim())
      ) {
        return [
          {
            type: 'raw-list-content',
            line,
          },
        ];
      } else {
        currentListHeaderNestingLevel = null;

        if (line.match(LIST_HEADER_REGEX) && !excludeContentElements) {
          currentListHeaderNestingLevel = numLeadingSpaces;

          return [
            {
              type: 'raw-list-header',
              line,
            },
          ];
        } else if (line.trim().startsWith('|') && !excludeContentElements) {
          return [
            {
              type: 'raw-table',
              line,
            },
          ];
        } else {
          return parseMarkupAndCookies(line, {
            shouldAppendNewline: lineIndex !== lines.length - 1,
            excludeCookies: true,
          });
        }
      }
    })
  );

  const processedLineParts = [];
  for (let partIndex = 0; partIndex < rawLineParts.length; ++partIndex) {
    const linePart = rawLineParts[partIndex];
    if (linePart.type === 'raw-table') {
      const tableLines = _.takeWhile(
        rawLineParts.slice(partIndex),
        (part) => part.type === 'raw-table'
      ).map((part) => part.line);

      processedLineParts.push(parseTable(tableLines));

      partIndex += tableLines.length - 1;
    } else if (linePart.type === 'raw-list-header') {
      const numLeadingSpaces = linePart.line.match(/^( *)/)[0].length;
      const contentLines = _.takeWhile(
        rawLineParts.slice(partIndex + 1),
        (part) => part.type === 'raw-list-content'
      )
        .map((part) => part.line)
        .map((line) =>
          line.startsWith(' '.repeat(numLeadingSpaces + 2))
            ? line.substr(numLeadingSpaces + 2)
            : line.substr(numLeadingSpaces + 1)
        );
      if (contentLines[contentLines.length - 1] === '') {
        contentLines[contentLines.length - 1] = ' ';
      }
      const contents = parseRawText(contentLines.join('\n')).toJS();

      partIndex += contentLines.length;

      const isOrdered = !!linePart.line.match(/^\s*\d+[.)]/);

      // Remove the leading -, +, *, or number characters.
      let line = linePart.line.match(LIST_HEADER_REGEX)[4];

      let forceNumber = null;
      if (line.match(/^\s*\[@\d+\]/)) {
        forceNumber = line.match(/^\s*\[@(\d+)\]/)[1];
        line = line.replace(/^\s*\[@\d+\]\s*/, '');
      }

      let checkboxState = null;
      const isCheckbox = !!line.match(/^\s*\[[ X-]\]/);
      if (isCheckbox) {
        const stateCharacter = line.match(/^\s*\[([ X-])\]/)[1];
        checkboxState = {
          ' ': 'unchecked',
          X: 'checked',
          '-': 'partial',
        }[stateCharacter];

        line = line.replace(/^\s*\[[ X-]\]\s*/, '');
      }

      const newListItem = {
        id: generateId(),
        titleLine: parseMarkupAndCookies(line),
        contents,
        forceNumber,
        isCheckbox,
        checkboxState,
      };

      const lastIndex = processedLineParts.length - 1;
      if (lastIndex >= 0 && processedLineParts[lastIndex].type === 'list') {
        processedLineParts[lastIndex].items.push(newListItem);
      } else {
        processedLineParts.push({
          type: 'list',
          id: generateId(),
          items: [newListItem],
          bulletCharacter: linePart.line.trim()[0],
          numberTerminatorCharacter: isOrdered ? linePart.line.match(/\s*\d+([.)])/)[1] : null,
          isOrdered,
        });
      }
    } else {
      processedLineParts.push(linePart);
    }
  }

  return fromJS(processedLineParts);
};

export const _parsePlanningItems = (rawText) => {
  const optionalSinglePlanningItemRegex = RegExp(
    `((DEADLINE|SCHEDULED|CLOSED):\\s*${asStrNoSlashs(timestampRegex)})?`
  );

  // If there are any planning items, consume not more
  // than one newline after the last planning item.
  const planningRegex = concatRegexes(
    /^\s*/,
    optionalSinglePlanningItemRegex,
    /[ \t]*/,
    optionalSinglePlanningItemRegex,
    /[ \t]*/,
    optionalSinglePlanningItemRegex,
    /[ \t]*\n?/
  );
  const planningRegexCaptureGroupsOfType = [2, 21, 40]; // depends on timestampRegex
  const planningMatch = rawText.match(planningRegex);

  const planningItems = fromJS(
    planningRegexCaptureGroupsOfType
      .map((planningTypeIndex) => {
        const type = planningMatch[planningTypeIndex];
        if (!type) {
          return null;
        }

        const timestamp = timestampFromRegexMatch(
          planningMatch,
          _.range(planningTypeIndex + 1, planningTypeIndex + 1 + 17)
        );

        return createOrUpdateTimestamp({ type, timestamp });
      })
      .filter((item) => !!item)
  );

  if (planningItems.size === 0) {
    // If there are no matches for planning items, return the original rawText.
    return { planningItems: fromJS([]), strippedDescription: rawText };
  } else {
    const remainingDescriptionWithoutPlanningItem = rawText.replace(planningRegex, '');
    return { planningItems, strippedDescription: remainingDescriptionWithoutPlanningItem };
  }
};

const createOrUpdateTimestamp = ({ type, timestamp, id }) =>
  fromJS({ type, timestamp, id: id || generateId() });

const parsePropertyList = (rawText) => {
  const lines = rawText.split('\n');
  const propertiesLineIndex = lines.findIndex((line) => line.trim() === ':PROPERTIES:');
  const endLineIndex = lines.findIndex((line) => line.trim() === ':END:');

  if (
    propertiesLineIndex === -1 ||
    endLineIndex === -1 ||
    !rawText.trim().startsWith(':PROPERTIES:')
  ) {
    return {
      propertyListItems: List(),
      strippedDescription: rawText,
    };
  }

  const propertyListItems = fromJS(
    lines
      .slice(propertiesLineIndex + 1, endLineIndex)
      .map((line) => {
        const match = line.match(/:([^\s]*):(?: (.*))?/);
        if (!match) {
          return null;
        }

        // Parse the properties value even though most values would
        // not need parsing. Only timestamps are interactive, the rest
        // will be saved as plain text.
        let value = !!match[2] ? parseMarkupAndCookies(match[2]) : null;

        if (value && value[0].type !== 'timestamp') {
          value = [{ contents: match[2], type: 'text' }];
        }

        return {
          property: match[1],
          value,
          id: generateId(),
        };
      })
      .filter((result) => !!result)
  );

  return {
    propertyListItems,
    strippedDescription: lines.slice(endLineIndex + 1).join('\n'),
  };
};

const parseLogbook = (rawText) => {
  const lines = rawText.split('\n');
  const logbookLineIndex = lines.findIndex((line) => line.trim() === ':LOGBOOK:');
  const endLineIndex = lines.findIndex((line) => line.trim() === ':END:');

  if (logbookLineIndex === -1 || endLineIndex === -1 || !rawText.trim().startsWith(':LOGBOOK:')) {
    return {
      logBookEntries: List(),
      strippedDescription: rawText,
    };
  }

  const logBookEntryStartRegex = concatRegexes(/^CLOCK: /, timestampRegex, /$/);
  const logBookEntryFullRegex = concatRegexes(
    /^CLOCK: /,
    timestampRegex,
    '/--/',
    timestampRegex,
    /\s*=>\s*\S+$/
  );
  const logBookEntries = fromJS(
    lines.slice(logbookLineIndex + 1, endLineIndex).map((line) => {
      const lineFullMatch = line.trim().match(logBookEntryFullRegex);
      if (lineFullMatch) {
        return {
          start: timestampFromRegexMatch(lineFullMatch, _.range(1, 18)),
          end: timestampFromRegexMatch(lineFullMatch, _.range(18, 39)),
          id: generateId(),
        };
      }
      const lineStartMatch = line.trim().match(logBookEntryStartRegex);
      if (lineStartMatch) {
        return {
          start: timestampFromRegexMatch(lineStartMatch, _.range(1, 18)),
          end: null,
          id: generateId(),
        };
      }
      return { raw: line.trimLeft(), id: generateId() };
    })
  );

  return {
    logBookEntries,
    strippedDescription: lines.slice(endLineIndex + 1).join('\n'),
  };
};

export const _parseLogNotes = (rawText) => {
  // Only parse log notes if a logbook exists. Otherwise, a list - log notes
  // or just a normal list - will go into the description.
  const lines = rawText.split('\n');
  const logbookLineIndex = lines.findIndex((line) => line.trim() === ':LOGBOOK:');
  if (logbookLineIndex !== -1)
    return makeLogNotesResult(lines.slice(0, logbookLineIndex), lines.slice(logbookLineIndex));
  return makeLogNotesResult([], [rawText]);
};

export const parseDescriptionPrefixElements = (rawText) => {
  const planningItemsParse = _parsePlanningItems(rawText);

  const planningItems = planningItemsParse.planningItems;
  const propertyListParse = parsePropertyList(planningItemsParse.strippedDescription);
  // In Orgmode, notes are added below properties and before
  // logbook. However, logbook is added directly below properties if
  // it does not exist.
  const logNotes = _parseLogNotes(propertyListParse.strippedDescription);
  const logBookParse = parseLogbook(logNotes.strippedDescription);

  return {
    planningItems: planningItems,
    propertyListItems: propertyListParse.propertyListItems,
    logNotes: logNotes.logNotes,
    logBookEntries: logBookParse.logBookEntries,
    strippedDescription: logBookParse.strippedDescription,
  };
};

export const _updateHeaderFromDescription = (header, rawUnstrippedDescription) => {
  const { planningItems, propertyListItems, logNotes, logBookEntries, strippedDescription } =
    parseDescriptionPrefixElements(rawUnstrippedDescription);
  const parsedDescription = parseRawText(strippedDescription);

  const parsedTitle = header.getIn(['titleLine', 'title']);
  const mergedPlanningItems = mergePlanningItems(
    planningItems,
    extractActiveTimestampsForPlanningItemsFromParse('TIMESTAMP_TITLE', parsedTitle),
    extractActiveTimestampsForPlanningItemsFromParse('TIMESTAMP_DESCRIPTION', parsedDescription),
    extractActiveTimestampsForPlanningItemsFromParse('TIMESTAMP_LOG_NOTES', logNotes)
  );

  return header
    .set('rawDescription', strippedDescription)
    .set('description', parsedDescription)
    .set('planningItems', mergedPlanningItems)
    .set('propertyListItems', propertyListItems)
    .set('logNotes', logNotes)
    .set('logBookEntries', logBookEntries);
};

const defaultKeywordSets = fromJS([
  {
    keywords: ['TODO', 'DONE'],
    completedKeywords: ['DONE'],
    default: true,
  },
]);

export const parseTitleLine = (titleLine, todoKeywordSets) => {
  const allKeywords = todoKeywordSets.flatMap((todoKeywordSet) => {
    return todoKeywordSet.get('keywords');
  });
  const todoKeyword = allKeywords.filter((keyword) => titleLine.startsWith(keyword + ' ')).first();
  let rawTitle = titleLine;
  if (todoKeyword) {
    rawTitle = rawTitle.substr(todoKeyword.length + 1);
  }

  // Check for tags.
  let tags = [];
  if (rawTitle.trimRight().endsWith(':')) {
    const titleParts = rawTitle.trimRight().split(' ');
    const possibleTags = titleParts[titleParts.length - 1];
    if (/^:[^\s]+:$/.test(possibleTags)) {
      rawTitle = rawTitle.substr(0, rawTitle.length - possibleTags.length);
      tags = possibleTags.split(':').filter((tag) => tag !== '');
    }
  }

  const title = parseMarkupAndCookies(rawTitle);

  return fromJS({ title, rawTitle, todoKeyword, tags });
};

export const newHeaderWithTitle = (line, nestingLevel, todoKeywordSets) => {
  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  const titleLine = parseTitleLine(line, todoKeywordSets);
  return fromJS({
    titleLine,
    rawDescription: '',
    description: [],
    opened: false,
    id: generateId(),
    nestingLevel,
    planningItems: [],
    propertyListItems: [],
    logNotes: [],
    logBookEntries: [],
  });
};

const concatRegexes = (...regexes) =>
  regexes.reduce((prev, curr) => RegExp(asStrNoSlashs(prev) + asStrNoSlashs(curr)));

// Converts RegExp or strings like '/regex/' to a string without these slashes.
const asStrNoSlashs = (regex) => {
  const s = regex.toString();
  return s.substring(1, s.length - 1);
};

export const newHeaderFromText = (rawText, todoKeywordSets) => {
  // This function is currently only used for capture templates.
  // Hence, it's acceptable that it is opinionated on treating
  // whitespace.
  const titleLine = rawText.split('\n')[0].replace(/^\**\s*|\s*$/g, '');
  const descriptionText = rawText.split('\n').slice(1).join('\n');

  // TODO: possible addition: allow subheaders in description!

  const newHeader = newHeaderWithTitle(titleLine, 1, todoKeywordSets);
  return _updateHeaderFromDescription(newHeader, descriptionText);
};

export const lineIsTodoKeywordConfig = (line) => {
  const lowerLine = line.toLowerCase();
  return (
    lowerLine.startsWith('#+todo: ') ||
    lowerLine.startsWith('#+typ_todo: ') ||
    lowerLine.startsWith('#+seq_todo: ')
  );
};

export const parseTodoKeywordConfig = (line) => {
  if (!lineIsTodoKeywordConfig(line)) {
    return null;
  }

  const keywordsString = line.substr(line.indexOf(':') + 2);
  const keywordTokens = keywordsString.split(/\s/);
  const keywords = keywordTokens
    .filter((keyword) => keyword !== '|')
    // Remove fast access TODO states suffix from keyword, because
    // there's no UI to handle those in organice
    // https://orgmode.org/manual/Fast-access-to-TODO-states.html#Fast-access-to-TODO-states
    .map((keyword) => keyword.replace(/\(.[!@]?(\/[!@])?\)$/, ''));

  const pipeIndex = keywordTokens.indexOf('|');
  const completedKeywords = pipeIndex >= 0 ? keywords.slice(pipeIndex) : [];

  return fromJS({
    keywords,
    completedKeywords,
    configLine: line,
    default: false,
  });
};

export const parseFileConfig = (lines) => {
  let todoKeywordSets = List();
  let fileConfigLines = List();

  lines.forEach((line) => {
    const newKeywordSet = parseTodoKeywordConfig(line);
    if (newKeywordSet) {
      todoKeywordSets = todoKeywordSets.push(newKeywordSet);
    } else if (line.startsWith('#+')) {
      fileConfigLines = fileConfigLines.push(line);
    }
  });

  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  return {
    todoKeywordSets,
    fileConfigLines,
  };
};

export const parseOrg = (fileContents) => {
  let headers = List();
  const lines = getLinesFromFileContents(fileContents);

  let linesBeforeHeadings = List();

  // This is the first pass over the whole file
  const { todoKeywordSets, fileConfigLines } = parseFileConfig(lines);

  // This is the second pass over the whole file
  lines.forEach((line) => {
    // A header has to start with at least one consecutive asterisk
    // followed by a blank
    if (line.match(/^\*+ /)) {
      const nestingLevel = computeNestingLevel(line);
      const title = line.substr(nestingLevel + 1);
      headers = headers.push(newHeaderWithTitle(title, nestingLevel, todoKeywordSets));
    } else if (headers.size === 0) {
      linesBeforeHeadings = linesBeforeHeadings.push(line);
    } else {
      headers = headers.updateIn([headers.size - 1, 'rawDescription'], (rawDescription) => {
        // In the beginning of the parseOrg function, the original
        // fileContent lines are split by '\n'. Therefore, the newline
        // has to be added again to the line:
        const lineToAdd = line + '\n';
        rawDescription = rawDescription ? rawDescription : '';
        return rawDescription + lineToAdd;
      });
    }
  });

  headers = headers.map((header) => {
    // Normally, rawDescription contains the "stripped" raw description text,
    // i.e. no log book, properties, or planning items.
    // In this case (parsing the complete org file), rawDescription contains
    // the full raw description text. Only after _updateHeaderFromDescription(),
    // the contents of rawDescription are correct.
    const description = header.get('rawDescription');
    return _updateHeaderFromDescription(header, description);
  });

  headers = updateHeadersTotalTimeLoggedRecursive(headers);
  const activeClocks = fromJS(headers).filter(hasActiveClock).size;

  return fromJS({
    headers,
    activeClocks,
    todoKeywordSets,
    fileConfigLines,
    linesBeforeHeadings,
  });
};

const extractActiveTimestampsForPlanningItemsFromParse = (type, parsedData) => {
  // planningItems only accept a single timestamp -> ignore second timestamp
  return parsedData
    .filter((x) => x.get('type') === 'timestamp' && x.getIn(['firstTimestamp', 'isActive']))
    .map((x) =>
      createOrUpdateTimestamp({ type: type, timestamp: x.get('firstTimestamp'), id: x.get('id') })
    );
};

// Merge planningItems from parsed title, description, and planning keywords.
const mergePlanningItems = (...planningItems) => {
  return planningItems[0].concat(...planningItems.slice(1));
};

export const updatePlanningItems = (planningItems, type, parsed) =>
  planningItems
    .filter((x) => x.get('type') !== type)
    .merge(extractActiveTimestampsForPlanningItemsFromParse(type, parsed));

export const updatePlanningItemsFromHeader = (header) => {
  let items = header.get('planningItems');
  items = updatePlanningItems(items, 'TIMESTAMP_TITLE', header.getIn(['titleLine', 'title']));
  items = updatePlanningItems(items, 'TIMESTAMP_DESCRIPTION', header.get('description'));
  items = updatePlanningItems(items, 'TIMESTAMP_LOG_NOTES', header.get('logNotes'));
  return items;
};

const computeNestingLevel = (titleLineWithAsterisk) => {
  const nestingLevel = titleLineWithAsterisk.indexOf(' ');
  if (nestingLevel === -1) return titleLineWithAsterisk.trimRight().length;
  return nestingLevel;
};

const getLinesFromFileContents = (fileContents) => {
  // We expect a newline at EOF (from the last line of fileContents).
  // After split(), this results in an empty string at the last position of the
  // array => Remove that last array item.
  const lines = fileContents.split('\n');

  // Special case when last line did not end with a newline character:
  if (lines.length > 0 && lines[lines.length - 1] !== '') return lines;

  return lines.slice(0, lines.length - 1);
};

const makeLogNotesResult = (logNotesLines, strippedDescriptionLines) => {
  const rawLogNotes = logNotesLines.join('\n');
  return {
    rawLogNotes: rawLogNotes,
    logNotes: parseRawText(rawLogNotes),
    strippedDescription: strippedDescriptionLines.join('\n'),
  };
};
