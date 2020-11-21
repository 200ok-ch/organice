import { debounce } from 'lodash';
import { parseISO, addSeconds } from 'date-fns';
import { localStorageAvailable } from '../util/settings_persister';
import { exportOrg } from '../lib/export_org';
import { parseFile } from '../reducers/org';
import { STATIC_FILE_PREFIX } from '../lib/org_utils';

export const persistIsDirty = (isDirty, path) => {
  if (localStorageAvailable) {
    const filesDirty = JSON.parse(localStorage.getItem('isDirty')) || {};
    filesDirty[path] = isDirty;
    localStorage.setItem('isDirty', JSON.stringify(filesDirty));
  }
};

export const saveFileContentsToLocalStorage = (path, contents) => {
  if (localStorageAvailable && !path.startsWith(STATIC_FILE_PREFIX)) {
    let persistedFiles = JSON.parse(localStorage.getItem('persistedFiles'));
    persistedFiles = persistedFiles || {};

    localStorage.setItem('files__' + path, contents);
    persistedFiles[path] = addSeconds(new Date(), 5);

    localStorage.setItem('persistedFiles', JSON.stringify(persistedFiles));
  }
};

const saveFunctionToDebounce = (state, path) => {
  if (localStorageAvailable && !path.startsWith(STATIC_FILE_PREFIX)) {
    const persistedFiles = JSON.parse(localStorage.getItem('persistedFiles')) || {};

    const contents = exportOrg({
      headers: state.org.present.getIn(['files', path, 'headers']),
      linesBeforeHeadings: state.org.present.getIn(['files', path, 'linesBeforeHeadings']),
      dontIndent: state.base.get('shouldNotIndentOnExport'),
    });
    localStorage.setItem('files__' + path, contents);

    persistedFiles[path] = state.org.present.getIn(['files', path, 'lastSyncAt']);
    localStorage.setItem('persistedFiles', JSON.stringify(persistedFiles));
  }
};
const getDebouncedSaveFunction = () =>
  debounce(saveFunctionToDebounce, 3000, {
    leading: true,
    trailing: true,
  });
const debouncedSaveFunctions = {};
export const saveFileToLocalStorage = (state, path) => {
  // to make sure no file is skipped when multiple files are dirty
  // a seperately debounced function is used per file
  let debouncedSaveFunction = debouncedSaveFunctions[path];
  if (!debouncedSaveFunction) {
    debouncedSaveFunctions[path] = getDebouncedSaveFunction();
    debouncedSaveFunction = debouncedSaveFunctions[path];
  }
  debouncedSaveFunction(state, path);
};

export const loadFilesFromLocalStorage = (state) => {
  if (localStorageAvailable) {
    const persistedFiles = JSON.parse(localStorage.getItem('persistedFiles')) || {};
    const isDirty = JSON.parse(localStorage.getItem('isDirty')) || {};
    Object.entries(persistedFiles).forEach(([path, lastSyncAt]) => {
      const contents = localStorage.getItem('files__' + path);
      if (contents) {
        state.org.present = state.org.present.update((org) => parseFile(org, { path, contents }));
        state.org.present = state.org.present.setIn(
          ['files', path, 'lastSyncAt'],
          parseISO(lastSyncAt)
        );
        state.org.present = state.org.present.setIn(['files', path, 'isDirty'], isDirty[path]);
      }
    });
  }
  return state;
};
