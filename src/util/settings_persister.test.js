import Store from '../store';
import { readInitialState, subscribeToChanges } from './settings_persister';

describe('Settings persister', () => {
  let store;
  beforeEach(() => {
    const initialState = readInitialState();
    store = Store(initialState);
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('Do not persist nonsense values like like "undefined"', () => {
    subscribeToChanges(store)();
    expect(localStorage.getItem('colorScheme')).toBe(null);
  });
});
