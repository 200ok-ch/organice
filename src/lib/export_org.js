import _ from 'lodash';
import { fromJS } from 'immutable';

import { renderAsText } from './timestamps';

const linkPartToRawText = linkPart => {
  if (!!linkPart.getIn(['contents', 'title'])) {
    return `[[${linkPart.getIn(['contents', 'uri'])}][${linkPart.getIn(['contents', 'title'])}]]`;
  } else {
    return `[[${linkPart.getIn(['contents', 'uri'])}]]`;
  }
};

const formattedAttributedStringText = parts => {
  return parts
    .map(part => {
      switch (part.get('type')) {
        case 'text':
          return part.get('contents');
        case 'link':
          if (part.getIn(['contents', 'title'])) {
            return part.getIn(['contents', 'title']);
          } else {
            return part.getIn(['contents', 'uri']);
          }
        case 'table':
          return '';
        default:
          return '';
      }
    })
    .join('');
};

const tablePartToRawText = tablePart => {
  const rowHeights = tablePart
    .get('contents')
    .map(row =>
      Math.max(
        ...row.get('contents').map(cell => (_.countBy(cell.get('rawContents'))['\n'] || 0) + 1)
      )
    )
    .toJS();

  const numColumns = tablePart.getIn(['contents', 0, 'contents']).size;
  const columnWidths = _.times(numColumns).map(columnIndex =>
    Math.max(
      ...tablePart.get('contents').map(row => {
        const content = row.getIn(['contents', columnIndex, 'contents']);
        const formattedText = formattedAttributedStringText(content);
        const lineLengths = formattedText.split('\n').map(line => line.trim().length);
        return Math.max(...lineLengths);
      })
    )
  );

  const rowStrings = _.dropRight(
    _.flatten(
      tablePart
        .get('contents')
        .map((row, rowIndex) => {
          const rowHeight = rowHeights[rowIndex];

          const contentRows = _.times(rowHeight)
            .map(lineIndex =>
              row
                .get('contents')
                .map((cell, columnIndex) => {
                  const content = cell.get('contents');
                  const formattedText = formattedAttributedStringText(content);
                  const formattedLineLengths = formattedText
                    .split('\n')
                    .map(line => line.trim().length);
                  const line = (cell.get('rawContents').split('\n')[lineIndex] || '').trim();

                  const padCount = columnWidths[columnIndex] - formattedLineLengths[lineIndex];

                  return line + ' '.repeat(padCount);
                })
                .toJS()
                .join(' | ')
            )
            .map(contentRow => `| ${contentRow} |`);

          const separator =
            '|' + columnWidths.map(columnWidth => '-'.repeat(columnWidth + 2)).join('+') + '|';

          return contentRows.concat(separator);
        })
        .toJS()
    )
  );

  return rowStrings.join('\n');
};

const listPartToRawText = listPart => {
  const bulletCharacter = listPart.get('bulletCharacter');

  let previousNumber = 0;
  return listPart
    .get('items')
    .map(item => {
      const optionalLeadingSpace = !listPart.get('isOrdered') && bulletCharacter === '*' ? ' ' : '';

      const titleText = attributedStringToRawText(item.get('titleLine'));

      const contentText = attributedStringToRawText(item.get('contents'));
      const indentedContentText = contentText
        .split('\n')
        .map(line => (!!line.trim() ? `${optionalLeadingSpace}  ${line}` : ''))
        .join('\n');

      let listItemText = null;
      if (listPart.get('isOrdered')) {
        let number = ++previousNumber;
        let forceNumber = item.get('forceNumber');
        if (!!forceNumber) {
          number = forceNumber;
          previousNumber = number;
        }

        listItemText = `${number}${listPart.get('numberTerminatorCharacter')}`;

        if (!!forceNumber) {
          listItemText += ` [@${forceNumber}]`;
        }

        if (item.get('isCheckbox')) {
          const stateCharacter = {
            checked: 'X',
            unchecked: ' ',
            partial: '-',
          }[item.get('checkboxState')];

          listItemText += ` [${stateCharacter}]`;
        }

        listItemText += ` ${titleText}`;
      } else {
        listItemText = `${optionalLeadingSpace}${bulletCharacter}`;

        if (item.get('isCheckbox')) {
          const stateCharacter = {
            checked: 'X',
            unchecked: ' ',
            partial: '-',
          }[item.get('checkboxState')];

          listItemText += ` [${stateCharacter}]`;
        }

        listItemText += ` ${titleText}`;
      }

      if (!!contentText) {
        listItemText += `\n${indentedContentText}`;
      }

      return listItemText;
    })
    .join('\n');
};

