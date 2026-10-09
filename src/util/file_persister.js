import { debounce } from 'lodash';
import { parseISO, addSeconds } from 'date-fns';
import { localStorageAvailable } from '../util/settings_persister';
import { exportOrg } from '../lib/export_org';
import { parseFile } from '../reducers/org';
import { STATIC_FILE_PREFIX } from '../lib/org_utils';
import { recordWriteFailure, safeSetItem } from './local_storage';
import {
  getAllFileRecords,
  getFileRecord,
  openFileStore,
  putFileRecord,
  updateFileRecord,
} from './file_store';
import migrateFilesToIndexedDB, {
  LEGACY_FILE_PREFIX,
  readLegacyMap,
} from '../migrations/migrate_files_to_indexeddb';

// Local copies of Org files live in IndexedDB (see `file_store.js`).
// All writes are asynchronous and never throw: a failed write only
// means there is no up to date local copy, it must not fail a sync.

const reportFailedWrite = (path, contents, error) => {
  recordWriteFailure(`file copy ${path}`, contents ? contents.length : 0, error);
};

// Paths of files loaded on startup. Their local copies are never evicted
// to make space for others.
const protectedPathsOf = (state) =>
  new Set(
    state.org.present
      .get('fileSettings')
      .filter((setting) => setting.get('loadOnStartup'))
      .map((setting) => setting.get('path'))
  );

// Before IndexedDB, the dirty flags lived in localStorage. Files whose
// migration has not succeeded yet are still loaded from there, so keep
// their flag current as well.
const persistLegacyIsDirty = (isDirty, path) => {
  if (!localStorageAvailable || localStorage.getItem(LEGACY_FILE_PREFIX + path) === null) {
    return;
  }
  const legacyIsDirty = readLegacyMap('isDirty');
  legacyIsDirty[path] = isDirty;
  safeSetItem('isDirty', JSON.stringify(legacyIsDirty));
};

export const persistIsDirty = (isDirty, path) => {
  if (!path || path.startsWith(STATIC_FILE_PREFIX)) {
    return Promise.resolve();
  }
  persistLegacyIsDirty(isDirty, path);
  return updateFileRecord(path, { isDirty }).catch((error) => reportFailedWrite(path, null, error));
};

// Stores a freshly downloaded or pulled file. `state` is the state
// before the file is parsed.
export const saveFileContents = async (state, path, contents) => {
  if (path.startsWith(STATIC_FILE_PREFIX)) {
    return;
  }
  try {
    // A local copy with unsynced edits for a file that is not loaded
    // means loading it at startup failed. Never overwrite it with the
    // remote version.
    if (!state.org.present.hasIn(['files', path, 'headers'])) {
      const existing = await getFileRecord(path);
      if (existing && existing.isDirty) {
        console.warn(`Keeping the local copy of ${path}: it has unsynced edits`);
        return;
      }
    }
    const record = {
      path,
      contents,
      isDirty: false,
      lastSyncAt: addSeconds(new Date(), 5).toISOString(),
    };
    await putFileRecord(record, { protectedPaths: protectedPathsOf(state) });
  } catch (error) {
    reportFailedWrite(path, contents, error);
  }
};

// Stores the file as it is in `state`: contents, dirty flag and sync
// time together. `onFailure` is called when a copy with unsynced edits
// could not be stored, because then the edits only exist in memory.
const saveFileFromState = (state, path, onFailure) => {
  if (path.startsWith(STATIC_FILE_PREFIX) || !state.org.present.hasIn(['files', path, 'headers'])) {
    return Promise.resolve();
  }
  const contents = exportOrg({
    headers: state.org.present.getIn(['files', path, 'headers']),
    linesBeforeHeadings: state.org.present.getIn(['files', path, 'linesBeforeHeadings']),
    dontIndent: state.base.get('shouldNotIndentOnExport'),
  });
  const isDirty = !!state.org.present.getIn(['files', path, 'isDirty']);
  const lastSyncAt = state.org.present.getIn(['files', path, 'lastSyncAt']);
  const record = {
    path,
    contents,
    isDirty,
    lastSyncAt: lastSyncAt && !isNaN(lastSyncAt) ? lastSyncAt.toISOString() : null,
  };
  persistLegacyIsDirty(isDirty, path);
  return putFileRecord(record, { protectedPaths: protectedPathsOf(state) }).catch((error) => {
    reportFailedWrite(path, contents, error);
    if (isDirty && onFailure) {
      onFailure(path);
    }
  });
};

