import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useMapStore } from '../store/map-store';
import { COLORS } from '../utils/constants';
import { SavedMap } from '../types';

export function HomeScreen({ navigation }: any) {
  const { savedMaps, deleteMap } = useMapStore();

  const handleStartMapping = () => {
    navigation.navigate('Map');
  };

  const handleDeleteMap = (map: SavedMap) => {
    Alert.alert('Delete Map', `Delete "${map.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMap(map.id),
      },
    ]);
  };

  const handleViewMap = (map: SavedMap) => {
    navigation.navigate('Map', { mapId: map.id });
  };

  const renderMapItem = ({ item }: { item: SavedMap }) => (
    <TouchableOpacity
      style={styles.mapCard}
      onPress={() => handleViewMap(item)}
      onLongPress={() => handleDeleteMap(item)}
    >
      <View style={styles.mapCardHeader}>
        <Text style={styles.mapName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.mapDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.mapCardStats}>
        <View style={styles.mapStat}>
          <Text style={styles.mapStatValue}>{item.points.length}</Text>
          <Text style={styles.mapStatLabel}>Points</Text>
        </View>
        <View style={styles.mapStat}>
          <Text style={styles.mapStatValue}>{item.knownAPs.length}</Text>
          <Text style={styles.mapStatLabel}>APs</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WiFi Mapper</Text>
        <Text style={styles.subtitle}>3D Spatial Mapping</Text>
      </View>

      {/* Quick start */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartMapping}>
        <Text style={styles.startButtonText}>Start New Map</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewValue}>{savedMaps.length}</Text>
          <Text style={styles.overviewLabel}>Maps</Text>
        </View>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewValue}>
            {savedMaps.reduce((sum, m) => sum + m.points.length, 0)}
          </Text>
          <Text style={styles.overviewLabel}>Total Points</Text>
        </View>
      </View>

      {/* Saved maps */}
      <Text style={styles.sectionTitle}>Saved Maps</Text>
      {savedMaps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No maps yet</Text>
          <Text style={styles.emptySubtext}>
            Start a new mapping session to create your first 3D map
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedMaps}
          keyExtractor={(item) => item.id}
          renderItem={renderMapItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.accent,
    fontSize: 16,
    marginTop: 4,
  },
  startButton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.accentGreen,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overviewStat: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overviewValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
  },
  overviewLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  mapDate: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  mapCardStats: {
    flexDirection: 'row',
    gap: 20,
  },
  mapStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mapStatValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  mapStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
