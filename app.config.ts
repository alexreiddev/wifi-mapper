import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WiFi Mapper',
  slug: 'wifi-mapper',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#1a1a2e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wifimapper.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'WiFi Mapper needs your location to scan nearby WiFi networks for spatial mapping.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'WiFi Mapper needs your location to scan nearby WiFi networks for spatial mapping.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1a1a2e',
    },
    package: 'com.wifimapper.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_WIFI_STATE',
      'CHANGE_WIFI_STATE',
      'HIGH_SAMPLING_RATE_SENSORS',
    ],
    versionCode: 1,
  },
  plugins: [
    'expo-location',
    'expo-sensors',
    'react-native-wifi-reborn',
  ],
});
