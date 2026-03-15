import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useMapStore } from '../store/map-store';
import { useSettingsStore } from '../store/settings-store';
import { MappingEngine } from '../services/mapping-engine';
import { PointCloud3D } from '../components/PointCloud3D';
import { MapControls } from '../components/MapControls';
import { SensorDebugOverlay } from '../components/SensorDebugOverlay';
import { MapPoint, Vector3D } from '../types';
import { COLORS } from '../utils/constants';

export function MapViewScreen({ route }: any) {
  const mapId = route?.params?.mapId;

  const {
    currentPoints,
    currentPosition,
    confidence,
    isMapping,
    stepCount,
    heading,
    knownAPs,
    savedMaps,
    addPoint,
    updatePosition,
    setMapping,
    updateStats,
    clearCurrentPoints,
    saveMap,
  } = useMapStore();

  const settings = useSettingsStore();
  const engineRef = useRef<MappingEngine | null>(null);
  const [debugData, setDebugData] = useState({
    acceleration: { x: 0, y: 0, z: 0 } as Vector3D,
    rotation: { x: 0, y: 0, z: 0 } as Vector3D,
    magnetic: { x: 0, y: 0, z: 0 } as Vector3D,
  });

  // Load saved map if mapId provided
  const viewingPoints = mapId
    ? savedMaps.find((m) => m.id === mapId)?.points ?? []
    : currentPoints;

  useEffect(() => {
    return () => {
      // Cleanup engine on unmount
      engineRef.current?.destroy();
    };
  }, []);

  const handleStartStop = useCallback(() => {
    if (isMapping) {
      // Stop mapping
      const engine = engineRef.current;
      if (engine) {
        const map = engine.stopMapping();
        setMapping(false);

        if (map.points.length > 0) {
          Alert.alert('Save Map', 'Save this mapping session?', [
            { text: 'Discard', style: 'destructive' },
            {
              text: 'Save',
              onPress: () => saveMap(map),
            },
          ]);
        }
      }
    } else {
      // Start mapping
      clearCurrentPoints();
      const engine = new MappingEngine();
      engineRef.current = engine;

      engine.setOnPointAdded((point: MapPoint) => {
        addPoint(point);
      });

      engine.setOnPositionUpdate((pos: Vector3D, conf: number) => {
        updatePosition(pos, conf);
        updateStats(engine.getStepCount(), engine.getHeading());
      });

      engine.startMapping(
        knownAPs,
        settings.scanIntervalMs,
        settings.imuSampleRateMs,
      );

      setMapping(true);
    }
  }, [isMapping, knownAPs, settings]);

  const handlePauseResume = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.getIsPaused()) {
      engine.resumeMapping();
    } else {
      engine.pauseMapping();
    }
  }, []);

  const handleReset = useCallback(() => {
    clearCurrentPoints();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      {mapId && (
        <View style={styles.viewingHeader}>
          <Text style={styles.viewingText}>
            Viewing: {savedMaps.find((m) => m.id === mapId)?.name ?? 'Map'}
          </Text>
        </View>
      )}

      {/* 3D Point Cloud */}
      <PointCloud3D
        points={viewingPoints}
        currentPosition={isMapping ? currentPosition : null}
        maxPoints={settings.pointCloudMaxPoints}
      />

      {/* Debug overlay */}
      <SensorDebugOverlay
        position={currentPosition}
        confidence={confidence}
        heading={heading}
        stepCount={stepCount}
        acceleration={debugData.acceleration}
        rotation={debugData.rotation}
        magnetic={debugData.magnetic}
        visible={settings.showDebugOverlay && isMapping}
      />

      {/* Controls (only when not viewing a saved map) */}
      {!mapId && (
        <MapControls
          isMapping={isMapping}
          isPaused={engineRef.current?.getIsPaused() ?? false}
          pointCount={currentPoints.length}
          confidence={confidence}
          stepCount={stepCount}
          onStartStop={handleStartStop}
          onPauseResume={handlePauseResume}
          onReset={handleReset}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  viewingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  viewingText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: COLORS.background + 'DD',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
