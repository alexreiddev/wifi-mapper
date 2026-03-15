import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSettingsStore } from '../store/settings-store';
import { COLORS } from '../utils/constants';

function SettingsSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <View style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderFill,
            { width: `${((value - min) / (max - min)) * 100}%` },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.sliderThumb,
            { left: `${((value - min) / (max - min)) * 100}%` },
          ]}
          onPress={() => {
            // Cycle through values on tap
            const next = value + step;
            onChange(next > max ? min : next);
          }}
        />
      </View>
      <View style={styles.sliderRange}>
        <Text style={styles.rangeText}>{min}</Text>
        <Text style={styles.rangeText}>{max}</Text>
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const settings = useSettingsStore();
  const { updateSetting, resetSettings } = settings;

  const handleReset = () => {
    Alert.alert('Reset Settings', 'Reset all settings to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetSettings },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* WiFi Section */}
      <Text style={styles.sectionTitle}>WiFi</Text>
      <View style={styles.section}>
        <SettingsSlider
          label="Path Loss Exponent"
          value={settings.defaultPathLossExponent}
          min={1.5}
          max={5}
          step={0.1}
          onChange={(v) => updateSetting('defaultPathLossExponent', v)}
        />
        <SettingsSlider
          label="TX Power"
          value={settings.defaultTxPower}
          min={-60}
          max={-30}
          step={1}
          unit="dBm"
          onChange={(v) => updateSetting('defaultTxPower', v)}
        />
        <SettingsSlider
          label="Scan Interval"
          value={settings.scanIntervalMs / 1000}
          min={5}
          max={60}
          step={5}
          unit="s"
          onChange={(v) => updateSetting('scanIntervalMs', v * 1000)}
        />
      </View>

      {/* IMU Section */}
      <Text style={styles.sectionTitle}>Sensors</Text>
      <View style={styles.section}>
        <SettingsSlider
          label="IMU Sample Rate"
          value={1000 / settings.imuSampleRateMs}
          min={10}
          max={100}
          step={10}
          unit="Hz"
          onChange={(v) => updateSetting('imuSampleRateMs', Math.round(1000 / v))}
        />
      </View>

      {/* Kalman Filter Section */}
      <Text style={styles.sectionTitle}>Kalman Filter</Text>
      <View style={styles.section}>
        <SettingsSlider
          label="Process Noise (Q)"
          value={settings.kalmanProcessNoise}
          min={0.01}
          max={1.0}
          step={0.01}
          onChange={(v) => updateSetting('kalmanProcessNoise', v)}
        />
        <SettingsSlider
          label="Measurement Noise (R)"
          value={settings.kalmanMeasurementNoise}
          min={0.5}
          max={20}
          step={0.5}
          onChange={(v) => updateSetting('kalmanMeasurementNoise', v)}
        />
      </View>

      {/* Point Cloud Section */}
      <Text style={styles.sectionTitle}>Point Cloud</Text>
      <View style={styles.section}>
        <SettingsSlider
          label="Max Points"
          value={settings.pointCloudMaxPoints}
          min={1000}
          max={50000}
          step={1000}
          onChange={(v) => updateSetting('pointCloudMaxPoints', v)}
        />
      </View>

      {/* Toggles */}
      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Auto-save maps</Text>
          <Switch
            value={settings.autoSaveEnabled}
            onValueChange={(v) => updateSetting('autoSaveEnabled', v)}
            trackColor={{ false: COLORS.border, true: COLORS.accentGreen }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Debug overlay</Text>
          <Switch
            value={settings.showDebugOverlay}
            onValueChange={(v) => updateSetting('showDebugOverlay', v)}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset All Settings</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>WiFi Mapper v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sliderRow: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    color: COLORS.text,
    fontSize: 14,
  },
  sliderValue: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.text,
    marginLeft: -10,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    color: COLORS.text,
    fontSize: 15,
  },
  resetButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
