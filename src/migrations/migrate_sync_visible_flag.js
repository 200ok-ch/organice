import { isLocalStorageAvailable } from '../util/settings_persister';

// Fixes a typo in the config: `visibile` !== `visible`
export default () => {
  if (!isLocalStorageAvailable) {
    return;
  }

  const shouldSyncOnBecomingVisible = localStorage.getItem('shouldSyncOnBecomingVisibile');
  if (!shouldSyncOnBecomingVisible) {
    return;
  }

  localStorage.setItem('shouldSyncOnBecomingVisible', shouldSyncOnBecomingVisible);
  localStorage.removeItem('shouldSyncOnBecomingVisibile');
};
