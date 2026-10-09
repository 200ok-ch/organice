import { safeSetItem, getWriteFailures, getLocalStorageUsage } from './local_storage';
import { localStorageAvailable } from './settings_persister';
import { fileErrorMessage } from '../actions/org';
import { isNotFoundError } from '../sync_backend_clients/dropbox_sync_backend_client';

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

describe('fileErrorMessage', () => {
  test('without an error, the file was not found', () => {
    expect(fileErrorMessage('load', '/a.org')).toBe('File /a.org not found');
  });

  test('with an error, shows its name and message', () => {
    expect(fileErrorMessage('load', '/a.org', quotaExceeded())).toBe(
      'Could not load /a.org: QuotaExceededError: The quota has been exceeded.'
    );
  });
});

describe('isNotFoundError', () => {
  test('recognizes a missing file in the Dropbox SDK 10 error format', () => {
    const error = { status: 409, error: { error_summary: 'path/not_found/..' } };
    expect(isNotFoundError(error)).toBe(true);
  });

  test('recognizes a missing file in the older JSON string format', () => {
    const error = { error: JSON.stringify({ error_summary: 'path/not_found/.' }) };
    expect(isNotFoundError(error)).toBe(true);
  });

  test('other errors are not "not found"', () => {
    expect(isNotFoundError(new TypeError('Load failed'))).toBe(false);
    expect(isNotFoundError({ status: 500, error: 'Internal Server Error' })).toBe(false);
    expect(isNotFoundError({ status: 409, error: { error_summary: 'too_many_requests/' } })).toBe(
      false
    );
  });
});
