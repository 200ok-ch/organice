import { sync } from '../actions/org';
import { setDisappearingLoadingMessage } from '../actions/base';
import { saveEditedFileDebounced } from '../util/file_persister';
import { determineAffectedFiles } from '../reducers/org';

// Paths for which the user has already been warned in this session,
// so that every further edit doesn't repeat the warning.
const pathsWarnedAboutLocalSave = new Set();

const warnAboutFailedLocalSave = (store, path) => {
  if (pathsWarnedAboutLocalSave.has(path)) return;
  pathsWarnedAboutLocalSave.add(path);
  store.dispatch(
    setDisappearingLoadingMessage(
      `Could not store changes to ${path} locally. Sync before closing organice.`,
      5000
    )
  );
};

export default (store) => (next) => (action) => {
  // middleware is run before the reducer. to persist the result of the action,
  // save and sync are done in a callback so they happen after the state is changed
  setTimeout(() => {
    let dirtyFiles = determineAffectedFiles(store.getState().org.present, action);

    const onFailure = (path) => warnAboutFailedLocalSave(store, path);
    dirtyFiles.forEach((path) => saveEditedFileDebounced(store.getState, path, onFailure));

    if (store.getState().base.get('shouldLiveSync')) {
      dirtyFiles.forEach((path) => store.dispatch(sync({ shouldSuppressMessages: true, path })));
    }
  }, 0);

  return next(action);
};
