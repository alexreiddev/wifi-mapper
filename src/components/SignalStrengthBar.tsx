import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  COLORS,
  SIGNAL_STRONG_THRESHOLD,
  SIGNAL_MEDIUM_THRESHOLD,
  SIGNAL_WEAK_THRESHOLD,
} from '../utils/constants';

interface SignalStrengthBarProps {
  rssi: number;
  width?: number;
  height?: number;
}

function getSignalColor(rssi: number): string {
  if (rssi >= SIGNAL_STRONG_THRESHOLD) return COLORS.signalStrong;
  if (rssi >= SIGNAL_MEDIUM_THRESHOLD) return COLORS.signalMedium;
  return COLORS.signalWeak;
}

function getSignalPercent(rssi: number): number {
  // Map RSSI range (-100 to -30) to 0-100%
  const min = -100;
  const max = -30;
  return Math.max(0, Math.min(100, ((rssi - min) / (max - min)) * 100));
}

export function SignalStrengthBar({
  rssi,
  width = 60,
  height = 8,
}: SignalStrengthBarProps) {
  const percent = getSignalPercent(rssi);
  const color = getSignalColor(rssi);

  return (
    <View style={[styles.container, { width, height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${percent}%`,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
