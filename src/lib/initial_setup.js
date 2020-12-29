import { setPath } from '../actions/org';

// Generally, opening files and other routing is done with the
// `react-router-dom` package (i.e. `<Link/ > tags). However, organice
// also should react to browser buttons.
export function listenToBrowserButtons(store) {
  const path = store.getState().org.present.get('path');

  const urlPathMatch = window.location.href.match(/.*file(\/.*)/);

  let urlPath = path;

  // The user has gone 'back' or 'forward' and is showing a 'file'
  // URL.
  if (urlPathMatch) {
    urlPath = urlPathMatch[1];
  }

  window.onpopstate = function () {
    // If the current 'path' in Redux is not the same as the one in
    // the URL.
    if (path !== urlPath) {
      store.dispatch(setPath(path));
    }
  };
}
