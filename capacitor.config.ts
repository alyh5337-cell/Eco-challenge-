import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecochallenge.app',
  appName: 'Eco Challenge',
  // In Vite/React, the build output directory is 'dist'.
  // If exporting as static Next.js (output: 'export'), change this to 'out'.
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Camera: {
      // Directs native camera to save photos for challenge proof uploads
      saveToGallery: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#062316',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#062316',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
};

export default config;
