import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useWifiStore } from '../store/wifi-store';
import { useMapStore } from '../store/map-store';
import { WifiScannerService } from '../services/wifi-scanner';
import { APListItem } from '../components/APListItem';
import { AccessPoint } from '../types';
import { COLORS } from '../utils/constants';

export function ScannerScreen({ navigation }: any) {
  const { accessPoints, isScanning, remainingScans, updateScanResults, setScanning, setRemainingScans } =
    useWifiStore();
  const { knownAPs } = useMapStore();
  const scannerRef = useRef<WifiScannerService | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | '2.4' | '5'>('all');

  useEffect(() => {
    const scanner = new WifiScannerService();
    scannerRef.current = scanner;

    scanner.onScan((aps) => {
      updateScanResults(aps);
      setRemainingScans(scanner.getRemainingScans());
    });

    // Request permissions and start scanning
    scanner.requestPermissions().then((granted) => {
      if (granted) {
        setScanning(true);
        scanner.startPeriodicScan();
      }
    });

    return () => {
      scanner.destroy();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await scannerRef.current?.scan();
    setRefreshing(false);
  };

  const handleAPPress = (ap: AccessPoint) => {
    navigation.navigate('AP Setup', { bssid: ap.bssid, ssid: ap.ssid });
  };

  const knownBSSIDs = new Set(knownAPs.map((ap) => ap.bssid.toLowerCase()));

  const filteredAPs = accessPoints.filter((ap) => {
    if (filter === '2.4') return ap.frequency < 5000;
    if (filter === '5') return ap.frequency >= 5000;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WiFi Scanner</Text>
        <Text style={styles.subtitle}>
          {accessPoints.length} networks found | {remainingScans} scans remaining
        </Text>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {(['all', '2.4', '5'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f === '2.4' ? '2.4 GHz' : '5 GHz'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAPs}
        keyExtractor={(item) => item.bssid}
        renderItem={({ item }) => (
          <APListItem
            ap={item}
            isKnown={knownBSSIDs.has(item.bssid.toLowerCase())}
            onPress={handleAPPress}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isScanning ? 'Scanning...' : 'No networks found'}
            </Text>
            <Text style={styles.emptySubtext}>
              Make sure WiFi and location services are enabled
            </Text>
          </View>
        }
      />
    </View>
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
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.accent,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
