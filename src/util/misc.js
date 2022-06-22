import { createBrowserHistory } from 'history';

// Hard-wrap long lines - from https://stackoverflow.com/a/51506718/252585
export const formatTextWrap = (text, w) => {
  return text.replace(new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n');
};

/* See adr-002 for details.
  `isLandingPage` is a function that can be used to create certain
   safeguards, i.e. not loading some CSS where not appropriate. */

export const isLandingPage = () => {
  const history = createBrowserHistory();
  return (
    !window.testRunner &&
    history.location.pathname === '/' &&
    !localStorage.authenticatedSyncService
  );
};
