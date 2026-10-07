// Guarded localStorage writes, and a record of failed writes to
// localStorage and to the IndexedDB file store. When the localStorage
// quota is exhausted, `setItem` throws a `QuotaExceededError`. Many
// writes happen inside Redux dispatches and sync handlers, where an
// exception aborts unrelated work (and used to surface as "File ... not
// found"). Record failed writes instead, so they can be inspected in the
// storage diagnostics in the settings.

const MAX_RECORDED_FAILURES = 20;
const writeFailures = [];

export const recordWriteFailure = (key, valueLength, error) => {
  writeFailures.push({
    key,
    valueLength,
    errorName: error && error.name,
    errorMessage: error && error.message,
    at: new Date(),
  });
  if (writeFailures.length > MAX_RECORDED_FAILURES) {
    writeFailures.shift();
  }
  console.warn(`Could not write "${key}"`, error);
};

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    recordWriteFailure(key, value == null ? 0 : String(value).length, error);
    return false;
  }
};

export const getWriteFailures = () => writeFailures.slice();

// Size is counted in UTF-16 code units (key plus value), which is
// how browsers account localStorage usage against their quota.
export const getLocalStorageUsage = () => {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key) || '';
    entries.push({ key, size: key.length + value.length });
  }
  entries.sort((a, b) => b.size - a.size);
  const totalSize = entries.reduce((sum, { size }) => sum + size, 0);
  return { totalSize, entries };
};
