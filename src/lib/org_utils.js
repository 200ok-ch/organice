import { List, fromJS } from 'immutable';
import _ from 'lodash';
import raw from 'raw.macro';
import { formatDistanceToNow } from 'date-fns';

import generateId from './id_generator';
import { attributedStringToRawText } from './export_org';
import substituteTemplateVariables from './capture_template_substitution';

function generateHash(list) {
  return new Promise((resolve, reject) => {
    crypto.subtle
      .digest(
        {
          name: 'SHA-256',
        },
        new Uint8Array(list)
      )
      .then((hashArray) => {
        resolve(_.values(new Uint8Array(hashArray)).join(''));
      });
  });
}

export const changelogHash = () => {
  return new Promise((resolve, reject) => {
    const changelogFile = raw('../../changelog.org');

    generateHash(changelogFile.split('').map((c) => c.charCodeAt(0))).then((hash) => {
      resolve(hash);
    });
  });
};

export const indexAndHeaderWithId = (headers, headerId) => {
  const headerIndex = indexOfHeaderWithId(headers, headerId);
  return { headerIndex, header: headers.get(headerIndex) };
};

export const indexOfHeaderWithId = (headers, headerId) => {
  return headers.findIndex((header) => header.get('id') === headerId);
};

export const headerWithId = (headers, headerId) => {
  return headers.get(indexOfHeaderWithId(headers, headerId));
};

export const subheadersOfHeaderWithId = (headers, headerId) => {
  const { header, headerIndex } = indexAndHeaderWithId(headers, headerId);

  const afterHeaders = headers.slice(headerIndex + 1);
  const nextSiblingHeaderIndex = afterHeaders.findIndex((siblingHeader) => {
    return siblingHeader.get('nestingLevel') <= header.get('nestingLevel');
  });

  if (nextSiblingHeaderIndex === -1) {
    return afterHeaders;
  } else {
    return afterHeaders.slice(0, nextSiblingHeaderIndex);
  }
};

export const numSubheadersOfHeaderWithId = (headers, headerId) =>
  subheadersOfHeaderWithId(headers, headerId).size;

export const directParentIdOfHeaderWithId = (headers, headerId) => {
  const { header, headerIndex } = indexAndHeaderWithId(headers, headerId);

  for (let i = headerIndex - 1; i >= 0; --i) {
    const previousHeader = headers.get(i);

    if (previousHeader.get('nestingLevel') === header.get('nestingLevel') - 1) {
      return previousHeader.get('id');
    }

    if (previousHeader.get('nestingLevel') < header.get('nestingLevel')) {
      return null;
    }
  }

  return null;
};

export const parentIdOfHeaderWithId = (headers, headerId) => {
  const { header, headerIndex } = indexAndHeaderWithId(headers, headerId);

  const previousHeaders = headers.slice(0, headerIndex);
  const parentHeader = previousHeaders.findLast(
    (previousHeader) => previousHeader.get('nestingLevel') < header.get('nestingLevel')
  );

  if (!parentHeader) {
    return null;
  }

  return parentHeader.get('id');
};

export const inheritedValueOfProperty = (headers, headerIndex, property) => {
  const headerProp = headers
    .getIn([headerIndex, 'propertyListItems'])
    .find((item) => item.get('property') === property);
  if (headerProp) {
    return headerProp.get('value');
  }
  const parentId = parentIdOfHeaderWithId(headers, headers.getIn([headerIndex, 'id']));
  if (parentId) {
    const parentHeaderIndex = indexOfHeaderWithId(headers, parentId);
    return inheritedValueOfProperty(headers, parentHeaderIndex, property);
  }
  return null;
};

export const indexOfPreviousSibling = (headers, headerIndex) => {
  const nestingLevel = headers.getIn([headerIndex, 'nestingLevel']);

  for (let i = headerIndex - 1; i >= 0; --i) {
    const header = headers.get(i);

    if (header.get('nestingLevel') < nestingLevel) {
      return null;
    }

    if (header.get('nestingLevel') === nestingLevel) {
      return i;
    }
  }

  return null;
};

