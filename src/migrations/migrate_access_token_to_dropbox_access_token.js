import { localStorageAvailable } from '../util/settings_persister';
import { safeSetItem } from '../util/local_storage';

export default () => {
  if (!localStorageAvailable) {
    return;
  }

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    return;
  }

  if (safeSetItem('dropboxAccessToken', accessToken)) {
    localStorage.removeItem('accessToken');
  }
};
