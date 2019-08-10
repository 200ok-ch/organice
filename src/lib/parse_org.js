import generateId from './id_generator';

import { fromJS, List } from 'immutable';
import _ from 'lodash';

// Yeah, this thing is pretty wild. I use https://www.debuggex.com/ to edit it, then paste the results in here.
// But fixing this mess is on my todo list...
const markupAndCookieRegex = /(\[\[([^\]]*)\]\]|\[\[([^\]]*)\]\[([^\]]*)\]\])|(\[((\d*%)|(\d*\/\d*))\])|(([\s({'"]?)([*/~=_+])([^\s,'](.*)[^\s,'])\11([\s\-.,:!?'")}]?))|(([<[])(\d{4})-(\d{2})-(\d{2})(?: (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?: ([012]?\d:[0-5]\d))?(?:-([012]?\d:[0-5]\d))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?[>\]](?:--([<[])(\d{4})-(\d{2})-(\d{2})(?: (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?: ([012]?\d:[0-5]\d))?(?:-([012]?\d:[0-5]\d))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?[>\]])?)/g;
const timestampRegex = /([<[])(\d{4})-(\d{2})-(\d{2})(?: (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?: ([012]?\d:[0-5]\d))?(?:-([012]?\d:[0-5]\d))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?[>\]]/;

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
    secondDelayRepeatType,
    secondDelayRepeatValue,
    secondDelayRepeatUnit,
  ] = partIndices.map(partIndex => match[partIndex]);

  if (!year) {
    return null;
  }

  const [startHour, startMinute] = !!timeStart ? timeStart.split(':') : [];
  const [endHour, endMinute] = !!timeEnd ? timeEnd.split(':') : [];

  let repeaterType, repeaterValue, repeaterUnit;
  let delayType, delayValue, delayUnit;

  if (['+', '++', '.+'].includes(firstDelayRepeatType)) {
    repeaterType = firstDelayRepeatType;
    repeaterValue = firstDelayRepeatValue;
    repeaterUnit = firstDelayRepeatUnit;
  } else if (['-', '--'].includes(firstDelayRepeatType)) {
    delayType = firstDelayRepeatType;
    delayValue = firstDelayRepeatValue;
    delayUnit = firstDelayRepeatUnit;
  }
  if (['+', '++', '.+'].includes(secondDelayRepeatType)) {
    repeaterType = secondDelayRepeatType;
    repeaterValue = secondDelayRepeatValue;
    repeaterUnit = secondDelayRepeatUnit;
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
  };
};

export const parseMarkupAndCookies = (
  rawText,
  { shouldAppendNewline = false, excludeCookies = true } = {}
) => {
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
      const firstTimestamp = timestampFromRegexMatch(match, _.range(16, 29));
      const secondTimestamp = timestampFromRegexMatch(match, _.range(29, 42));

      matches.push({
        type: 'timestamp',
        rawText: match[0],
        index: match.index,
        firstTimestamp,
        secondTimestamp,
      });
    }
    match = markupAndCookieRegex.exec(rawText);
  }

  const lineParts = [];
  let startIndex = 0;
  matches.forEach(match => {
    let index = match.index;

    if (index !== startIndex) {
      const text = rawText.substring(startIndex, index);
      lineParts.push({
        type: 'text',
        contents: text,
      });
    }

    if (match.type === 'link') {
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
      lineParts.push(linkPart);
    } else if (match.type === 'percentage-cookie') {
      lineParts.push({
        id: generateId(),
        type: 'percentage-cookie',
        percentage: match.percentage,
      });
    } else if (match.type === 'fraction-cookie') {
      lineParts.push({
        id: generateId(),
        type: 'fraction-cookie',
        fraction: match.fraction,
      });
    } else if (match.type === 'inline-markup') {
      lineParts.push({
        id: generateId(),
        type: 'inline-markup',
        content: match.content,
        markupType: match.markupType,
      });
    } else if (match.type === 'timestamp') {
      lineParts.push({
        id: generateId(),
        type: 'timestamp',
        firstTimestamp: match.firstTimestamp,
        secondTimestamp: match.secondTimestamp,
      });
    }

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

const parseTable = tableLines => {
  const table = {
    id: generateId(),
    type: 'table',
    contents: [[]],
    columnProperties: [],
  };

  tableLines
    .map(line => line.trim())
    .forEach(line => {
      if (line.startsWith('|-')) {
        table.contents.push([]);
      } else {
        const lastRow = _.last(table.contents);
        const lineCells = line.substr(1, line.length - 2).split('|');

        if (lastRow.length === 0) {
          lineCells.forEach(cell => lastRow.push(cell));
        } else {
          lineCells.forEach((cellContents, cellIndex) => {
            lastRow[cellIndex] += `\n${cellContents}`;
          });
        }
      }
    });

  // Parse the contents of each cell.
  table.contents = table.contents.map(row => ({
    id: generateId(),
    contents: row.map(rawContents => ({
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
  const maxNumColumns = Math.max(...table.contents.map(row => row.contents.length));
  table.contents.forEach(row => {
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

        if (!!line.match(LIST_HEADER_REGEX) && !excludeContentElements) {
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
        part => part.type === 'raw-table'
      ).map(part => part.line);

      processedLineParts.push(parseTable(tableLines));

      partIndex += tableLines.length - 1;
    } else if (linePart.type === 'raw-list-header') {
      const numLeadingSpaces = linePart.line.match(/^( *)/)[0].length;
      const contentLines = _.takeWhile(
        rawLineParts.slice(partIndex + 1),
        part => part.type === 'raw-list-content'
      )
        .map(part => part.line)
        .map(line =>
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

export const _parsePlanningItems = rawText => {
  const singlePlanningItemRegex = concatRegexes(/(DEADLINE|SCHEDULED|CLOSED):\s*/, timestampRegex);
  const optionalSinglePlanningItemRegex = RegExp(
    '(' +
      singlePlanningItemRegex
        .toString()
        .substring(1, singlePlanningItemRegex.toString().length - 1) +
      ')?'
  );

  // FIXME: The whitespace part of the regex matches `rawText` inputs
  //        like " - indented list\n - Foo".
  //        This is a mistake, because the input isn't really a
  //        planning item. If the regexp could be adapted, we could
  //        return earlier after the regexp check.
  //        Before this can get cleaned up, this function needs loads
  //        more tests, because currently it matches too many things.
  //        It does work well for planning items, though.
  const planningRegex = concatRegexes(
    /^\s*/,
    optionalSinglePlanningItemRegex,
    /\s*/,
    optionalSinglePlanningItemRegex,
    /\s*/,
    optionalSinglePlanningItemRegex,
    /\s*/
  );
  const planningMatch = rawText.match(planningRegex);

  const planningItems = fromJS(
    [2, 17, 32]
      .map(planningTypeIndex => {
        const type = planningMatch[planningTypeIndex];
        if (!type) {
          return null;
        }

        const timestamp = timestampFromRegexMatch(
          planningMatch,
          _.range(planningTypeIndex + 1, planningTypeIndex + 1 + 13)
        );

        return { type, timestamp, id: generateId() };
      })
      .filter(item => !!item)
  );

  if (planningItems.size > 0) {
    // The `rawText` can look like:
    // `SCHEDULED: <2019-07-30 Tue>
    //   - indented list
    //      - Foo`
    // For the remaining description, filter the planning item out
    const remainingDescriptionWithoutPlanningItem = rawText
      .split('\n')
      .filter(line => {
        return !line.includes(planningMatch[0].trim());
      })
      .join('\n');
    return { planningItems, strippedDescription: remainingDescriptionWithoutPlanningItem };
  } else {
    return { planningItems: fromJS([]), strippedDescription: rawText };
  }
};

const parsePropertyList = rawText => {
  const lines = rawText.split('\n');
  const propertiesLineIndex = lines.findIndex(line => line.trim() === ':PROPERTIES:');
  const endLineIndex = lines.findIndex(line => line.trim() === ':END:');

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
      .map(line => {
        const match = line.match(/:([^\s]*):(?: (.*))?/);
        if (!match) {
          return null;
        }

        const value = !!match[2] ? parseMarkupAndCookies(match[2]) : null;

        return {
          property: match[1],
          value,
          id: generateId(),
        };
      })
      .filter(result => !!result)
  );

  return {
    propertyListItems,
    strippedDescription: lines.slice(endLineIndex + 1).join('\n'),
  };
};

export const parseDescriptionPrefixElements = rawText => {
  const planningItemsParse = _parsePlanningItems(rawText);
  const propertyListParse = parsePropertyList(planningItemsParse.strippedDescription);

  return {
    planningItems: planningItemsParse.planningItems,
    propertyListItems: propertyListParse.propertyListItems,
    strippedDescription: propertyListParse.strippedDescription,
  };
};

const defaultKeywordSets = fromJS([
  {
    keywords: ['TODO', 'DONE'],
    completedKeywords: ['DONE'],
    default: true,
  },
]);

export const parseTitleLine = (titleLine, todoKeywordSets) => {
  const allKeywords = todoKeywordSets.flatMap(todoKeywordSet => {
    return todoKeywordSet.get('keywords');
  });
  const todoKeyword = allKeywords.filter(keyword => titleLine.startsWith(keyword + ' ')).first();
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
      tags = possibleTags.split(':').filter(tag => tag !== '');
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
  });
};

const concatRegexes = (...regexes) =>
  regexes.reduce((prev, curr) =>
    RegExp(
      prev.toString().substring(1, prev.toString().length - 1) +
        curr.toString().substring(1, curr.toString().length - 1)
    )
  );

export const newHeaderFromText = (rawText, todoKeywordSets) => {
  const titleLine = rawText.split('\n')[0].replace(/^\**\s*/, '');
  const description = rawText
    .split('\n')
    .slice(1)
    .join('\n');

  const { planningItems, propertyListItems, strippedDescription } = parseDescriptionPrefixElements(
    description
  );

  return newHeaderWithTitle(titleLine, 1, todoKeywordSets)
    .set('rawDescription', strippedDescription)
    .set('description', parseRawText(strippedDescription))
    .set('planningItems', planningItems)
    .set('propertyListItems', propertyListItems);
};

export const parseOrg = fileContents => {
  let headers = new List();
  const lines = fileContents.split('\n');

  let todoKeywordSets = new List();

  lines.forEach(line => {
    if (line.startsWith('*')) {
      let nestingLevel = line.indexOf(' ');
      if (nestingLevel === -1) {
        nestingLevel = line.length;
      }
      const title = line.substr(nestingLevel + 1);
      headers = headers.push(newHeaderWithTitle(title, nestingLevel, todoKeywordSets));
    } else {
      if (headers.size === 0) {
        if (line.startsWith('#+TODO: ') || line.startsWith('#+TYP_TODO: ')) {
          const keywordsString = line.substr(line.indexOf(':') + 2);
          const keywordTokens = keywordsString.split(/\s/);
          const keywords = keywordTokens.filter(keyword => keyword !== '|');

          const pipeIndex = keywordTokens.indexOf('|');
          const completedKeywords = pipeIndex >= 0 ? keywords.slice(pipeIndex) : [];

          todoKeywordSets = todoKeywordSets.push(
            fromJS({
              keywords,
              completedKeywords,
              configLine: line,
              default: false,
            })
          );
        }
      } else {
        headers = headers.updateIn([headers.size - 1, 'rawDescription'], rawDescription =>
          rawDescription.length === 0 ? line : rawDescription + '\n' + line
        );
      }
    }
  });

  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  headers = headers.map(header => {
    const {
      planningItems,
      propertyListItems,
      strippedDescription,
    } = parseDescriptionPrefixElements(header.get('rawDescription'));

    return header
      .set('rawDescription', strippedDescription)
      .set('description', parseRawText(strippedDescription))
      .set('planningItems', planningItems)
      .set('propertyListItems', propertyListItems);
  });

  return fromJS({
    headers,
    todoKeywordSets,
  });
};