const isHeaderVisible = (headers, headerId) => {
  const parentHeaderId = parentIdOfHeaderWithId(headers, headerId);
  if (!parentHeaderId) {
    return true;
  }

  const parentHeader = headerWithId(headers, parentHeaderId);
  return parentHeader.get('opened') && isHeaderVisible(headers, parentHeader.get('id'));
};

export const nextVisibleHeaderAfterIndex = (headers, headerIndex) => {
  const followingHeaders = headers.slice(headerIndex + 1);
  return followingHeaders.find((header) => isHeaderVisible(headers, header.get('id')));
};

export const previousVisibleHeaderAfterIndex = (headers, headerIndex) => {
  const previousHeaders = headers.slice(0, headerIndex).reverse();
  return previousHeaders.find((header) => isHeaderVisible(headers, header.get('id')));
};

export const openDirectParent = (state, headerId) => {
  const parentHeaderId = directParentIdOfHeaderWithId(state.get('headers'), headerId);
  if (parentHeaderId !== null) {
    const parentHeaderIndex = indexOfHeaderWithId(state.get('headers'), parentHeaderId);
    state = state.setIn(['headers', parentHeaderIndex, 'opened'], true);
  }

  return state;
};

export const getOpenHeaderPaths = (headers) => {
  let openedHeaders = [];
  for (let i = 0; i < headers.size; ++i) {
    const header = headers.get(i);
    if (!header.get('opened')) {
      continue;
    }

    const title = header.getIn(['titleLine', 'rawTitle']);

    const subheaders = subheadersOfHeaderWithId(headers, header.get('id'));
    const openSubheaderPaths = getOpenHeaderPaths(subheaders);

    if (openSubheaderPaths.length > 0) {
      openSubheaderPaths.forEach((openedSubheaderPath) => {
        openedHeaders.push([title].concat(openedSubheaderPath));
      });
    } else {
      openedHeaders.push([title]);
    }

    i += subheaders.size;
  }

  return openedHeaders;
};

export const headerWithPath = (headers, headerPath) => {
  if (headerPath.size === 0) {
    return null;
  }

  const firstHeader = headers.find(
    (header) =>
      parentIdOfHeaderWithId(headers, header.get('id')) === null &&
      header.getIn(['titleLine', 'rawTitle']).trim() === substituteTemplateVariables(headerPath.first())[0].trim()
  );
  if (!firstHeader) {
    return null;
  }

  if (headerPath.size === 1) {
    return firstHeader;
  }

  const subheaders = subheadersOfHeaderWithId(headers, firstHeader.get('id'));
  return headerWithPath(subheaders, headerPath.rest());
};

export const openHeaderWithPath = (headers, headerPath, maxNestingLevel = 1) => {
  if (headerPath.size === 0) {
    return headers;
  }

  const firstTitle = headerPath.first();
  const headerIndex = headers.findIndex((header) => {
    const rawTitle = header.getIn(['titleLine', 'rawTitle']);
    const nestingLevel = header.get('nestingLevel');
    return rawTitle === firstTitle && nestingLevel <= maxNestingLevel;
  });
  if (headerIndex === -1) {
    return headers;
  }

  headers = headers.update(headerIndex, (header) => header.set('opened', true));

  let subheaders = subheadersOfHeaderWithId(headers, headers.getIn([headerIndex, 'id']));
  subheaders = openHeaderWithPath(subheaders, headerPath.rest(), maxNestingLevel + 1);

  headers = headers
    .take(headerIndex + 1)
    .concat(subheaders)
    .concat(headers.takeLast(headers.size - (headerIndex + 1 + subheaders.size)));

  return headers;
};

const tablePartContainsCellId = (tablePart, cellId) =>
  tablePart
    .get('contents')
    .some((row) => row.get('contents').some((cell) => cell.get('id') === cellId));

