import { createBrowserHistory } from 'history';

// Hard-wrap long lines - from https://stackoverflow.com/a/51506718/252585
export const formatTextWrap = (text, w) => {
  return text.replace(new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n');
};

export const isLandingPage = () => {
  const history = createBrowserHistory();
  return history.location.pathname === '/';
};
