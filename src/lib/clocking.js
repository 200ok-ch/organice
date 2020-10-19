import { subheadersOfHeaderWithIndex } from './org_utils';
import { dateForTimestamp } from './timestamps';

export const totalTimeLogged = (header) => {
  const logBookEntries = header.get('logBookEntries', []);

  const times = logBookEntries.map((entry) =>
    entry.get('start') && entry.get('end')
      ? dateForTimestamp(entry.get('end')) - dateForTimestamp(entry.get('start'))
      : 0
  );

  const addedTimes = times.reduce((acc, val) => acc + val, 0);
  return addedTimes;
};

export const updateHeadersTotalTimeLogged = (headers) => {
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
