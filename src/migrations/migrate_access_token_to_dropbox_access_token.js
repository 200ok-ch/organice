import { localStorageAvailable } from '../util/settings_persister';

export default () => {
  if (!localStorageAvailable) {
    return;
  }

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    return;
  }

  localStorage.setItem('dropboxAccessToken', accessToken);
  localStorage.removeItem('accessToken');
};
