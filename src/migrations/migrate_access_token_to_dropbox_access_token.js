import { isLocalStorageAvailable } from '../util/settings_persister';

export default () => {
  if (!isLocalStorageAvailable) {
    return;
  }

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    return;
  }

  localStorage.setItem('dropboxAccessToken', accessToken);
  localStorage.removeItem('accessToken');
};
