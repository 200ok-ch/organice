import { safeSetItem, getWriteFailures, getLocalStorageUsage } from './local_storage';
import { localStorageAvailable } from './settings_persister';

const quotaExceeded = () => {
  const error = new Error('The quota has been exceeded.');
  error.name = 'QuotaExceededError';
  return error;
};

// Simulates a full localStorage: every write fails, reads still work.
const fillLocalStorage = () =>
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw quotaExceeded();
  });

describe('localStorage when the quota is exhausted', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('localStorage counts as available as long as it can be read', () => {
    expect(localStorageAvailable).toBeTruthy();
  });

  test('safeSetItem returns false and records the failure instead of throwing', () => {
    fillLocalStorage();
    const failuresBefore = getWriteFailures().length;

    expect(safeSetItem('someKey', 'abc')).toBe(false);

    const failures = getWriteFailures();
    expect(failures.length).toBe(failuresBefore + 1);
    expect(failures[failures.length - 1]).toMatchObject({
      key: 'someKey',
      valueLength: 3,
      errorName: 'QuotaExceededError',
    });
  });

  test('safeSetItem writes when there is space', () => {
    expect(safeSetItem('someKey', 'abc')).toBe(true);
    expect(localStorage.getItem('someKey')).toBe('abc');
  });

  test('getLocalStorageUsage sums keys and values and sorts by size', () => {
    localStorage.setItem('small', 'a');
    localStorage.setItem('files__/big.org', 'a'.repeat(100));

    const { totalSize, entries } = getLocalStorageUsage();

    expect(totalSize).toBe('small'.length + 1 + 'files__/big.org'.length + 100);
    expect(entries[0].key).toBe('files__/big.org');
  });
});