const doesAttributedStringContainTableCellId = (parts, cellId) =>
  parts
    .filter((part) => ['table', 'list'].includes(part.get('type')))
    .some((part) =>
      part.get('type') === 'table'
        ? tablePartContainsCellId(part, cellId)
        : part
            .get('items')
            .some((item) => doesAttributedStringContainTableCellId(item.get('contents'), cellId))
    );

export const headerThatContainsTableCellId = (headers, cellId) =>
  headers.find((header) =>
    doesAttributedStringContainTableCellId(header.get('description'), cellId)
  );

export const pathAndPartOfTimestampItemWithIdInAttributedString = (parts, timestampId) =>
  parts
    .map((part, partIndex) => {
      if (part.get('type') === 'timestamp' && part.get('id') === timestampId) {
        return {
          path: [partIndex],
          timestampPart: part,
        };
      } else if (part.get('type') === 'list') {
        return part
          .get('items')
          .map((item, itemIndex) => {
            let pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
              item.get('contents'),
              timestampId
            );
            if (!!pathAndPart) {
              const { path, timestampPart } = pathAndPart;
              return {
                path: [partIndex, 'items', itemIndex, 'contents'].concat(path),
                timestampPart,
              };
            } else {
              let pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
                item.get('titleLine'),
                timestampId
              );
              if (!!pathAndPart) {
                const { path, timestampPart } = pathAndPart;
                return {
                  path: [partIndex, 'items', itemIndex, 'titleLine'].concat(path),
                  timestampPart,
                };
              } else {
                return null;
              }
            }
          })
          .filter((result) => !!result)
          .first();
      } else if (part.get('type') === 'table') {
        return part
          .get('contents')
          .map((row, rowIndex) => {
            return row
              .get('contents')
              .map((cell, cellIndex) => {
                const pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
                  cell.get('contents'),
                  timestampId
                );
                if (!!pathAndPart) {
                  const { path, timestampPart } = pathAndPart;
                  return {
                    path: [
                      partIndex,
                      'contents',
                      rowIndex,
                      'contents',
                      cellIndex,
                      'contents',
                    ].concat(path),
                    timestampPart,
                  };
                } else {
                  return null;
                }
              })
              .filter((result) => !!result)
              .first();
          })
          .filter((result) => !!result)
          .first();
      } else {
        return null;
      }
    })
    .filter((result) => !!result)
    .first();

export const pathAndPartOfListItemWithIdInAttributedString = (parts, listItemId) =>
  parts
    .map((part, partIndex) => {
      if (part.get('type') === 'list') {
        return part
          .get('items')
          .map((item, itemIndex) => {
            if (item.get('id') === listItemId) {
              return {
                path: [partIndex, 'items', itemIndex],
                listItemPart: item,
              };
            } else {
              const pathAndPart = pathAndPartOfListItemWithIdInAttributedString(
                item.get('contents'),
                listItemId
              );
              if (!!pathAndPart) {
                const { path, listItemPart } = pathAndPart;
                return {
                  path: [partIndex, 'items', itemIndex, 'contents'].concat(path),
                  listItemPart,
                };
              } else {
                return null;
              }
            }
          })
          .filter((result) => !!result)
          .first();
      } else {
        return null;
      }
    })
    .filter((result) => !!result)
    .first();

export const pathAndPartOfTableContainingCellIdInAttributedString = (parts, cellId) =>
  parts
    .map((part, partIndex) => {
      if (part.get('type') === 'table') {
        if (tablePartContainsCellId(part, cellId)) {
          return { path: [partIndex], tablePart: part };
        } else {
          return null;
        }
      } else if (part.get('type') === 'list') {
        return part
          .get('items')
          .map((item, itemIndex) => {
            const pathAndPart = pathAndPartOfTableContainingCellIdInAttributedString(
              item.get('contents'),
              cellId
            );
            if (!!pathAndPart) {
              const { path, tablePart } = pathAndPart;
              return {
                path: [partIndex, 'items', itemIndex, 'contents'].concat(path),
                tablePart,
              };
            } else {
              return null;
            }
          })
          .filter((result) => !!result)
          .first();
      } else {
        return null;
      }
    })
    .filter((result) => !!result)
    .first();

