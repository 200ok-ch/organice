import Bowser from 'bowser';

const browser = Bowser.getParser(window.navigator.userAgent);

/** Is the browser Mobile Safari with iOS version of at least 13, but
less than 13.3 */
export const isMobileSafari13 = (() => {
  return (
    browser.satisfies({
      mobile: {
        safari: '>=13',
      },
    }) &&
    browser.satisfies({
      mobile: {
        safari: '<13.0.4',
      },
    })
  );
})();

/** Is the OS iOS or Android? */
export const isMobileBrowser = (() => {
  return browser.satisfies({
    mobile: {
      safari: '>=6',
      'android browser': '>3',
    },
  });
})();

/** Is iPhone Model X (tested with Xs) */
export const isIphoneX = window.matchMedia
  ? window.matchMedia('(max-device-width: 812px) and (-webkit-device-pixel-ratio : 3)').matches
  : false;

/** Is iPhone Model 6, 7 or 8 (tested with 6s) */
export const isIphone678 = window.matchMedia
  ? window.matchMedia('(min-device-width: 375px) and (-webkit-device-pixel-ratio : 2)').matches
  : false;

/** Is running in standalone mode (not in Mobile Safari) */
export const isRunningAsPWA = 'standalone' in window.navigator && window.navigator.standalone;

/** Is running in Landscape Mode (as opposed to Portait Mode) */
export function isInLandscapeMode() {
  return [90, -90].includes(window.orientation);
}

// Dealing with vendor prefixes
export function getHiddenProp() {
  const prefixes = ['webkit', 'moz', 'ms', 'o'];

  // if 'hidden' is natively supported just return it
  if ('hidden' in document) return 'hidden';

  // otherwise loop over all the known prefixes until we find one
  for (let i = 0; i < prefixes.length; i++) {
    if (prefixes[i] + 'Hidden' in document) return prefixes[i] + 'Hidden';
  }

  // otherwise it's not supported
  return null;
}

/** Return `true` if the browser is hidden/in the background */
export function isBrowserHidden() {
  return document[getHiddenProp()];
}
