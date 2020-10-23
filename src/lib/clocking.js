import { subheadersOfHeaderWithIndex } from './org_utils';
import { dateForTimestamp } from './timestamps';

const totalTimeLogged = (header) => {
  const logBookEntries = header.get('logBookEntries', []);

  const times = logBookEntries.map((entry) =>
    entry.get('start') && entry.get('end')
      ? dateForTimestamp(entry.get('end')) - dateForTimestamp(entry.get('start'))
      : 0
  );

  const addedTimes = times.reduce((acc, val) => acc + val, 0);
  return addedTimes;
};

export const totalFilteredTimeLogged = (filters, header) => {
  const clocks = header
    .get('logBookEntries', [])
    .map((l) => [l.get('start'), l.get('end')])
    .filter(([start, end]) => start && end)
    .filter((ts) => ts.some((t) => filters.every((f) => f(t))));

  const times = clocks.map(([start, end]) => dateForTimestamp(end) - dateForTimestamp(start));

  const addedTimes = times.reduce((acc, val) => acc + val, 0);
  return addedTimes;
};

export const updateHeadersTotalTimeLoggedRecursive = (headers) => {
  if (!headers) {
    return headers;
  }
  const headersWithtotalTimeLogged = headers.map((header) =>
    header.set('totalTimeLogged', totalTimeLogged(header))
  );
  const headersWithtotalTimeLoggedRecursive = headersWithtotalTimeLogged.map((header, index) => {
    const subheaders = subheadersOfHeaderWithIndex(headersWithtotalTimeLogged, index);
    const totalTimeLoggedRecursive = subheaders.reduce(
      (acc, val) => acc + val.get('totalTimeLogged'),
      header.get('totalTimeLogged')
    );
    return header.set('totalTimeLoggedRecursive', totalTimeLoggedRecursive);
  });
  return headersWithtotalTimeLoggedRecursive;
};

export const updateHeadersTotalFilteredTimeLoggedRecursive = (filters, headers) => {
  if (!headers) {
    return headers;
  }
  const headersWithtotalTimeLogged = headers.map((header) =>
    header.set('totalFilteredTimeLogged', totalFilteredTimeLogged(filters, header))
  );
  const headersWithtotalTimeLoggedRecursive = headersWithtotalTimeLogged.map((header, index) => {
    const subheaders = subheadersOfHeaderWithIndex(headersWithtotalTimeLogged, index);
    const totalTimeLoggedRecursive = subheaders.reduce(
      (acc, val) => acc + val.get('totalFilteredTimeLogged'),
      header.get('totalFilteredTimeLogged')
    );
    return header.set('totalFilteredTimeLoggedRecursive', totalTimeLoggedRecursive);
  });
  return headersWithtotalTimeLoggedRecursive;
};
