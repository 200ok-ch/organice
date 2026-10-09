import Store from '../store';
import { readInitialState, subscribeToChanges } from './settings_persister';
import { restoreBaseSettings, setShouldLiveSync } from '../actions/base';

describe('Settings persister', () => {
  let store;
  beforeEach(() => {
    const initialState = readInitialState();
    store = Store(initialState);
    subscribeToChanges(store)();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('Do not persist nonsense like like "false" for settings without default', () => {
    expect(localStorage.getItem('showClockDisplay')).not.toBe('false');
    expect(localStorage.getItem('showClockDisplay')).toBe(null);
  });

  test('Does persist given default values, for example colorScheme', () => {
    expect(localStorage.getItem('colorScheme')).toBe('OS');
  });

  describe('Boolean settings that default to true', () => {
    beforeEach(() => {
      // Avoid pushing the changed settings to a (non-existent) sync backend.
      store.dispatch(restoreBaseSettings({ shouldStoreSettingsInSyncBackend: false }));
    });

    test('Persists false to localStorage', () => {
      store.dispatch(setShouldLiveSync(false));
      subscribeToChanges(store)();
      expect(localStorage.getItem('shouldLiveSync')).toBe('false');
    });

    test('Restores false from localStorage', () => {
      localStorage.setItem('shouldLiveSync', 'false');
      expect(readInitialState().base.get('shouldLiveSync')).toBe(false);
    });

    test('Keeps false after a reload', () => {
      store.dispatch(setShouldLiveSync(false));
      subscribeToChanges(store)();
      expect(readInitialState().base.get('shouldLiveSync')).toBe(false);
    });

    test('Falls back to the default when nothing is stored', () => {
      localStorage.clear();
      expect(readInitialState().base.get('shouldLiveSync')).toBe(true);
    });
  });
});
