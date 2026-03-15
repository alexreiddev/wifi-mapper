import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMapStore } from '../store/map-store';
import { useSettingsStore } from '../store/settings-store';
import { useWifiStore } from '../store/wifi-store';
import { KnownAccessPoint } from '../types';
import { COLORS } from '../utils/constants';

export function APSetupScreen({ route }: any) {
  const { bssid: routeBssid, ssid: routeSsid } = route?.params ?? {};
  const { knownAPs, addKnownAP, removeKnownAP } = useMapStore();
  const { accessPoints } = useWifiStore();
  const settings = useSettingsStore();

  const [editingBssid, setEditingBssid] = useState<string | null>(
    routeBssid ?? null,
  );
  const [form, setForm] = useState({
    x: '0',
    y: '0',
    z: '0',
    txPower: String(settings.defaultTxPower),
    pathLossN: String(settings.defaultPathLossExponent),
  });

  const handleSave = () => {
    if (!editingBssid) return;

    const ap: KnownAccessPoint = {
      bssid: editingBssid.toLowerCase(),
      ssid: routeSsid || accessPoints.find(
        (a) => a.bssid.toLowerCase() === editingBssid.toLowerCase(),
      )?.ssid || '<unknown>',
      position: {
        x: parseFloat(form.x) || 0,
        y: parseFloat(form.y) || 0,
        z: parseFloat(form.z) || 0,
      },
      txPower: parseFloat(form.txPower) || settings.defaultTxPower,
      pathLossExponent:
        parseFloat(form.pathLossN) || settings.defaultPathLossExponent,
    };

    addKnownAP(ap);
    setEditingBssid(null);
    Alert.alert('Saved', `AP "${ap.ssid}" registered at (${ap.position.x}, ${ap.position.y}, ${ap.position.z})`);
  };

  const handleRemove = (bssid: string) => {
    Alert.alert('Remove AP', 'Remove this access point?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeKnownAP(bssid),
      },
    ]);
  };

  const handleEdit = (ap: KnownAccessPoint) => {
    setEditingBssid(ap.bssid);
    setForm({
      x: String(ap.position.x),
      y: String(ap.position.y),
      z: String(ap.position.z),
      txPower: String(ap.txPower),
      pathLossN: String(ap.pathLossExponent),
    });
  };

  const renderKnownAP = ({ item }: { item: KnownAccessPoint }) => (
    <TouchableOpacity
      style={styles.apCard}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleRemove(item.bssid)}
    >
      <Text style={styles.apSsid}>{item.ssid}</Text>
      <Text style={styles.apBssid}>{item.bssid}</Text>
      <Text style={styles.apPosition}>
        Position: ({item.position.x}, {item.position.y}, {item.position.z})m
      </Text>
      <Text style={styles.apParams}>
        TX: {item.txPower} dBm | n: {item.pathLossExponent}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AP Setup</Text>
        <Text style={styles.subtitle}>
          Register access point positions for trilateration. Tap a network in
          the Scanner tab, then enter its physical coordinates.
        </Text>
      </View>

      {/* Edit form */}
      {editingBssid && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            Configure: {routeSsid || editingBssid}
          </Text>
          <Text style={styles.formBssid}>{editingBssid}</Text>

          <Text style={styles.formSection}>Position (meters)</Text>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>X</Text>
              <TextInput
                style={styles.input}
                value={form.x}
                onChangeText={(v) => setForm({ ...form, x: v })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Y</Text>
              <TextInput
                style={styles.input}
                value={form.y}
                onChangeText={(v) => setForm({ ...form, y: v })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Z</Text>
              <TextInput
                style={styles.input}
                value={form.z}
                onChangeText={(v) => setForm({ ...form, z: v })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <Text style={styles.formSection}>Calibration</Text>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TX Power (dBm)</Text>
              <TextInput
                style={styles.input}
                value={form.txPower}
                onChangeText={(v) => setForm({ ...form, txPower: v })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Path Loss (n)</Text>
              <TextInput
                style={styles.input}
                value={form.pathLossN}
                onChangeText={(v) => setForm({ ...form, pathLossN: v })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditingBssid(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Registered APs */}
      <Text style={styles.sectionTitle}>
        Registered APs ({knownAPs.length})
      </Text>
      {knownAPs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No APs registered</Text>
          <Text style={styles.emptySubtext}>
            Go to Scanner tab and tap an AP to register its position.
            You need at least 3 for trilateration.
          </Text>
        </View>
      ) : (
        <FlatList
          data={knownAPs}
          keyExtractor={(item) => item.bssid}
          renderItem={renderKnownAP}
          contentContainerStyle={styles.list}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  form: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  formBssid: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
    marginBottom: 12,
  },
  formSection: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: 'monospace',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  apCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  apSsid: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  apBssid: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  apPosition: {
    color: COLORS.accent,
    fontSize: 13,
    marginTop: 6,
  },
  apParams: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
