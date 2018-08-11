export const indexOfHeaderWithId = (headers, headerId) => {
  return headers.findIndex(header => header.get('id') === headerId);
};

export const headerWithId = (headers, headerId) => {
  return headers.get(indexOfHeaderWithId(headers, headerId));
};

export const subheadersOfHeaderWithId = (headers, headerId) => {
  const header = headerWithId(headers, headerId);
  const headerIndex = indexOfHeaderWithId(headers, headerId);

  const afterHeaders = headers.slice(headerIndex + 1);
  const nextSiblingHeaderIndex = afterHeaders.findIndex(siblingHeader => {
    return siblingHeader.get('nestingLevel') <= header.get('nestingLevel');
  });

  if (nextSiblingHeaderIndex === -1) {
    return afterHeaders;
  } else {
    return afterHeaders.slice(0, nextSiblingHeaderIndex);
  }
};

export const numSubheadersOfHeaderWithId = (headers, headerId) => (
  subheadersOfHeaderWithId(headers, headerId).size
);

export const directParentIdOfHeaderWithId = (headers, headerId) => {
  const header = headerWithId(headers, headerId);
  const headerIndex = indexOfHeaderWithId(headers, headerId);

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
  const header = headerWithId(headers, headerId);
  const headerIndex = indexOfHeaderWithId(headers, headerId);

  const previousHeaders = headers.slice(0, headerIndex).reverse();
  const parentHeader = previousHeaders.find(previousHeader => (
    previousHeader.get('nestingLevel') < header.get('nestingLevel')
  ));

  if (!parentHeader) {
    return null;
  }

  return parentHeader.get('id');
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
  return parentHeader.get('opened') && isHeaderVisible(headers, parentHeader);
};

export const nextVisibleHeaderAfterIndex = (headers, headerIndex) => {
  const followingHeaders = headers.slice(headerIndex + 1);
  return followingHeaders.find(header => isHeaderVisible(headers, header.get('id')));
};

export const previousVisibleHeaderAfterIndex = (headers, headerIndex) => {
  const previousHeaders = headers.slice(0, headerIndex).reverse();
  return previousHeaders.find(header => isHeaderVisible(headers, header.get('id')));
};

export const openDirectParent = (state, headerId) => {
  const parentHeaderId = directParentIdOfHeaderWithId(state.get('headers'), headerId);
  if (parentHeaderId !== null) {
    const parentHeaderIndex = indexOfHeaderWithId(state.get('headers'), parentHeaderId);
    state = state.setIn(['headers', parentHeaderIndex, 'opened'], true);
  }

  return state;
};

export const getOpenHeaderPaths = headers => {
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
      openSubheaderPaths.forEach(openedSubheaderPath => {
        openedHeaders.push([title].concat(openedSubheaderPath));
      });
    } else {
      openedHeaders.push([title]);
    }

    i += subheaders.size;
  }

  return openedHeaders;
};

export const openHeaderWithPath = (headers, headerPath, maxNestingLevel = 1) => {
  if (headerPath.size === 0) {
    return headers;
  }

  const firstTitle = headerPath.first();
  const headerIndex = headers.findIndex(header => {
    const rawTitle = header.getIn(['titleLine', 'rawTitle']);
    const nestingLevel = header.get('nestingLevel');
    return rawTitle === firstTitle && nestingLevel <= maxNestingLevel;
  });
  if (headerIndex === -1) {
    return headers;
  }

  headers = headers.update(headerIndex, header => header.set('opened', true));

  let subheaders = subheadersOfHeaderWithId(headers, headers.getIn([headerIndex, 'id']));
  subheaders = openHeaderWithPath(subheaders, headerPath.rest(), maxNestingLevel + 1);

  headers = headers
    .take(headerIndex + 1)
    .concat(subheaders)
    .concat(headers.takeLast(headers.size - (headerIndex + 1 + subheaders.size)));

  return headers;
};

export const tablePartContainsCellId = (tablePart, cellId) => (
  tablePart.get('contents').some(row => (
    row.get('contents').some(cell => cell.get('id') === cellId)
  ))
);

export const headerThatContainsTableCellId = (headers, cellId) => (
  headers.find(header => (
    header.get('description').filter(descriptionPart => (
      descriptionPart.get('type') === 'table'
    )).some(tablePart => (
      tablePartContainsCellId(tablePart, cellId)
    ))
  ))
);

export const updateTableContainingCellId = (headers, cellId, updaterCallbackGenerator) => {
  const containingHeader = headerThatContainsTableCellId(headers, cellId);
  const containingHeaderIndex = indexOfHeaderWithId(headers, containingHeader.get('id'));
  const tablePartIndex = containingHeader.get('description').findIndex(descriptionPart => (
    descriptionPart.get('type') === 'table' && tablePartContainsCellId(descriptionPart, cellId)
  ));
  const tablePart = containingHeader.getIn(['description', tablePartIndex]);
  const rowIndexContainingCellId = tablePart.get('contents').findIndex(row => (
    row.get('contents').some(cell => cell.get('id') === cellId)
  ));

  return headers.updateIn([
    containingHeaderIndex, 'description', tablePartIndex, 'contents'
  ], updaterCallbackGenerator(rowIndexContainingCellId));
};
