import { isLocalStorageAvailable } from '../util/settings_persister';

export default () => {
  if (!isLocalStorageAvailable) {
    return;
  }

  const shouldStoreSettingsInDropbox = localStorage.getItem('shouldStoreSettingsInDropbox');
  if (!shouldStoreSettingsInDropbox) {
    return;
  }

  localStorage.setItem('shouldStoreSettingsInSyncBackend', shouldStoreSettingsInDropbox);
  localStorage.removeItem('shouldStoreSettingsInDropbox');
};
