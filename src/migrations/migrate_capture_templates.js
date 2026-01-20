import { localStorageAvailable } from '../util/settings_persister';

export default () => {
  if (!localStorageAvailable) {
    return;
  }

  let captureTemplates = JSON.parse(localStorage.getItem('captureTemplates'));
  captureTemplates = captureTemplates || {};

  captureTemplates.forEach(t => {
    if (!t.hasOwnProperty('shouldCaptureAsNewHeader')) {
      t.shouldCaptureAsNewHeader = true
    }
  });

  localStorage.setItem('captureTemplates', JSON.stringify(captureTemplates));
};
