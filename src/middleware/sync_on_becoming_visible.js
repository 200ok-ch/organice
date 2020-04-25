import { sync } from '../actions/org';
import { getHiddenProp, isBrowserHidden } from '../lib/browser_utils';
import { debounce } from 'lodash';

const dispatchSync = (store) => store.dispatch(sync({ shouldSuppressMessages: true }));

// The 'visibilitychange' event might get triggered in some browsers many times for one 'real'
// event of the browser becoming visible to the user. Debouncing through lodash ensures that
// it is called at maximum once every second.
const debouncedDispatchSync = debounce(dispatchSync, 1000);

export default (store) => (next) => (action) => {
  let visProp = getHiddenProp();
  if (visProp) {
    const evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
    document.addEventListener(evtname, () => {
      if (
        store.getState().syncBackend.get('client') &&
        store.getState().base.get('shouldSyncOnBecomingVisibile')
      ) {
        if (isBrowserHidden()) {
          // TODO: Remember that the browser was in the background
        }
        // TODO: If the browser previously was in the background, the
        // sync might be stuck, hence: Force the sync.
        debouncedDispatchSync(store);
      }
    });
  }

  return next(action);
};
