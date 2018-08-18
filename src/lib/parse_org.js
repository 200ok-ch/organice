import { fromJS, List } from 'immutable';
import _ from 'lodash';

export const getNextId = (() => {
  let nextId = 0;
  return () => nextId++;
})();

export const parseLinks = (rawText, { shouldAppendNewline = false } = {}) => {
  const linkRegex = /(\[\[([^\]]*)\]\]|\[\[([^\]]*)\]\[([^\]]*)\]\])/g;
  const matches = [];
  let match = linkRegex.exec(rawText);
  while (match) {
    if (match[2]) {
      matches.push({
        rawText: match[0],
        uri: match[2],
        index: match.index,
      });
    } else {
      matches.push({
        rawText: match[0],
        uri: match[3],
        title: match[4],
        index: match.index,
      });
    }
    match = linkRegex.exec(rawText);
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

    const linkPart = {
      type: 'link',
      contents: {
        uri: match.uri,
      },
    };
    if (match.title) {
      linkPart.contents.title = match.title;
    }
    lineParts.push(linkPart);

    startIndex = match.index + match.rawText.length;
  });

  if (startIndex !== rawText.length || shouldAppendNewline) {
    const trailingText = rawText.substring(startIndex, rawText.length) + (shouldAppendNewline ? '\n' : '');
    lineParts.push({
      type: 'text',
      contents: trailingText,
    });
  }

  return lineParts;
};

const parseTable = tableLines => {
  const table = {
    id: getNextId(),
    type: 'table',
    contents: [
      []
    ],
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
    id: getNextId(),
    contents: row.map(rawContents => ({
      id: getNextId(),
      contents: parseLinks(rawContents),
      rawContents,
    }))
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
          id: getNextId(),
          contents: [],
          rawContents: '',
        });
      });
    }
  });

  return table;
};

export const parseRawText = (rawText, { excludeTables = false } = {}) => {
  const lines = rawText.split('\n');
  const rawLineParts = _.flatten(lines.map((line, lineIndex) => {
    if (line.trim().startsWith('|')) {
      return [{
        type: 'raw-table', line,
      }];
    } else {
      return parseLinks(line, { shouldAppendNewline: lineIndex !== lines.length - 1 });
    }
  }));

  const processedLineParts = [];
  for (let partIndex = 0; partIndex < rawLineParts.length; ++partIndex) {
    const linePart = rawLineParts[partIndex];
    if (linePart.type === 'raw-table') {
      const tableLines = _.takeWhile(rawLineParts.slice(partIndex), part => (
        part.type === 'raw-table'
      )).map(part => part.line);

      processedLineParts.push(parseTable(tableLines));

      partIndex += tableLines.length - 1;
    } else {
      processedLineParts.push(linePart);
    }
  }

  return fromJS(processedLineParts);
};

const defaultKeywordSets = fromJS([{
  keywords: ['TODO', 'DONE'],
  default: true
}]);

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

  const title = parseRawText(rawTitle, { excludeTables: true });

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
    id: getNextId(),
    nestingLevel
  });
};

export const newHeaderFromText = (rawText, todoKeywordSets) => {
  const titleLine = rawText.split('\n')[0].replace(/^\**\s*/, '');
  const description = rawText.split('\n').slice(1).join('\n');

  return newHeaderWithTitle(titleLine, 1, todoKeywordSets)
    .set('rawDescription', description)
    .set('description', parseRawText(description));
};

export const parseOrg = (fileContents) => {
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
          const keywordStrings = keywordsString.split(/\s/).filter(keyword => {
            return keyword !== '|';
          });
          const keywords = keywordStrings.map(keywordString => {
            const todoRegex = /([^(]*)(\(.*\))?/g;
            const match = todoRegex.exec(keywordString);
            const keyword = match[1];

            return keyword;
          });
          todoKeywordSets = todoKeywordSets.push(fromJS({
            keywords,
            configLine: line,
            default: false
          }));
        }
      } else {
        headers = headers.updateIn([headers.size - 1, 'rawDescription'], rawDescription => (
          rawDescription.length === 0 ? line : rawDescription + '\n' + line
        ));
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
    headers, todoKeywordSets
  });
};
