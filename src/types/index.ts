// ─── Vector & Math Types ──────────────────────────────────────────

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// ─── WiFi Types ───────────────────────────────────────────────────

export interface AccessPoint {
  bssid: string;
  ssid: string;
  rssi: number; // dBm, e.g. -45
  frequency: number; // MHz, e.g. 2437
  timestamp: number;
  estimatedDistance?: number; // meters
}

export interface KnownAccessPoint {
  bssid: string;
  ssid: string;
  position: Vector3D; // x, y, z in meters
  pathLossExponent: number;
  txPower: number; // reference RSSI at 1m
}

// ─── IMU Types ────────────────────────────────────────────────────

export interface IMUReading {
  acceleration: Vector3D; // m/s^2
  rotation: Vector3D; // rad/s (gyroscope)
  magnetic: Vector3D; // uT (magnetometer)
  timestamp: number;
}

// ─── Map Types ────────────────────────────────────────────────────

export interface MapPoint {
  id: string;
  position: Vector3D;
  signalStrength: number; // average RSSI at this point
  confidence: number; // 0-1
  timestamp: number;
  nearbyAPs: string[]; // BSSIDs visible from this point
}

export interface SavedMap {
  id: string;
  name: string;
  createdAt: number;
  points: MapPoint[];
  knownAPs: KnownAccessPoint[];
  bounds: { min: Vector3D; max: Vector3D };
}

// ─── Kalman Filter Types ──────────────────────────────────────────

export interface KalmanState {
  position: Vector3D;
  velocity: Vector3D;
  covariance: number[][]; // 6x6 matrix
}

// ─── Settings Types ───────────────────────────────────────────────

export interface AppSettings {
  defaultPathLossExponent: number;
  defaultTxPower: number;
  scanIntervalMs: number;
  imuSampleRateMs: number;
  kalmanProcessNoise: number;
  kalmanMeasurementNoise: number;
  pointCloudMaxPoints: number;
  autoSaveEnabled: boolean;
  showDebugOverlay: boolean;
}

// ─── Callback Types ───────────────────────────────────────────────

export type PositionCallback = (position: Vector3D, confidence: number) => void;
export type IMUCallback = (reading: IMUReading) => void;
export type ScanCallback = (accessPoints: AccessPoint[]) => void;
