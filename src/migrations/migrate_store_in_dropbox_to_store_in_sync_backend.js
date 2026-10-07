import { localStorageAvailable } from '../util/settings_persister';
import { safeSetItem } from '../util/local_storage';

export default () => {
  if (!localStorageAvailable) {
    return;
  }

  const shouldStoreSettingsInDropbox = localStorage.getItem('shouldStoreSettingsInDropbox');
  if (!shouldStoreSettingsInDropbox) {
    return;
  }

  if (safeSetItem('shouldStoreSettingsInSyncBackend', shouldStoreSettingsInDropbox)) {
    localStorage.removeItem('shouldStoreSettingsInDropbox');
  }
};
