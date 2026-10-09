/* global globalThis */
import v8 from 'v8';
import { fromJS, List, Map } from 'immutable';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

import * as fileStore from './file_store';
import {
  readCachedFiles,
  saveFileContents,
  persistIsDirty,
  saveEditedFileDebounced,
} from './file_persister';
import { parseFile as parseFileReducer } from '../reducers/org';
import { downloadFile, getDirectoryListing } from '../actions/sync_backend';
import migrateFilesToIndexedDB from '../migrations/migrate_files_to_indexeddb';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../reducers';
import { readInitialState } from './settings_persister';

// jsdom has no structuredClone, which fake-indexeddb uses when storing.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (value) => v8.deserialize(v8.serialize(value));
}

const stateWith = ({ loadedPaths = [], startupPaths = [] } = {}) => ({
  org: {
    present: fromJS({
      files: Object.fromEntries(loadedPaths.map((path) => [path, { headers: [] }])),
      fileSettings: startupPaths.map((path) => ({ path, loadOnStartup: true })),
    }),
  },
});

const setLegacyFile = (path, contents, { lastSyncAt, isDirty } = {}) => {
  localStorage.setItem('files__' + path, contents);
  const persistedFiles = JSON.parse(localStorage.getItem('persistedFiles')) || {};
  persistedFiles[path] = lastSyncAt || '2026-01-01T00:00:00.000Z';
  localStorage.setItem('persistedFiles', JSON.stringify(persistedFiles));
  if (isDirty !== undefined) {
    const dirtyFlags = JSON.parse(localStorage.getItem('isDirty')) || {};
    dirtyFlags[path] = isDirty;
    localStorage.setItem('isDirty', JSON.stringify(dirtyFlags));
  }
};

beforeEach(() => {
  // A fresh, empty database for every test.
  globalThis.indexedDB = new IDBFactory();
  fileStore.resetFileStoreConnection();
  localStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('file store', () => {
  test('stores and reads a record', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* A', isDirty: false });

    const record = await fileStore.getFileRecord('/a.org');
    expect(record).toMatchObject({ path: '/a.org', contents: '* A', isDirty: false });
    expect(record.updatedAt).toBeTruthy();
  });

  test('updates fields of an existing record and keeps the rest', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* A', isDirty: false });

    await fileStore.updateFileRecord('/a.org', { isDirty: true });

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* A',
      isDirty: true,
    });
  });

  test('does not create a record when updating a missing one', async () => {
    await fileStore.updateFileRecord('/missing.org', { isDirty: true });
    expect(await fileStore.getFileRecord('/missing.org')).toBeUndefined();
  });

  test('clears all records', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* A' });
    await fileStore.clearFileStore();
    expect(await fileStore.getAllFileRecords()).toEqual([]);
  });
});

