import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.busbuddy.driver',
  appName: 'BusBuddy',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#B045FF'
    }
  }
};

export default config;
