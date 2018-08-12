import _ from 'lodash';

const linkPartToRawText = linkPart => {
  if (!!linkPart.getIn(['contents', 'title'])) {
    return `[[${linkPart.getIn(['contents', 'uri'])}][${linkPart.getIn(['contents', 'title'])}]]`;
  } else {
    return `[[${linkPart.getIn(['contents', 'uri'])}]]`;
  }
};

const tablePartToRawText = tablePart => {
  const rowHeights = tablePart.get('contents').map(row => (
    Math.max(...row.get('contents').map(cell => (
      (_.countBy(cell.get('rawContents'))['\n'] || 0) + 1
    )))
  )).toJS();

  const numColumns = tablePart.getIn(['contents', 0, 'contents']).size;
  const columnWidths = _.times(numColumns).map(columnIndex => (
    Math.max(...tablePart.get('contents').map(row => (
      Math.max(
        ...row
          .getIn(['contents', columnIndex, 'rawContents'])
          .split('\n')
          .map(line => line.trim().length)
      )
    )))
  ));

  const rowStrings = _.dropRight(_.flatten(tablePart.get('contents').map((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];

    const contentRows = _.times(rowHeight).map(lineIndex => (
      row.get('contents').map((cell, columnIndex) => (
        cell
          .get('rawContents')
          .split('\n')[lineIndex]
          .trim()
          .padEnd(columnWidths[columnIndex], ' ')
      )).toJS().join('  | ')
    )).map(contentRow => `| ${contentRow}  |`);

    const separator = '|' + columnWidths.map(columnWidth => '-'.repeat(columnWidth + 3)).join('+') + '|';

    return contentRows.concat(separator);
  }).toJS()));

  return rowStrings.join('\n');
};

export const attributedStringToRawText = parts => {
  return parts.map(part => {
    switch (part.get('type')) {
    case 'text':
      return part.get('contents');
    case 'link':
      return linkPartToRawText(part);
    case 'table':
      return tablePartToRawText(part);
    default:
      return '';
    }
  }).join('');
};

export default (headers, todoKeywordSets) => {
  let configContent = '';
  if (!todoKeywordSets.get(0).get('default')) {
    configContent = todoKeywordSets.map(todoKeywordSet => {
      return todoKeywordSet.get('configLine');
    }).join('\n') + '\n\n';
  }

  const headerContent = headers.toJS().map(header => {
    let contents = '';
    contents += '*'.repeat(header.nestingLevel);

    if (header.titleLine.todoKeyword) {
      contents += ` ${header.titleLine.todoKeyword}`;
    }
    contents += ` ${header.titleLine.rawTitle}`;

    if (header.titleLine.tags.length > 0) {
      contents += ` :${header.titleLine.tags.join(':')}:`;
    }

    if (header.description) {
      if (!header.rawDescription.startsWith('\n') && header.rawDescription.length !== 0) {
        contents += '\n';
      }
      contents += header.rawDescription;
    }

    return contents;
  }).join('\n');

  return configContent + headerContent;
};
