import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.busbuddy.driver',
  appName: 'BusBuddy',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    hostname: 'bus-tracker-app-b227b.firebaseapp.com'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#B045FF'
    }
  }
};

export default config;