describe('folder listings', () => {
  const entry = (path, isDirectory = false) => ({
    id: path,
    name: path.split('/').pop(),
    isDirectory,
    path,
  });

  test('stores and reads a listing', async () => {
    await fileStore.putListingRecord({ path: '/notes', listing: [entry('/notes/a.org')] });

    const record = await fileStore.getListingRecord('/notes');
    expect(record.listing).toEqual([entry('/notes/a.org')]);
    expect(record.savedAt).toBeTruthy();
  });

  test('lists the paths available offline without reading contents', async () => {
    await fileStore.putFileRecord({ path: '/notes/a.org', contents: '* A' });
    await fileStore.putListingRecord({ path: '/notes', listing: [] });

    expect(await fileStore.getOfflinePaths()).toEqual({
      files: ['/notes/a.org'],
      folders: ['/notes'],
    });
  });

  test('clearing the store also deletes listings', async () => {
    await fileStore.putListingRecord({ path: '/notes', listing: [] });
    await fileStore.clearFileStore();
    expect(await fileStore.getListingRecord('/notes')).toBeUndefined();
  });

  test('upgrading from version 1 keeps the local copies', async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('organice', 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('files', { keyPath: 'path' }).put({
          path: '/a.org',
          contents: '* A',
        });
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({ contents: '* A' });
    await fileStore.putListingRecord({ path: '', listing: [] });
    expect(await fileStore.getListingRecord('')).toBeTruthy();
  });

  describe('getDirectoryListing', () => {
    const createListingStore = ({ online, client }) => {
      const state = readInitialState();
      state.base = state.base.set('online', online);
      state.syncBackend = state.syncBackend.set('client', client);
      return createStore(rootReducer, state, applyMiddleware(thunk));
    };
    const currentListing = (store) =>
      store.getState().syncBackend.get('currentFileBrowserDirectoryListing');

    test('saves a fetched listing', async () => {
      const client = {
        getDirectoryListing: jest.fn(() =>
          Promise.resolve({ listing: fromJS([entry('/notes/a.org')]) })
        ),
      };
      const store = createListingStore({ online: true, client });

      await store.dispatch(getDirectoryListing('/notes'));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(currentListing(store).get('offline')).toBeFalsy();
      expect((await fileStore.getListingRecord('/notes')).listing).toEqual([entry('/notes/a.org')]);
    });

    test('shows the saved listing when offline, without asking the back-end', async () => {
      await fileStore.putListingRecord({
        path: '/notes',
        listing: [entry('/notes/a.org'), entry('/notes/b.org'), entry('/notes/sub', true)],
      });
      await fileStore.putFileRecord({ path: '/notes/a.org', contents: '* A' });
      const client = { getDirectoryListing: jest.fn() };
      const store = createListingStore({ online: false, client });

      await store.dispatch(getDirectoryListing('/notes'));

      expect(client.getDirectoryListing).not.toHaveBeenCalled();
      const listing = currentListing(store);
      expect(
        listing
          .get('listing')
          .map((file) => file.get('name'))
          .toJS()
      ).toEqual(['a.org', 'b.org', 'sub']);
      expect(listing.get('hasMore')).toBe(false);
      expect(listing.getIn(['offline', 'savedAt'])).toBeTruthy();
      const availablePaths = listing.getIn(['offline', 'availablePaths']);
      expect(availablePaths.has('/notes/a.org')).toBe(true);
      expect(availablePaths.has('/notes/b.org')).toBe(false);
      expect(availablePaths.has('/notes/sub')).toBe(false);
    });

    test('falls back to the saved listing when fetching fails', async () => {
      await fileStore.putListingRecord({ path: '/notes', listing: [entry('/notes/a.org')] });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const client = {
        getDirectoryListing: jest.fn(() => Promise.reject(new Error('Network Error'))),
      };
      const store = createListingStore({ online: true, client });

      await store.dispatch(getDirectoryListing('/notes'));

      expect(currentListing(store).get('listing').size).toBe(1);
      expect(currentListing(store).getIn(['offline', 'savedAt'])).toBeTruthy();
      expect(store.getState().syncBackend.get('currentPath')).toBe('/notes');
    });

    test('reports a folder that was never visited', async () => {
      const store = createListingStore({ online: false, client: {} });

      await store.dispatch(getDirectoryListing('/never'));

      expect(currentListing(store).get('listing')).toBeNull();
      expect(currentListing(store).getIn(['offline', 'savedAt'])).toBeNull();
    });
  });
});

describe('migration from localStorage', () => {
  test('moves contents, sync time and dirty flag, then frees localStorage', async () => {
    setLegacyFile('/a.org', '* A', { lastSyncAt: '2026-05-01T00:00:00.000Z', isDirty: true });
    setLegacyFile('/b.org', '* B', { isDirty: false });

    await migrateFilesToIndexedDB();

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* A',
      isDirty: true,
      lastSyncAt: '2026-05-01T00:00:00.000Z',
    });
    expect(await fileStore.getFileRecord('/b.org')).toMatchObject({
      contents: '* B',
      isDirty: false,
    });
    expect(localStorage.getItem('files__/a.org')).toBeNull();
    expect(localStorage.getItem('files__/b.org')).toBeNull();
    expect(localStorage.getItem('persistedFiles')).toBeNull();
    expect(localStorage.getItem('isDirty')).toBeNull();
  });

  test('running it twice changes nothing', async () => {
    setLegacyFile('/a.org', '* A', { isDirty: true });

    await migrateFilesToIndexedDB();
    await migrateFilesToIndexedDB();

    expect(await fileStore.getAllFileRecords()).toHaveLength(1);
    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* A',
      isDirty: true,
    });
  });

  test('an existing record wins over a leftover localStorage copy', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* newer', isDirty: true });
    setLegacyFile('/a.org', '* older', { isDirty: false });

    await migrateFilesToIndexedDB();

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* newer',
      isDirty: true,
    });
    expect(localStorage.getItem('files__/a.org')).toBeNull();
  });

  test('a file that fails stays in localStorage, the others are migrated', async () => {
    setLegacyFile('/fails.org', '* unsynced edits', { isDirty: true });
    setLegacyFile('/works.org', '* B');
    const putFileRecord = fileStore.putFileRecord;
    jest
      .spyOn(fileStore, 'putFileRecord')
      .mockImplementation((record, options) =>
        record.path === '/fails.org'
          ? Promise.reject(new Error('disk full'))
          : putFileRecord(record, options)
      );

    await migrateFilesToIndexedDB();

    expect(localStorage.getItem('files__/fails.org')).toBe('* unsynced edits');
    expect(JSON.parse(localStorage.getItem('isDirty'))).toEqual({ '/fails.org': true });
    expect(await fileStore.getFileRecord('/fails.org')).toBeUndefined();
    expect(localStorage.getItem('files__/works.org')).toBeNull();
    expect(await fileStore.getFileRecord('/works.org')).toMatchObject({ contents: '* B' });
  });
});

