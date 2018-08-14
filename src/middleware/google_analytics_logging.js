/* global ga */

export default store => next => action => {
  let { type, ...payload } = action;

  const eventFieldsToRedact = {
    'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING': ['directoryListing'],
    'AUTHENTICATE': ['accessToken'],
    'DISPLAY_FILE': ['contents'],
  };

  if (!!eventFieldsToRedact[type]) {
    eventFieldsToRedact[type].forEach(field => {
      payload = {...payload, [field]: '--REDACTED--'};
    });
  }

  ga('send', 'event', 'action', type, JSON.stringify(payload));

  return next(action);
};
