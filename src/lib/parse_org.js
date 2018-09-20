import generateId from './id_generator';

import { fromJS, List } from 'immutable';
import _ from 'lodash';

export const parseMarkupAndCookies = (
  rawText,
  { shouldAppendNewline = false, excludeCookies = true } = {}
) => {
  // Yeah, this thing is pretty wild. I use https://www.debuggex.com/ to edit it, then paste the results in here.
  // But fixing this mess is on my todo list...
  const markupAndCookieRegex = /(\[\[([^\]]*)\]\]|\[\[([^\]]*)\]\[([^\]]*)\]\])|(\[((\d*%)|(\d*\/\d*))\])|(([\s({'"]?)([*/~=_+])([^\s,'](.*)[^\s,'])\11([\s\-.,:!?'")}]?))|(([<[])(\d{4})-(\d{2})-(\d{2})(?: (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?: ([01]?\d:[0-5]\d))?(?:-([01]?\d:[0-5]\d))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?[>\]](?:--([<[])(\d{4})-(\d{2})-(\d{2})(?: (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?: ([01]?\d:[0-5]\d))?(?:-([01]?\d:[0-5]\d))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?(?: ((?:\+)|(?:\+\+)|(?:\.\+)|(?:-)|(?:--))(\d+)(h|d|w|m|y))?[>\]])?)/g;
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
      const markupSuffixLength = match[14].length;
      const rawText = match[0];

      matches.push({
        type: 'inline-markup',
        rawText: rawText.substring(
          markupPrefixLength,
          rawText.length - markupPrefixLength - markupSuffixLength + 1
        ),
        index: match.index + markupPrefixLength,
        content: match[12],
        markupType,
      });
    } else if (!!match[15]) {
      const [firstTimestamp, secondTimestamp] = [_.range(16, 29), _.range(29, 42)].map(
        partIndices => {
          // eslint-disable-line no-loop-func
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
        }
      );

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

  tableLines.map(line => line.trim()).forEach(line => {
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
        .map(
          line =>
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
  });
};

export const newHeaderFromText = (rawText, todoKeywordSets) => {
  const titleLine = rawText.split('\n')[0].replace(/^\**\s*/, '');
  const description = rawText
    .split('\n')
    .slice(1)
    .join('\n');

  return newHeaderWithTitle(titleLine, 1, todoKeywordSets)
    .set('rawDescription', description)
    .set('description', parseRawText(description));
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
        headers = headers.updateIn(
          [headers.size - 1, 'rawDescription'],
          rawDescription => (rawDescription.length === 0 ? line : rawDescription + '\n' + line)
        );
      }
    }
  });

  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  headers = headers.map(header => {
    return header.set('description', parseRawText(header.get('rawDescription')));
  });

  return fromJS({
    headers,
    todoKeywordSets,
  });
};
