import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.twohundredok.organice',
  appName: 'organice',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    // hostname: 'localhost', // default: localhost
    // iosScheme: 'organice', // default: ionic
    // androidScheme: 'organice', // default: http
    // allowNavigation: ['https://gitlab.com']
  }
};

export default config;