export const pathAndPartOfTimestampItemWithIdInHeaders = (headers, timestampId) =>
  headers
    .map((header, headerIndex) => {
      let pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
        header.getIn(['titleLine', 'title']),
        timestampId
      );
      if (!!pathAndPart) {
        const { path, timestampPart } = pathAndPart;
        return {
          path: [headerIndex, 'titleLine', 'title'].concat(path),
          timestampPart,
        };
      }

      pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
        header.get('description'),
        timestampId
      );
      if (!!pathAndPart) {
        const { path, timestampPart } = pathAndPart;
        return {
          path: [headerIndex, 'description'].concat(path),
          timestampPart,
        };
      }

      pathAndPart = header
        .get('propertyListItems')
        .map((propertyListItem, propertyListItemIndex) => {
          if (!propertyListItem.get('value')) {
            return null;
          }

          const plistPathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(
            propertyListItem.get('value'),
            timestampId
          );
          if (!!plistPathAndPart) {
            const { path, timestampPart } = plistPathAndPart;
            return {
              path: [headerIndex, 'propertyListItems', propertyListItemIndex, 'value'].concat(path),
              timestampPart,
            };
          }

          return null;
        })
        .filter((result) => !!result)
        .first();
      if (!!pathAndPart) {
        return pathAndPart;
      }

      return null;
    })
    .filter((result) => !!result)
    .first();

export const pathAndPartOfListItemWithIdInHeaders = (headers, listItemId) =>
  headers
    .map((header, headerIndex) => {
      const pathAndPart = pathAndPartOfListItemWithIdInAttributedString(
        header.get('description'),
        listItemId
      );
      if (!pathAndPart) {
        return null;
      }

      const { path, listItemPart } = pathAndPart;
      return {
        path: [headerIndex, 'description'].concat(path),
        listItemPart,
      };
    })
    .filter((result) => !!result)
    .first();

export const pathAndPartOfTableContainingCellIdInHeaders = (headers, cellId) =>
  headers
    .map((header, headerIndex) => {
      const pathAndPart = pathAndPartOfTableContainingCellIdInAttributedString(
        header.get('description'),
        cellId
      );
      if (!pathAndPart) {
        return null;
      }

      const { path, tablePart } = pathAndPart;
      return {
        path: [headerIndex, 'description'].concat(path),
        tablePart,
      };
    })
    .filter((result) => !!result)
    .first();

export const updateTableContainingCellId = (headers, cellId, updaterCallbackGenerator) => {
  const { path, tablePart } = pathAndPartOfTableContainingCellIdInHeaders(headers, cellId);

  const rowIndexContainingCellId = tablePart
    .get('contents')
    .findIndex((row) => row.get('contents').some((cell) => cell.get('id') === cellId));
  const columnIndexContainingCellId = tablePart
    .getIn(['contents', rowIndexContainingCellId, 'contents'])
    .findIndex((cell) => cell.get('id') === cellId);

  return headers.updateIn(
    path.concat(['contents']),
    updaterCallbackGenerator(rowIndexContainingCellId, columnIndexContainingCellId)
  );
};

export const newEmptyTableRowLikeRows = (rows) =>
  rows
    .get(0)
    .set('id', generateId())
    .update('contents', (contents) =>
      contents.map((cell) =>
        cell.set('id', generateId()).set('contents', List()).set('rawContents', '')
      )
    );

export const newEmptyTableCell = () =>
  fromJS({
    id: generateId(),
    contents: [],
    rawContents: '',
  });

