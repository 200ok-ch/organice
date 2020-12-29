import { debounce } from 'lodash';
import { sync } from '../actions/org';
import { STATIC_FILE_PREFIX } from '../lib/org_utils';

const dispatchSync = (store) => {
  if (
    store.getState().syncBackend.get('client') &&
    store.getState().base.get('shouldSyncOnBecomingVisibile')
  ) {
    const path = store.getState().org.present.get('path');
    const filesToLoadOnStartup = store
      .getState()
      .org.present.get('fileSettings')
      .filter((setting) => setting.get('loadOnStartup'))
      .map((setting) => setting.get('path'));
    if (
      path &&
      !path.startsWith(STATIC_FILE_PREFIX) &&
      !filesToLoadOnStartup.find((filepath) => path === filepath)
    ) {
      filesToLoadOnStartup.push(path);
    }
    filesToLoadOnStartup.forEach((path) =>
      sync({ path, shouldSuppressMessages: true })(store.dispatch, store.getState)
    );
  }
};

// The 'visibilitychange' event might get triggered in some browsers many times for one 'real'
// event of the browser becoming visible to the user. Debouncing through lodash ensures that
// it is called at maximum once every second.
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

export default (store) => (next) => (action) => {
  let visProp = getHiddenProp();
  if (visProp) {
    const evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
    document.addEventListener(evtname, () => debouncedDispatchSync(store));
  }

  return next(action);
};