describe('reading local copies at startup', () => {
  test('returns migrated records and files whose migration failed', async () => {
    setLegacyFile('/fails.org', '* unsynced edits', { isDirty: true });
    setLegacyFile('/works.org', '* B');
    const putFileRecord = fileStore.putFileRecord;
    jest
      .spyOn(fileStore, 'putFileRecord')
      .mockImplementation((record, options) =>
        record.path === '/fails.org'
          ? Promise.reject(new Error('disk full'))
          : putFileRecord(record, options)
      );

    const { files, fileStoreAvailable } = await readCachedFiles();

    expect(fileStoreAvailable).toBe(true);
    const byPath = Object.fromEntries(files.map((file) => [file.path, file]));
    expect(byPath['/works.org']).toMatchObject({ contents: '* B', isDirty: false });
    expect(byPath['/fails.org']).toMatchObject({ contents: '* unsynced edits', isDirty: true });
  });

  test('prunes fold state of files that are neither configured nor cached', async () => {
    setLegacyFile('/cached.org', '* A');
    localStorage.setItem('fileSettings', JSON.stringify([{ path: '/configured.org' }]));
    localStorage.setItem(
      'headerOpenness',
      JSON.stringify({ '/cached.org': [], '/configured.org': [], '/gone.org': [] })
    );

    await readCachedFiles();

    expect(Object.keys(JSON.parse(localStorage.getItem('headerOpenness'))).sort()).toEqual([
      '/cached.org',
      '/configured.org',
    ]);
  });
});

describe('saving local copies', () => {
  test('a downloaded file replaces the local copy of a loaded file', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* old', isDirty: true });

    await saveFileContents(stateWith({ loadedPaths: ['/a.org'] }), '/a.org', '* remote');

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* remote',
      isDirty: false,
    });
  });

  test('never overwrites unsynced edits of a file that is not loaded', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* edits', isDirty: true });

    await saveFileContents(stateWith(), '/a.org', '* remote');

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* edits',
      isDirty: true,
    });
  });

  test('persistIsDirty updates the record and a not yet migrated copy', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* A', isDirty: false });
    setLegacyFile('/legacy.org', '* L', { isDirty: false });

    await persistIsDirty(true, '/a.org');
    await persistIsDirty(true, '/legacy.org');

    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({ isDirty: true });
    expect(JSON.parse(localStorage.getItem('isDirty'))).toEqual({ '/legacy.org': true });
  });

  test('a failed write never throws', async () => {
    jest.spyOn(fileStore, 'putFileRecord').mockRejectedValue(new Error('disk full'));

    await expect(
      saveFileContents(stateWith({ loadedPaths: ['/a.org'] }), '/a.org', '* A')
    ).resolves.toBeUndefined();
  });
});

describe('eviction', () => {
  test('deletes a clean record but keeps one with unsynced edits', async () => {
    await fileStore.putFileRecord({ path: '/clean.org', contents: '* A', isDirty: false });
    await fileStore.putFileRecord({ path: '/dirty.org', contents: '* B', isDirty: true });

    await fileStore.deleteFileRecordIfClean('/clean.org');
    await fileStore.deleteFileRecordIfClean('/dirty.org');

    expect(await fileStore.getFileRecord('/clean.org')).toBeUndefined();
    expect(await fileStore.getFileRecord('/dirty.org')).toMatchObject({ contents: '* B' });
  });
});

// A state with `path` loaded from `contents`.
const loadedState = (path, contents, { isDirty, lastSyncAt }) => {
  let org = fromJS({ files: {}, fileSettings: [] });
  org = parseFileReducer(org, { path, contents });
  org = org
    .setIn(['files', path, 'isDirty'], isDirty)
    .setIn(['files', path, 'lastSyncAt'], lastSyncAt);
  return { org: { present: org }, base: Map({ shouldNotIndentOnExport: false }) };
};

