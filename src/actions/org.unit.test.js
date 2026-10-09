import { Map, Set, fromJS } from 'immutable';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import rootReducer from '../reducers';
import { parseOrg } from '../lib/parse_org';
import { readInitialState } from '../util/settings_persister';
import { insertCaptureFromHeader, insertPendingCapture, sync, updateHeaderTitle } from './org';

// Sync first checks for an unsynced local copy (asynchronously) before
// fetching the file.
const flushPromises = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('org actions', () => {
  describe('sync', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('syncs the dirty file instead of falling back to the currently viewed file', async () => {
      jest.useFakeTimers();

      const client = {
        getFileContentsAndMetadata: jest.fn(() => new Promise(() => {})),
      };
      const state = {
        base: Map({
          online: true,
          isLoading: Set(),
        }),
        syncBackend: Map({ client }),
        org: {
          present: Map({
            path: '/a.org',
            files: Map({
              '/a.org': Map({ isDirty: false }),
              '/b.org': Map({ isDirty: true }),
            }),
          }),
        },
      };
      const dispatch = (action) => {
        if (typeof action === 'function') {
          action(dispatch, () => state);
        }
      };

      dispatch(sync({ successMessage: 'Item captured' }));
      await flushPromises();

      expect(client.getFileContentsAndMetadata).toHaveBeenCalledWith('/b.org');
      expect(client.getFileContentsAndMetadata).not.toHaveBeenCalledWith('/a.org');
    });
  });

  describe('editing while a push is in progress', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('keeps the file unsynced and pushes the edits afterwards', async () => {
      jest.useFakeTimers();

      let finishPush;
      const client = {
        getFileContentsAndMetadata: jest.fn(() =>
          Promise.resolve({ contents: '* Main\n', lastModifiedAt: '2020-01-01T00:00:00.000Z' })
        ),
        updateFile: jest.fn(
          () =>
            new Promise((resolve) => {
              finishPush = resolve;
            })
        ),
      };
      const state = readInitialState();
      state.base = state.base.set('online', true);
      state.syncBackend = state.syncBackend.set('client', client);
      state.org.present = state.org.present.set('path', '/a.org').set(
        'files',
        Map({
          '/a.org': parseOrg('* Main\n')
            .set('isDirty', true)
            .set('lastSyncAt', new Date('2026-01-01T00:00:00.000Z')),
        })
      );
      const store = createStore(rootReducer, state, applyMiddleware(thunk));

      store.dispatch(sync({ path: '/a.org' }));
      await flushPromises();
      expect(client.updateFile).toHaveBeenCalledTimes(1);

      // Edit while the push is in progress, then let the push succeed.
      const headerId = store.getState().org.present.getIn(['files', '/a.org', 'headers', 0, 'id']);
      store.dispatch(updateHeaderTitle(headerId, 'Edited during push'));
      finishPush();
      await flushPromises();

      expect(store.getState().org.present.getIn(['files', '/a.org', 'isDirty'])).toBe(true);

      // The edits are pushed with the next sync.
      jest.advanceTimersByTime(3500);
      await flushPromises();
      expect(client.updateFile).toHaveBeenCalledTimes(2);
      expect(client.updateFile).toHaveBeenLastCalledWith(
        '/a.org',
        expect.stringContaining('Edited during push')
      );
    });
  });

  describe('insertPendingCapture', () => {
    it('inserts into the template target file even when another file is open', () => {
      const state = readInitialState();
      const template = fromJS({
        description: 'Inbox',
        headerPaths: ['Inbox'],
        iconName: 'inbox',
        id: 'capture-to-b',
        isAvailableInAllOrgFiles: false,
        letter: '',
        file: '/b.org',
        orgFilesWhereAvailable: ['/a.org'],
        shouldPrepend: false,
        template: '* TODO %?',
      });

      state.base = state.base.set('online', false);
      state.org.present = state.org.present
        .set('path', '/a.org')
        .set(
          'pendingCapture',
          Map({
            capturePath: '/a.org',
            captureTemplateName: 'Inbox',
            captureContent: 'Captured in B',
            customCaptureVariables: Map(),
          })
        )
        .set(
          'files',
          Map({
            '/a.org': parseOrg('* Main\n'),
            '/b.org': parseOrg('* Inbox\n'),
          })
        );
      state.capture = state.capture.set(
        'captureTemplates',
        state.capture.get('captureTemplates').push(template)
      );

      const store = createStore(rootReducer, state, applyMiddleware(thunk));

      store.dispatch(insertPendingCapture());

      const titlesInA = store
        .getState()
        .org.present.getIn(['files', '/a.org', 'headers'])
        .map((header) => header.getIn(['titleLine', 'rawTitle']))
        .toJS();
      const titlesInB = store
        .getState()
        .org.present.getIn(['files', '/b.org', 'headers'])
        .map((header) => header.getIn(['titleLine', 'rawTitle']))
        .toJS();

      expect(titlesInA).toEqual(['Main']);
      expect(titlesInB).toEqual(['Inbox', 'Captured in B']);
    });
  });

  describe('insertCaptureFromHeader', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('syncs the template target file after capturing from the editor', async () => {
      jest.useFakeTimers();

      const state = readInitialState();
      const client = {
        getFileContentsAndMetadata: jest.fn(() => new Promise(() => {})),
      };
      const template = fromJS({
        description: 'Capture to target',
        headerPaths: [],
        iconName: 'inbox',
        id: 'editor-capture-to-target',
        isAvailableInAllOrgFiles: true,
        letter: '',
        file: '/target.org',
        orgFilesWhereAvailable: [],
        shouldPrepend: false,
        template: '* TODO %?',
      });
      const header = parseOrg('* TODO Captured from editor\n').get('headers').first();

      state.base = state.base.set('online', true);
      state.syncBackend = state.syncBackend.set('client', client);
      state.org.present = state.org.present.set('path', '/a.org').set(
        'files',
        Map({
          '/a.org': parseOrg('* Main\n'),
          '/target.org': parseOrg('* Target\n'),
        })
      );
      state.capture = state.capture.set(
        'captureTemplates',
        state.capture.get('captureTemplates').push(template)
      );

      const store = createStore(rootReducer, state, applyMiddleware(thunk));

      store.dispatch(insertCaptureFromHeader(template.get('id'), header, false));

      await flushPromises();

      expect(client.getFileContentsAndMetadata).toHaveBeenCalledWith('/target.org');
      expect(client.getFileContentsAndMetadata).not.toHaveBeenCalledWith('/a.org');
    });
  });
});
