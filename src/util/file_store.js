// Local copies of Org files, kept in IndexedDB. localStorage is limited
// to about 2.6 million characters on iOS Safari, which a few large Org
// files exceed. IndexedDB may use a large share of the free disk space.
//
// One record per file:
//   { path, contents, isDirty, lastSyncAt, updatedAt }
// Contents and the dirty flag live in the same record, so they are always
// written together. Otherwise unsynced edits could be stored while the
// flag marking them as unsynced is lost.

// Some WebKit versions never answer `indexedDB.open`. Treat that as
// IndexedDB not being available instead of waiting forever.
const OPEN_TIMEOUT_MS = 5000;

const DB_NAME = 'organice';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let databasePromise = null;

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (transaction) =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

// Resolves with the database, or with `null` when IndexedDB is not
// available (for example in some private browsing modes). Callers then
// keep files in memory only.
export const openFileStore = () => {
  if (!databasePromise) {
    databasePromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Opening IndexedDB timed out');
        resolve(null);
      }, OPEN_TIMEOUT_MS);
      const resolveOnce = (database) => {
        clearTimeout(timeout);
        resolve(database);
      };
      if (typeof indexedDB === 'undefined' || !indexedDB) {
        resolveOnce(null);
        return;
      }
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'path' });
        };
        request.onsuccess = () => {
          const database = request.result;
          // Another tab upgrading or deleting the database: let it.
          database.onversionchange = () => {
            database.close();
            databasePromise = null;
          };
          resolveOnce(database);
        };
        request.onerror = () => {
          console.warn('Could not open IndexedDB', request.error);
          resolveOnce(null);
        };
        request.onblocked = () => resolveOnce(null);
      } catch (error) {
        console.warn('Could not open IndexedDB', error);
        resolveOnce(null);
      }
    });
  }
  return databasePromise;
};

const withStore = async (mode, callback) => {
  const database = await openFileStore();
  if (!database) {
    throw new Error('IndexedDB is not available');
  }
  const transaction = database.transaction(STORE_NAME, mode);
  const done = transactionDone(transaction);
  try {
    callback(transaction.objectStore(STORE_NAME));
  } catch (error) {
    // E.g. an invalid key. Don't leave a half-done transaction behind.
    done.catch(() => {});
    transaction.abort();
    throw error;
  }
  await done;
};

export const getAllFileRecords = async () => {
  const database = await openFileStore();
  if (!database) {
    return [];
  }
  const transaction = database.transaction(STORE_NAME, 'readonly');
  return requestToPromise(transaction.objectStore(STORE_NAME).getAll());
};

export const getFileRecord = async (path) => {
  const database = await openFileStore();
  if (!database) {
    return undefined;
  }
  const transaction = database.transaction(STORE_NAME, 'readonly');
  return requestToPromise(transaction.objectStore(STORE_NAME).get(path));
};

const putRecord = (record) =>
  withStore('readwrite', (store) => {
    store.put({ ...record, updatedAt: new Date().toISOString() });
  });

export const deleteFileRecord = (path) => withStore('readwrite', (store) => store.delete(path));

// Deletes the record of `path` unless it has unsynced edits. Checks and
// deletes in one transaction, so a save that makes the record dirty in
// between cannot be lost.
export const deleteFileRecordIfClean = (path) =>
  withStore('readwrite', (store) => {
    const request = store.get(path);
    request.onsuccess = () => {
      if (request.result && !request.result.isDirty) {
        store.delete(path);
      }
    };
  });

const isQuotaExceeded = (error) => !!error && error.name === 'QuotaExceededError';

// When the browser refuses a write for lack of space, drop local copies
// that can be downloaded again: oldest first, never a copy with unsynced
// edits, never a protected path (e.g. files loaded on startup).
const evictAndRetry = async (record, protectedPaths, originalError) => {
  const records = await getAllFileRecords();
  const evictable = records
    .filter(({ path, isDirty }) => !isDirty && path !== record.path && !protectedPaths.has(path))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1));

  for (const { path } of evictable) {
    await deleteFileRecordIfClean(path);
    try {
      await putRecord(record);
      return;
    } catch (error) {
      if (!isQuotaExceeded(error)) {
        throw error;
      }
    }
  }
  throw originalError;
};

export const putFileRecord = async (record, { protectedPaths = new Set() } = {}) => {
  try {
    await putRecord(record);
  } catch (error) {
    if (!isQuotaExceeded(error)) {
      throw error;
    }
    await evictAndRetry(record, protectedPaths, error);
  }
};

// Changes some fields of an existing record in one transaction. Does
// nothing when there is no record for `path`: without contents, the
// other fields are meaningless.
export const updateFileRecord = (path, changes) =>
  withStore('readwrite', (store) => {
    const request = store.get(path);
    request.onsuccess = () => {
      if (request.result) {
        store.put({ ...request.result, ...changes, updatedAt: new Date().toISOString() });
      }
    };
  });

export const clearFileStore = async () => {
  const database = await openFileStore();
  if (!database) {
    return;
  }
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).clear();
  await transactionDone(transaction);
};

// Only for tests: forget the cached connection.
export const resetFileStoreConnection = () => {
  databasePromise = null;
};