const timestampPartToRawText = part => {
  let text = renderAsText(part.get('firstTimestamp'));
  if (part.get('secondTimestamp')) {
    text += `--${renderAsText(part.get('secondTimestamp'))}`;
  }

  return text;
};

export const attributedStringToRawText = parts => {
  if (!parts) {
    return '';
  }

  const prevPartTypes = parts.map(part => part.get('type')).unshift(null);

  return parts
    .zip(prevPartTypes)
    .map(([part, prevPartType]) => {
      let text = '';
      switch (part.get('type')) {
        case 'text':
          text = part.get('contents');
          break;
        case 'link':
          text = linkPartToRawText(part);
          break;
        case 'fraction-cookie':
          text = `[${part.getIn(['fraction', 0]) || ''}/${part.getIn(['fraction', 1]) || ''}]`;
          break;
        case 'percentage-cookie':
          text = `[${part.get('percentage') || ''}%]`;
          break;
        case 'table':
          text = tablePartToRawText(part);
          break;
        case 'list':
          text = listPartToRawText(part);
          break;
        case 'timestamp':
          text = timestampPartToRawText(part);
          break;
        default:
          console.error(
            `Unknown attributed string part type in attributedStringToRawText: ${part.get('type')}`
          );
      }

      const optionalNewlinePrefix = ['list', 'table'].includes(prevPartType) ? '\n' : '';
      return optionalNewlinePrefix + text;
    })
    .join('');
};

export default (headers, todoKeywordSets) => {
  let configContent = '';
  if (!todoKeywordSets.get(0).get('default')) {
    configContent =
      todoKeywordSets
        .map(todoKeywordSet => {
          return todoKeywordSet.get('configLine');
        })
        .join('\n') + '\n\n';
  }

  const headerContent = headers
    .toJS()
    .map(header => {
      let contents = '';
      contents += '*'.repeat(header.nestingLevel);

      if (header.titleLine.todoKeyword) {
        contents += ` ${header.titleLine.todoKeyword}`;
      }
      contents += ` ${header.titleLine.rawTitle}`;

      if (header.titleLine.tags.length > 0) {
        contents += ` :${header.titleLine.tags.filter(tag => !!tag).join(':')}:`;
      }

      if (header.planningItems.length) {
        const planningItemsContent = header.planningItems.map(planningItem => {
          return `${planningItem.type}: ${renderAsText(fromJS(planningItem.timestamp))}`
        }).join(' ').trimRight();
        contents += `\n  ${planningItemsContent}`;
      }

      if (header.propertyListItems.length > 0) {
        contents += '\n:PROPERTIES:';
        header.propertyListItems.forEach(propertyListItem => {
          contents += `\n:${propertyListItem.property}: ${attributedStringToRawText(
            fromJS(propertyListItem.value)
          )}`;
        });
        contents += '\n:END:\n';
      }

      if (header.description) {
        if (!header.rawDescription.startsWith('\n') && header.rawDescription.length !== 0) {
          contents += '\n';
        }
        contents += header.rawDescription;
      }

      return contents;
    })
    .join('\n');

  return configContent + headerContent;
};