// Stores a file after a successful push.
export const saveSyncedFile = (state, path) => saveFileFromState(state, path);

const getDebouncedSaveFunction = () =>
  debounce((getState, path, onFailure) => saveFileFromState(getState(), path, onFailure), 3000, {
    leading: true,
    trailing: true,
  });
const debouncedSaveFunctions = {};
// Stores a file with local edits, at most every 3 seconds. Reads the
// state only when the save runs, so a save scheduled before a sync
// finished cannot undo that sync's bookkeeping.
export const saveEditedFileDebounced = (getState, path, onFailure) => {
  // to make sure no file is skipped when multiple files are dirty
  // a seperately debounced function is used per file
  let debouncedSaveFunction = debouncedSaveFunctions[path];
  if (!debouncedSaveFunction) {
    debouncedSaveFunctions[path] = getDebouncedSaveFunction();
    debouncedSaveFunction = debouncedSaveFunctions[path];
  }
  debouncedSaveFunction(getState, path, onFailure);
};

// Copies of files whose migration from localStorage has not succeeded
// (or cannot run, because IndexedDB is not available).
const readLegacyFiles = (excludedPaths) => {
  if (!localStorageAvailable) {
    return [];
  }
  const persistedFiles = readLegacyMap('persistedFiles');
  const isDirty = readLegacyMap('isDirty');
  const files = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(LEGACY_FILE_PREFIX)) continue;
    const path = key.substring(LEGACY_FILE_PREFIX.length);
    if (excludedPaths.has(path)) continue;
    files.push({
      path,
      contents: localStorage.getItem(key),
      isDirty: !!isDirty[path],
      lastSyncAt: persistedFiles[path] || null,
    });
  }
  return files;
};

// `headerOpenness` keeps an entry for every file ever opened. Keep only
// the entries of files that are configured or have a local copy.
const pruneHeaderOpenness = (cachedPaths) => {
  if (!localStorageAvailable) {
    return;
  }
  try {
    const opennessState = JSON.parse(localStorage.getItem('headerOpenness'));
    if (!opennessState) return;
    const fileSettings = JSON.parse(localStorage.getItem('fileSettings')) || [];
    const keptPaths = new Set([...cachedPaths, ...fileSettings.map(({ path }) => path)]);
    const prunedState = {};
    Object.entries(opennessState).forEach(([path, openHeaderPaths]) => {
      if (keptPaths.has(path)) prunedState[path] = openHeaderPaths;
    });
    if (Object.keys(prunedState).length < Object.keys(opennessState).length) {
      safeSetItem('headerOpenness', JSON.stringify(prunedState));
    }
  } catch (error) {
    console.warn('Could not prune headerOpenness', error);
  }
};

// Runs before the app starts: migrates local copies from localStorage
// to IndexedDB and reads all local copies. The app renders only after
// this, so no sync or download can run on a file whose local copy (and
// possibly unsynced edits) has not been loaded yet.
export const readCachedFiles = async () => {
  const fileStoreAvailable = !!(await openFileStore());
  if (fileStoreAvailable) {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    try {
      await migrateFilesToIndexedDB();
    } catch (error) {
      console.warn('Migrating local file copies to IndexedDB failed', error);
    }
  }

  let records = [];
  try {
    records = await getAllFileRecords();
  } catch (error) {
    console.warn('Could not read local file copies', error);
  }
  const recordPaths = new Set(records.map(({ path }) => path));
  const files = [...records, ...readLegacyFiles(recordPaths)];

  pruneHeaderOpenness(files.map(({ path }) => path));

  return { files, fileStoreAvailable };
};

export const loadCachedFiles = (state, files = []) => {
  files.forEach(({ path, contents, isDirty, lastSyncAt }) => {
    if (!contents) return;
    state.org.present = state.org.present.update((org) => parseFile(org, { path, contents }));
    state.org.present = state.org.present.setIn(
      ['files', path, 'lastSyncAt'],
      lastSyncAt ? parseISO(lastSyncAt) : undefined
    );
    state.org.present = state.org.present.setIn(['files', path, 'isDirty'], !!isDirty);
  });
  return state;
};