export const timestampWithIdInAttributedString = (parts, timestampId) => {
  if (!parts) {
    return null;
  }

  const pathAndPart = pathAndPartOfTimestampItemWithIdInAttributedString(parts, timestampId);
  if (!!pathAndPart) {
    return pathAndPart.timestampPart;
  } else {
    return null;
  }
};

export const timestampWithId = (headers, timestampId) =>
  headers
    .map(
      (header) =>
        timestampWithIdInAttributedString(header.getIn(['titleLine', 'title']), timestampId) ||
        timestampWithIdInAttributedString(header.get('description'), timestampId) ||
        header
          .get('propertyListItems')
          .map((propertyListItem) =>
            timestampWithIdInAttributedString(propertyListItem.get('value'), timestampId)
          )
          .filter((result) => !!result)
          .first()
    )
    .find((result) => !!result);

export const customFormatDistanceToNow = (datetime) => {
  return formatDistanceToNow(datetime, { addSuffix: true });
};

export const todoKeywordSetForKeyword = (todoKeywordSets, keyword) =>
  todoKeywordSets.find((keywordSet) => keywordSet.get('keywords').contains(keyword)) ||
  todoKeywordSets.first();

export const isTodoKeywordCompleted = (todoKeywordSets, keyword) =>
  todoKeywordSetForKeyword(todoKeywordSets, keyword).get('completedKeywords').includes(keyword);

export const extractAllOrgTags = (headers) =>
  headers
    .flatMap((h) => h.getIn(['titleLine', 'tags']))
    .toSet()
    .sort();

export const extractAllOrgProperties = (headers) =>
  headers
    .map((h) => {
      const propertyList = h.get('propertyListItems');
      return propertyList.map((property) => {
        const prop = property.get('property');
        const valParts = property.get('value'); // lineParts, see parser
        const val = attributedStringToRawText(valParts);
        return [prop, val];
      });
    })
    .filter((x) => !x.isEmpty())
    .flatten();

export const computeAllPropertyNames = (allOrgProperties) =>
  allOrgProperties
    .map(([x]) => x)
    .toSet()
    .sort();

export const computeAllPropertyValuesFor = (allOrgProperties, propertyName) =>
  // toLowerCase() because property names (keys) are case-insensitive:
  // https://orgmode.org/manual/Property-Syntax.html
  allOrgProperties
    .filter(([x]) => x.toLowerCase() === propertyName.toLowerCase())
    .map(([_, y]) => y)
    .toSet()
    .sort();

/**
 * Returns `true` if the header has content, i.e. description.
 * Subheaders do not count as content.
 */
export const hasHeaderContent = (header) =>
  !!header.get('rawDescription') ||
  header.get('planningItems').size !== 0 ||
  header.get('propertyListItems').size !== 0 ||
  header.get('logBookEntries').size !== 0;

/**
 * Returns a function which takes a `todoKeyword` which then returns
 * if said `todoKeyword` is in any `todoKeywordSets` states.
 * @param {Object} todoKeywordSets
 */
export const createIsTodoKeywordInDoneState = (todoKeywordSets) => {
  return (todoKeyword) =>
    todoKeywordSets.some((x) => x.get('completedKeywords').includes(todoKeyword));
};

export const shouldRenderPlanningItem = (x) =>
  x.type !== 'TIMESTAMP_TITLE' && x.type !== 'TIMESTAMP_DESCRIPTION';

export const getPlanningItemTypeText = (planningItem) => {
  const text = planningItem.get('type');
  switch (text) {
    case 'TIMESTAMP_TITLE':
    case 'TIMESTAMP_DESCRIPTION':
      return 'TIMESTAMP';
    default:
      return text;
  }
};

export const getTodoKeywordSetsAsFlattenedArray = (state) => {
  return state
    .get('todoKeywordSets')
    .flatMap((todoKeywordSet) => {
      return todoKeywordSet.get('keywords');
    })
    .toSet()
    .toJS();
};

/** Regular expression of file extensions to validate a filename. */
export const orgFileExtensions = /\.org(_archive)?$/;
