import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.twohundredok.organice',
  appName: 'organice',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    hostname: 'app',
    androidScheme: 'organice'
  }
};

export default config;
