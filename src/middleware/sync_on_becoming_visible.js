import { sync } from '../actions/org';
import { debounce } from 'lodash';

const dispatchSync = store => store.dispatch(sync({ shouldSuppressMessages: true }));

// The 'visibilitychange' event might get triggered in some browsers many times for one 'real'
// event of the browser becoming visible to the user. Debouncing through lodash ensures that
// it is called at maximum once every second.
var debouncedDispatchSync = debounce(dispatchSync, 1000);

export default store => next => action => {
  window.addEventListener('visibilitychange', () => {
    if (store.getState().base.get('shouldSyncOnBecomingVisibile')) {
      debouncedDispatchSync(store);
    }
  });

  return next(action);
};
