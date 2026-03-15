import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface MapControlsProps {
  isMapping: boolean;
  isPaused: boolean;
  pointCount: number;
  confidence: number;
  stepCount: number;
  onStartStop: () => void;
  onPauseResume: () => void;
  onReset: () => void;
}

export function MapControls({
  isMapping,
  isPaused,
  pointCount,
  confidence,
  stepCount,
  onStartStop,
  onPauseResume,
  onReset,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pointCount}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(confidence * 100).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Confidence</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stepCount}</Text>
          <Text style={styles.statLabel}>Steps</Text>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.buttonRow}>
        {isMapping && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onPauseResume}
          >
            <Text style={styles.buttonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            isMapping ? styles.stopButton : styles.startButton,
          ]}
          onPress={onStartStop}
        >
          <Text style={styles.buttonText}>
            {isMapping ? 'Stop' : 'Start Mapping'}
          </Text>
        </TouchableOpacity>

        {!isMapping && pointCount > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onReset}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background + 'EE',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.accentGreen,
  },
  stopButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
