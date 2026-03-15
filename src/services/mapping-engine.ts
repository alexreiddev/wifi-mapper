import { Vector3D, MapPoint, KnownAccessPoint, SavedMap, AccessPoint } from '../types';
import { SensorFusion } from '../core/sensor-fusion';
import { OctreeNode, createDefaultOctree } from '../core/octree';
import { WifiScannerService } from './wifi-scanner';
import { IMUService } from './imu-service';
import { generateId } from '../utils/math';

/**
 * Top-level mapping session orchestrator.
 * Creates and manages sensor fusion, WiFi scanner, IMU service,
 * and point cloud collection.
 */
export class MappingEngine {
  private sensorFusion: SensorFusion;
  private wifiScanner: WifiScannerService;
  private imuService: IMUService;
  private octree: OctreeNode;
  private points: MapPoint[] = [];
  private isRunning = false;
  private isPaused = false;
  private startTime = 0;

  // Unsubscribe handles
  private unsubIMU: (() => void) | null = null;
  private unsubWifi: (() => void) | null = null;
  private unsubPosition: (() => void) | null = null;

  // Point collection
  private lastPointTime = 0;
  private minPointIntervalMs = 500; // Min time between point additions

  // Callbacks for UI updates
  private onPointAdded: ((point: MapPoint) => void) | null = null;
  private onPositionUpdate: ((pos: Vector3D, conf: number) => void) | null = null;

  constructor() {
    this.sensorFusion = new SensorFusion();
    this.wifiScanner = new WifiScannerService();
    this.imuService = new IMUService();
    this.octree = createDefaultOctree();
  }

  /**
   * Start a new mapping session.
   */
  async startMapping(
    knownAPs: KnownAccessPoint[],
    scanIntervalMs?: number,
    imuSampleRateMs?: number,
  ): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.points = [];
    this.octree = createDefaultOctree();

    // Configure sensor fusion with known APs
    this.sensorFusion.setKnownAPs(knownAPs);

    // Request permissions
    await this.wifiScanner.requestPermissions();
    await this.imuService.checkAvailability();

    // Subscribe to position updates from sensor fusion
    this.unsubPosition = this.sensorFusion.onPositionUpdate(
      (position, confidence) => {
        this.onPositionEstimate(position, confidence);
        this.onPositionUpdate?.(position, confidence);
      },
    );

    // Connect IMU to sensor fusion
    this.unsubIMU = this.imuService.onReading((reading) => {
      if (!this.isPaused) {
        this.sensorFusion.processIMU(reading);
      }
    });

    // Connect WiFi scanner to sensor fusion
    this.unsubWifi = this.wifiScanner.onScan((aps) => {
      if (!this.isPaused) {
        this.sensorFusion.processWiFiScan(aps);
      }
    });

    // Start sensors
    this.imuService.start(imuSampleRateMs);
    this.wifiScanner.startPeriodicScan(scanIntervalMs);
  }

  /**
   * Stop mapping and return the completed map.
   */
  stopMapping(name?: string): SavedMap {
    this.isRunning = false;
    this.isPaused = false;

    // Stop sensors
    this.wifiScanner.stopPeriodicScan();
    this.imuService.stop();

    // Unsubscribe
    this.unsubIMU?.();
    this.unsubWifi?.();
    this.unsubPosition?.();

    // Build saved map
    const bounds = this.computeBounds();
    const map: SavedMap = {
      id: generateId(),
      name: name ?? `Map ${new Date().toLocaleString()}`,
      createdAt: this.startTime,
      points: [...this.points],
      knownAPs: Array.from(
        this.sensorFusion['knownAPs']?.values?.() ?? [],
      ) as KnownAccessPoint[],
      bounds,
    };

    return map;
  }

  pauseMapping(): void {
    this.isPaused = true;
  }

  resumeMapping(): void {
    this.isPaused = false;
  }

  /**
   * Called on each position estimate from sensor fusion.
   */
  private onPositionEstimate(position: Vector3D, confidence: number): void {
    const now = Date.now();
    if (now - this.lastPointTime < this.minPointIntervalMs) return;

    // Only add points with minimum confidence
    if (confidence < 0.05) return;

    this.lastPointTime = now;

    const point: MapPoint = {
      id: generateId(),
      position: { ...position },
      signalStrength: -50, // Will be updated with actual RSSI average
      confidence,
      timestamp: now,
      nearbyAPs: [],
    };

    this.points.push(point);
    this.octree.insert(point);
    this.onPointAdded?.(point);
  }

  private computeBounds(): { min: Vector3D; max: Vector3D } {
    if (this.points.length === 0) {
      return {
        min: { x: -10, y: -10, z: -5 },
        max: { x: 10, y: 10, z: 5 },
      };
    }

    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const p of this.points) {
      min.x = Math.min(min.x, p.position.x);
      min.y = Math.min(min.y, p.position.y);
      min.z = Math.min(min.z, p.position.z);
      max.x = Math.max(max.x, p.position.x);
      max.y = Math.max(max.y, p.position.y);
      max.z = Math.max(max.z, p.position.z);
    }

    return { min, max };
  }

  // ─── UI Callbacks ─────────────────────────────────────────────

  setOnPointAdded(callback: (point: MapPoint) => void): void {
    this.onPointAdded = callback;
  }

  setOnPositionUpdate(
    callback: (position: Vector3D, confidence: number) => void,
  ): void {
    this.onPositionUpdate = callback;
  }

  // ─── Getters ──────────────────────────────────────────────────

  getPoints(): MapPoint[] {
    return this.points;
  }

  getPointCount(): number {
    return this.points.length;
  }

  getOctree(): OctreeNode {
    return this.octree;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getCurrentPosition(): Vector3D {
    return this.sensorFusion.getCurrentPosition();
  }

  getConfidence(): number {
    return this.sensorFusion.getConfidence();
  }

  getStepCount(): number {
    return this.sensorFusion.getStepCount();
  }

  getHeading(): number {
    return this.sensorFusion.getHeading();
  }

  getElapsedTime(): number {
    if (!this.isRunning) return 0;
    return Date.now() - this.startTime;
  }

  destroy(): void {
    if (this.isRunning) {
      this.stopMapping();
    }
    this.wifiScanner.destroy();
    this.imuService.destroy();
  }
}
