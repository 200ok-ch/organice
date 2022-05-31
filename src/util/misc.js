import { createBrowserHistory } from 'history';

// Hard-wrap long lines - from https://stackoverflow.com/a/51506718/252585
export const formatTextWrap = (text, w) => {
  return text.replace(new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n');
};

/* INFO: organice runs different kinds of pages:
 1. Landing Page
 2. The actual application

 These two do not share a whole lot in common. However, they run from
 the same <App /> component which already has the assumption that
 it'll contain the actual application, not a content page like the LP.
 `isLandingPage` is a function that can be used to create certain
 safeguards, i.e. not loading some CSS where not appropriate.

 This might seem convoluted and maybe there is a better solution. The
 only other solution that I could think of was to `yarn eject` from
 `react-scripts`, so that we could have multiple starting HTML files
 for multiple SPAs. This has the following downsides, though:

 1. `react-scripts` is a great wrapper which we cannot use anymore.
 2. Related to 1: Ejecting will create dozens of files which will have
    to be maintained manually.

 These downsides seemed larger than creating workarounds/safeguards
 like `isLandingPage`.
 */

export const isLandingPage = () => {
  const history = createBrowserHistory();
  return !window.testRunner && history.location.pathname === '/';
};
