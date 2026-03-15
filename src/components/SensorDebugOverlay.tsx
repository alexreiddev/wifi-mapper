import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Vector3D } from '../types';
import { COLORS } from '../utils/constants';
import { radiansToDegrees } from '../utils/math';

interface SensorDebugOverlayProps {
  position: Vector3D | null;
  confidence: number;
  heading: number;
  stepCount: number;
  acceleration?: Vector3D;
  rotation?: Vector3D;
  magnetic?: Vector3D;
  visible: boolean;
}

function formatVec(v: Vector3D | undefined | null, precision = 2): string {
  if (!v) return '-- -- --';
  return `${v.x.toFixed(precision)} ${v.y.toFixed(precision)} ${v.z.toFixed(precision)}`;
}

export function SensorDebugOverlay({
  position,
  confidence,
  heading,
  stepCount,
  acceleration,
  rotation,
  magnetic,
  visible,
}: SensorDebugOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Debug</Text>
      <Text style={styles.row}>
        Pos: {formatVec(position)}
      </Text>
      <Text style={styles.row}>
        Conf: {(confidence * 100).toFixed(1)}%
      </Text>
      <Text style={styles.row}>
        Heading: {radiansToDegrees(heading).toFixed(1)} deg
      </Text>
      <Text style={styles.row}>Steps: {stepCount}</Text>
      <Text style={styles.divider}>---</Text>
      <Text style={styles.row}>
        Accel: {formatVec(acceleration)}
      </Text>
      <Text style={styles.row}>
        Gyro: {formatVec(rotation, 3)}
      </Text>
      <Text style={styles.row}>
        Mag: {formatVec(magnetic, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: COLORS.background + 'DD',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    zIndex: 100,
  },
  title: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  divider: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginVertical: 2,
  },
});
