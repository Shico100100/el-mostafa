import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elmostafa.erp',
  appName: 'المصطفى ERP',
  webDir: '.next',
  server: {
    url: process.env.CAPACITOR_SERVER_URL,
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
