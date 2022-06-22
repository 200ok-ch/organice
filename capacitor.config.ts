import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.twohundredok.organice',
  appName: 'organice',
  webDir: 'release',
  bundledWebRuntime: false,
  server: {
    // hostname: 'localhost', // default: localhost
    // iosScheme: 'organice', // default: ionic
    // androidScheme: 'organice', // default: http
    // allowNavigation: ['https://gitlab.com'],

    // To allow http requests to WebDAV server. Not need to force
    // users to use https.
    cleartext: true
  }
};

export default config;
