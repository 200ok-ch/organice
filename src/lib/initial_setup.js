import { debounce } from 'lodash';

import { setPath, sync } from '../actions/org';
import { setIsOnline } from '../actions/base';
import { STATIC_FILE_PREFIX } from './org_utils';

// When offline, don't sync and don't enable sync button. When online,
// enable sync button. When newly online, force sync of all things
// possibly dirty.
export function listenToNetworkConnectionEvents(store) {
  // Is the user online when starting up the application?
  store.dispatch(setIsOnline(navigator.onLine));

  window.onoffline = function () {
    store.dispatch(setIsOnline(false));
  };

  window.ononline = function () {
    store.dispatch(setIsOnline(true));
    // Add grace period, because browsers might get the event `onLine`
    // too soon to actually do network requests.
    setTimeout(() => {
      sync({ shouldSuppressMessages: true, forceAction: 'manual' })(store.dispatch, store.getState);
    }, 2000);
  };
}

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

// BEGIN: Sync on Becoming Visible

const dispatchSync = (store) => {
  if (
    store.getState().syncBackend.get('client') &&
    store.getState().base.get('shouldSyncOnBecomingVisibile')
  ) {
    const path = store.getState().org.present.get('path');
    let filesToLoadOnStartup = store
      .getState()
      .org.present.get('fileSettings')
      .filter((setting) => setting.get('loadOnStartup'))
      .map((setting) => setting.get('path'));
    if (
      path &&
      !path.startsWith(STATIC_FILE_PREFIX) &&
      !filesToLoadOnStartup.find((filepath) => path === filepath)
    ) {
      filesToLoadOnStartup = filesToLoadOnStartup.push(path);
    }
    filesToLoadOnStartup.forEach((path) => {
      sync({ path, shouldSuppressMessages: true })(store.dispatch, store.getState);
    });
  }
};

// The 'visibilitychange' event might get triggered in some browsers
// many times for one 'real' event of the browser becoming visible to
// the user. Debouncing through lodash ensures that it is called at
// maximum once every second.
const debouncedDispatchSync = debounce(dispatchSync, 1000);

// Dealing with vendor prefixes
function getHiddenProp() {
  const prefixes = ['webkit', 'moz', 'ms', 'o'];

  // if 'hidden' is natively supported just return it
  if ('hidden' in document) return 'hidden';

  // otherwise loop over all the known prefixes until we find one
  for (let i = 0; i < prefixes.length; i++) {
    if (prefixes[i] + 'Hidden' in document) return prefixes[i] + 'Hidden';
  }

  // otherwise it's not supported
  return null;
}

export function syncOnBecomingVisible(store) {
  let visProp = getHiddenProp();
  if (visProp) {
    const evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
    document.addEventListener(evtname, () => debouncedDispatchSync(store));
  }
}

// END: Sync on Becoming Visible
