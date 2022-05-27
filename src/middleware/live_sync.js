import { sync } from '../actions/org';
import {
  persistIsDirty,
  saveFileToLocalStorage,
  removeFileFromLocalStorage,
} from '../util/file_persister';
import { determineAffectedFiles } from '../reducers/org';

export default (store) => (next) => (action) => {
  // if a file got deleted in the back end, remove it and continue
  if (action.type === 'REMOVE_ORG_FILE') {
    setTimeout(() => {
      removeFileFromLocalStorage(action.path);
    }, 0);

    return next(action);
  }

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
