import { sync } from '../actions/org';
import { debounce } from 'lodash';

function dispatchSync(store) {
  store.dispatch(sync({ shouldSuppressMessages: true }));
}

// The 'visibilitychange' event might get triggered in some browsers
// many times for one 'real' event of the browser becoming visible to
// the user. In my tests it could easily be 25 times. Debouncing
// through lodash ensures that it is called at maximum once every
// second.
var debouncedDispatchSync = debounce(dispatchSync, 1000);

export default store => next => action => {
  // This will get called multiple times, so one might assume that
  // the event listener is registered multiple times. However, this
  // is not the case:
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Multiple_identical_event_listeners
  window.addEventListener('visibilitychange', function() {
    if (store.getState().base.get('shouldSyncOnBecomingVisibile')) {
      debouncedDispatchSync(store);
    }
  });

  return next(action);
};
