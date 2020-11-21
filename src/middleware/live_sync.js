import { sync } from '../actions/org';
import { persistIsDirty, saveFileToLocalStorage } from '../util/file_persister';
import { determineAffectedFiles } from '../reducers/org';

export default (store) => (next) => (action) => {
  // middleware is run before the reducer. to persist the result of the action,
  // save and sync are done in a callback so they happen after the state is changed
  setTimeout(() => {
    let dirtyFiles = determineAffectedFiles(store.getState().org.present, action);

    dirtyFiles.forEach((path) => saveFileToLocalStorage(store.getState(), path));
    dirtyFiles.forEach((path) => persistIsDirty(true, path));

    if (store.getState().base.get('shouldLiveSync')) {
      dirtyFiles.forEach((path) => store.dispatch(sync({ shouldSuppressMessages: true, path })));
    }
  }, 0);

  return next(action);
};
