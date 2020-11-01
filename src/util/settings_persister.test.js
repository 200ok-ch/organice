import Store from '../store';
import { readInitialState, subscribeToChanges } from './settings_persister';

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
    expect(localStorage.getItem('colorScheme')).toBe('Light');
  });
});