describe('saving edits', () => {
  test('a save scheduled before a push stores the state after the push', async () => {
    const path = '/a.org';
    let state = loadedState(path, '* A\n', {
      isDirty: true,
      lastSyncAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    saveEditedFileDebounced(() => state, path);
    saveEditedFileDebounced(() => state, path);

    // The push finishes before the debounced save runs.
    const pushedAt = new Date('2026-10-09T12:00:00.000Z');
    state = loadedState(path, '* A\n', { isDirty: false, lastSyncAt: pushedAt });
    await new Promise((resolve) => setTimeout(resolve, 3500));

    expect(await fileStore.getFileRecord(path)).toMatchObject({
      isDirty: false,
      lastSyncAt: pushedAt.toISOString(),
    });
  }, 10000);
});

describe('opening a file whose unsynced local copy was not loaded', () => {
  // Minimal store: runs thunks, records plain actions.
  const createStore = (client) => {
    const state = {
      org: { present: fromJS({ files: {}, fileSettings: [], path: '/other.org' }) },
      syncBackend: Map({ client }),
      base: Map({ online: true, isLoading: List() }),
    };
    const actions = [];
    const dispatch = (action) =>
      typeof action === 'function' ? action(dispatch, () => state) : actions.push(action);
    return { dispatch, actions };
  };

  test('loads the local copy instead of downloading the remote version', async () => {
    await fileStore.putFileRecord({
      path: '/a.org',
      contents: '* Unsynced edits\n',
      isDirty: true,
      lastSyncAt: '2026-01-01T00:00:00.000Z',
    });
    const client = {
      getFileContents: jest.fn(() => Promise.resolve('* Remote\n')),
      getFileContentsAndMetadata: jest.fn(() => new Promise(() => {})),
    };
    const { dispatch, actions } = createStore(client);

    dispatch(downloadFile('/a.org'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(client.getFileContents).not.toHaveBeenCalled();
    expect(actions).toContainEqual({
      type: 'PARSE_FILE',
      path: '/a.org',
      contents: '* Unsynced edits\n',
    });
    expect(actions).toContainEqual({ type: 'SET_DIRTY', isDirty: true, path: '/a.org' });
    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* Unsynced edits\n',
      isDirty: true,
    });
  });

  test('downloads as usual when the local copy has no unsynced edits', async () => {
    await fileStore.putFileRecord({ path: '/a.org', contents: '* Old\n', isDirty: false });
    const client = {
      getFileContents: jest.fn(() => Promise.resolve('* Remote\n')),
      createFile: jest.fn(() => Promise.resolve()),
    };
    const { dispatch } = createStore(client);

    dispatch(downloadFile('/a.org'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(client.getFileContents).toHaveBeenCalledWith('/a.org');
  });
});

describe('downloads with the real store', () => {
  const createRealStore = (client) => {
    const state = readInitialState();
    state.base = state.base.set('online', true);
    state.syncBackend = state.syncBackend.set('client', client);
    state.org.present = state.org.present.set('path', '/a.org');
    return createStore(rootReducer, state, applyMiddleware(thunk));
  };
  const titlesOf = (store, path) =>
    store
      .getState()
      .org.present.getIn(['files', path, 'headers'])
      .map((header) => header.getIn(['titleLine', 'rawTitle']))
      .toJS();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // E.g. the opened file is also loaded on startup: `OrgFile` and `Entry`
  // both download it.
  test('a second download does not replace a restored unsynced copy', async () => {
    await fileStore.putFileRecord({
      path: '/a.org',
      contents: '* Unsynced edits\n',
      isDirty: true,
      lastSyncAt: '2026-01-01T00:00:00.000Z',
    });
    const client = {
      getFileContents: jest.fn(() => Promise.resolve('* Remote\n')),
      getFileContentsAndMetadata: jest.fn(() => new Promise(() => {})),
      createFile: jest.fn(() => Promise.resolve()),
    };
    const store = createRealStore(client);

    store.dispatch(downloadFile('/a.org'));
    store.dispatch(downloadFile('/a.org'));
    await wait(100);

    expect(client.getFileContents).not.toHaveBeenCalled();
    expect(titlesOf(store, '/a.org')).toEqual(['Unsynced edits']);
    expect(store.getState().org.present.getIn(['files', '/a.org', 'isDirty'])).toBe(true);
    expect(await fileStore.getFileRecord('/a.org')).toMatchObject({
      contents: '* Unsynced edits\n',
      isDirty: true,
    });
  });

  test('a download that arrives after unsynced edits were loaded does not replace them', async () => {
    let finishDownload;
    const client = {
      getFileContents: jest.fn(
        () =>
          new Promise((resolve) => {
            finishDownload = resolve;
          })
      ),
      getFileContentsAndMetadata: jest.fn(() => new Promise(() => {})),
      createFile: jest.fn(() => Promise.resolve()),
    };
    const store = createRealStore(client);

    store.dispatch(downloadFile('/a.org'));
    await wait(50);
    expect(client.getFileContents).toHaveBeenCalled();
    // Meanwhile, unsynced edits of the file are loaded.
    store.dispatch({ type: 'PARSE_FILE', path: '/a.org', contents: '* Unsynced edits\n' });
    store.dispatch({ type: 'SET_DIRTY', isDirty: true, path: '/a.org' });
    finishDownload('* Remote\n');
    await wait(50);

    expect(titlesOf(store, '/a.org')).toEqual(['Unsynced edits']);
    expect(store.getState().org.present.getIn(['files', '/a.org', 'isDirty'])).toBe(true);
  });
});
