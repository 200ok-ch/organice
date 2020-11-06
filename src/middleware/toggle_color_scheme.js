import { setColorScheme } from '../actions/base';

export default (store) => (next) => (action) => {
  // Watch if the user changes the preferred color scheme through the
  // OS or browser.

  // Returns a MediaQueryList object
  const prefersColorSchemeMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  // Feature detection. If there's no dark mode (i.e. iOS <14), then
  // the `matchMedia` query above does not resolve in anything that
  // can be observed.
  if ('addEventListener' in prefersColorSchemeMediaQueryList) {
    prefersColorSchemeMediaQueryList.addEventListener('change', (e) => {
      const selectedColorScheme = e.matches ? 'Dark' : 'Light';
      store.dispatch(setColorScheme(selectedColorScheme));
    });
  }

  return next(action);
};
