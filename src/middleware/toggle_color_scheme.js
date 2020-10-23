import { setColorScheme } from '../actions/base';

export default (store) => (next) => (action) => {
  // Watch if the user changes the preferred color scheme through the
  // OS or browser.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const selectedColorScheme = e.matches ? 'Dark' : 'Light';
    store.dispatch(setColorScheme(selectedColorScheme));
  });

  return next(action);
};
