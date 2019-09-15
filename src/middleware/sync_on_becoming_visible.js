import { sync } from '../actions/org';
import { debounce } from 'lodash';

const dispatchSync = store => store.dispatch(sync({ shouldSuppressMessages: true }));

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

export default store => next => action => {
  let visProp = getHiddenProp();
  if (visProp) {
    const evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
    document.addEventListener(evtname, () => {
      if (store.getState().base.get('shouldSyncOnBecomingVisibile')) {
        debouncedDispatchSync(store);
      }
    });
  }

  return next(action);
};
