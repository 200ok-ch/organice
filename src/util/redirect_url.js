import { Capacitor } from '@capacitor/core';

export const redirectUrl = () => {
  // https://capacitorjs.com/docs/core-apis/web#isnativeplatform
  if (Capacitor.isNativePlatform()) return 'https://organice.200ok.ch/'

  return window.location.origin + '/';
};
