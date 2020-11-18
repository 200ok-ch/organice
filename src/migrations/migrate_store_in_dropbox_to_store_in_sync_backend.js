import { localStorageAvailable } from '../util/settings_persister';

export default () => {
  if (!localStorageAvailable) {
    return;
  }

  const shouldStoreSettingsInDropbox = localStorage.getItem('shouldStoreSettingsInDropbox');
  if (!shouldStoreSettingsInDropbox) {
    return;
  }

  localStorage.setItem('shouldStoreSettingsInSyncBackend', shouldStoreSettingsInDropbox);
  localStorage.removeItem('shouldStoreSettingsInDropbox');
};
