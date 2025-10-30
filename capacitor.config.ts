
import { Capacitor } from '@capacitor/core';

const config = {
  appId: 'com.studyhub.app',
  appName: 'SunnySideUp',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#4F46E5',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
    BarcodeScanner: {
      scanAreaWidth: 250,
      scanAreaHeight: 250,
    },
  },
};

export default config;