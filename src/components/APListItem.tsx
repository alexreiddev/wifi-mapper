import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AccessPoint } from '../types';
import { SignalStrengthBar } from './SignalStrengthBar';
import { COLORS } from '../utils/constants';

interface APListItemProps {
  ap: AccessPoint;
  isKnown?: boolean;
  onPress?: (ap: AccessPoint) => void;
}

function getBandLabel(frequency: number): string {
  if (frequency >= 5000) return '5 GHz';
  if (frequency >= 2400) return '2.4 GHz';
  return `${frequency} MHz`;
}

export function APListItem({ ap, isKnown, onPress }: APListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isKnown && styles.known]}
      onPress={() => onPress?.(ap)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.nameRow}>
          <Text style={styles.ssid} numberOfLines={1}>
            {ap.ssid || '<hidden>'}
          </Text>
          {isKnown && <Text style={styles.knownBadge}>KNOWN</Text>}
        </View>
        <Text style={styles.bssid}>{ap.bssid}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.signalRow}>
          <Text style={styles.rssiText}>{ap.rssi} dBm</Text>
          <SignalStrengthBar rssi={ap.rssi} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.bandLabel}>{getBandLabel(ap.frequency)}</Text>
          {ap.estimatedDistance !== undefined && (
            <Text style={styles.distance}>
              ~{ap.estimatedDistance.toFixed(1)}m
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  known: {
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ssid: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  knownBadge: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bssid: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  right: {
    alignItems: 'flex-end',
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rssiText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'monospace',
    minWidth: 60,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bandLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  distance: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
});
