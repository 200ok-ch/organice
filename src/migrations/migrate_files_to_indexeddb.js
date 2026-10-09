import { localStorageAvailable } from '../util/settings_persister';
import { safeSetItem } from '../util/local_storage';
import { getFileRecord, putFileRecord } from '../util/file_store';

// Before IndexedDB, local copies of Org files were stored in localStorage:
//   files__<path>   the contents
//   persistedFiles  { path: lastSyncAt }
//   isDirty         { path: true if the copy has unsynced edits }
export const LEGACY_FILE_PREFIX = 'files__';

export const readLegacyMap = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (e) {
    return {};
  }
};

const writeLegacyMap = (key, map) => {
  if (Object.keys(map).length === 0) {
    localStorage.removeItem(key);
  } else {
    safeSetItem(key, JSON.stringify(map));
  }
};

// Moves every local copy from localStorage to IndexedDB. Per file, the
// localStorage copy is removed only after its IndexedDB record has been
// written and read back. A file that fails stays in localStorage, is
// still loaded from there, and is retried on the next start.
//
// No code writes `files__<path>` anymore, so an existing IndexedDB record
// is always at least as recent as the localStorage copy. Then the
// localStorage copy is simply removed (e.g. after an interrupted run).
export default async () => {
  if (!localStorageAvailable) {
    return;
  }

  const legacyPaths = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(LEGACY_FILE_PREFIX)) {
      legacyPaths.push(key.substring(LEGACY_FILE_PREFIX.length));
    }
  }
  if (legacyPaths.length === 0) {
    return;
  }

  const persistedFiles = readLegacyMap('persistedFiles');
  const isDirty = readLegacyMap('isDirty');

  for (const path of legacyPaths) {
    const contents = localStorage.getItem(LEGACY_FILE_PREFIX + path);
    try {
      if (!(await getFileRecord(path))) {
        await putFileRecord({
          path,
          contents,
          isDirty: !!isDirty[path],
          lastSyncAt: persistedFiles[path] || null,
        });
        const written = await getFileRecord(path);
        if (!written || written.contents !== contents) {
          console.warn(`Migrating the local copy of ${path} could not be verified`);
          continue;
        }
      }
    } catch (error) {
      console.warn(`Migrating the local copy of ${path} failed`, error);
      continue;
    }

    // Free the space first: with a full localStorage, the smaller
    // writes below only succeed after it.
    localStorage.removeItem(LEGACY_FILE_PREFIX + path);
    delete persistedFiles[path];
    delete isDirty[path];
    writeLegacyMap('persistedFiles', persistedFiles);
    writeLegacyMap('isDirty', isDirty);
  }
};
