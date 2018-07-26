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
