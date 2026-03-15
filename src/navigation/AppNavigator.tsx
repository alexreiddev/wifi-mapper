import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { MapViewScreen } from '../screens/MapViewScreen';
import { APSetupScreen } from '../screens/APSetupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '\u2302',      // ⌂
    Scanner: '\u25CE',   // ◎
    Map: '\u25A6',       // ▦
    'AP Setup': '\u2609',// ☉
    Settings: '\u2699',  // ⚙
  };

  return (
    <View style={styles.tabIcon}>
      <Text
        style={[
          styles.tabIconText,
          { color: focused ? COLORS.accent : COLORS.textMuted },
        ]}
      >
        {icons[label] || '?'}
      </Text>
    </View>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Map" component={MapViewScreen} />
      <Tab.Screen name="AP Setup" component={APSetupScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 22,
  },
});
