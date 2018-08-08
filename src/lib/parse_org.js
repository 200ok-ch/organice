import Immutable from 'immutable';

export const getNextId = (() => {
  let nextId = 0;
  return () => nextId++;
})();

// Accepts a raw string description and returns a list of objects representing it.
export const parseLinks = (description) => {
  // Match strings containing either [[uri]] or [[uri][title]].
  const linkRegex = /(\[\[([^\]]*)\]\]|\[\[([^\]]*)\]\[([^\]]*)\]\])/g;
  let matches = [];
  let match = linkRegex.exec(description);
  while (match) {
    if (match[2]) {
      matches.push({
        rawText: match[0],
        uri: match[2],
        index: match.index
      });
    } else {
      matches.push({
        rawText: match[0],
        uri: match[3],
        title: match[4],
        index: match.index
      });
    }
    match = linkRegex.exec(description);
  }

  let descriptionParts = [];
  let startIndex = 0;
  matches.forEach(match => {
    let index = match.index;

    // Add the text part before this link if necessary
    if (index !== startIndex) {
      const text = description.substring(startIndex, index);
      descriptionParts.push({
        type: 'text',
        contents: text
      });
    }

    // Add the link part.
    let linkPart = {
      type: 'link',
      contents: {
        uri: match.uri
      }
    };
    if (match.title) {
      linkPart.contents.title = match.title;
    }
    descriptionParts.push(linkPart);

    // Adjust the start index.
    startIndex = match.index + match.rawText.length;
  });

  // Add on any trailing text if necessary.
  if (startIndex !== description.length) {
    const text = description.substring(startIndex, description.length);
    descriptionParts.push({
      type: 'text',
      contents: text
    });
  }

  return Immutable.fromJS(descriptionParts);
};

const defaultKeywordSets = Immutable.fromJS([{
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

  const title = parseLinks(rawTitle);

  return Immutable.fromJS({ title, rawTitle, todoKeyword, tags });
};

export const newHeaderWithTitle = (line, nestingLevel, todoKeywordSets) => {
  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  const titleLine = parseTitleLine(line, todoKeywordSets);
  return Immutable.fromJS({
    titleLine,
    rawDescription: '',
    description: [],
    opened: false,
    id: getNextId(),
    nestingLevel
  });
};

export const parseOrg = (fileContents) => {
  let headers = new Immutable.List();
  const lines = fileContents.split('\n');

  let todoKeywordSets = new Immutable.List();

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
          todoKeywordSets = todoKeywordSets.push(Immutable.fromJS({
            keywords,
            configLine: line,
            default: false
          }));
        }
      } else {
        headers = headers.updateIn([headers.size - 1, 'rawDescription'],
                                   rawDescription => rawDescription + '\n' + line);
      }
    }
  });

  if (todoKeywordSets.size === 0) {
    todoKeywordSets = defaultKeywordSets;
  }

  headers = headers.map(header => {
    return header.set('description', parseLinks(header.get('rawDescription')));
  });

  return Immutable.fromJS({
    headers, todoKeywordSets
  });
};
