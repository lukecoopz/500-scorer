import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fivehundredscorer.app',
  appName: '500 Score Keeper',
  webDir: 'dist',
  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
