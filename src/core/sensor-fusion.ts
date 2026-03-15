import { Vector3D, IMUReading, AccessPoint, KnownAccessPoint, PositionCallback } from '../types';
import { KalmanFilter } from './kalman-filter';
import { DeadReckoning } from './dead-reckoning';
import { DistanceCalculator } from './distance-calculator';
import { trilaterate, computeGDOP } from './trilateration';
import { GRAVITY } from '../utils/constants';

/**
 * Sensor Fusion engine that combines WiFi and IMU data into
 * a unified position estimate using an Extended Kalman Filter.
 *
 * Data flow:
 *   IMU (20Hz) → Dead Reckoning → Kalman Predict
 *   WiFi (10-30s) → Distance Calculator → Trilateration → Kalman Update
 */
export class SensorFusion {
  private kalman: KalmanFilter;
  private deadReckoning: DeadReckoning;
  private distanceCalc: DistanceCalculator;
  private knownAPs: Map<string, KnownAccessPoint> = new Map();
  private callbacks: PositionCallback[] = [];
  private lastIMUTime = 0;

  constructor(
    processNoise?: number,
    measurementNoise?: number,
    txPower?: number,
    pathLossN?: number,
  ) {
    this.kalman = new KalmanFilter(processNoise, measurementNoise);
    this.deadReckoning = new DeadReckoning();
    this.distanceCalc = new DistanceCalculator(txPower, pathLossN);
  }

  /**
   * Register known access point positions for trilateration.
   */
  setKnownAPs(aps: KnownAccessPoint[]): void {
    this.knownAPs.clear();
    for (const ap of aps) {
      this.knownAPs.set(ap.bssid.toLowerCase(), ap);
    }
  }

  /**
   * Process an IMU reading (called at ~20Hz).
   */
  processIMU(reading: IMUReading): void {
    const dt =
      this.lastIMUTime > 0
        ? (reading.timestamp - this.lastIMUTime) / 1000
        : 0;
    this.lastIMUTime = reading.timestamp;

    // Update dead reckoning
    this.deadReckoning.update(reading);

    // Gravity-compensated acceleration for Kalman predict
    // Simple approximation: subtract gravity from z-axis
    const gravCompensated: Vector3D = {
      x: reading.acceleration.x,
      y: reading.acceleration.y,
      z: reading.acceleration.z - GRAVITY,
    };

    // Kalman predict
    if (dt > 0 && dt < 1) {
      this.kalman.predict(dt, gravCompensated);
    }

    // Emit position
    const state = this.kalman.getState();
    const confidence = this.kalman.getConfidence();
    this.emitPosition(state.position, confidence);
  }

  /**
   * Process WiFi scan results (called every ~10-30s).
   */
  processWiFiScan(accessPoints: AccessPoint[]): void {
    // Calculate distances using known APs
    const measurements: Array<{ position: Vector3D; distance: number }> = [];

    for (const ap of accessPoints) {
      const bssid = ap.bssid.toLowerCase();
      const known = this.knownAPs.get(bssid);
      if (!known) continue;

      // Use per-AP parameters if available
      const distance = this.distanceCalc.getDistanceWithParams(
        bssid,
        known.txPower,
        known.pathLossExponent,
      );

      // Also add current reading
      this.distanceCalc.addReading(bssid, ap.rssi);

      const smoothedDist =
        distance ?? this.distanceCalc.addReading(bssid, ap.rssi);

      measurements.push({
        position: known.position,
        distance: smoothedDist,
      });
    }

    if (measurements.length < 2) return; // Need at least 2 for any estimate

    // Trilaterate
    const position = trilaterate(measurements);
    if (!position) return;

    // Compute confidence from GDOP and number of APs
    const gdop = computeGDOP(
      measurements.map((m) => m.position),
      position,
    );

    const apCountFactor = Math.min(1, measurements.length / 5); // Max at 5 APs
    const gdopFactor = Math.max(0, 1 - gdop / 10); // Degrades above GDOP 10
    const confidence = apCountFactor * gdopFactor;

    // Kalman update
    this.kalman.updateWifi(position, confidence);

    // Sync dead reckoning to fused position to prevent drift
    const state = this.kalman.getState();
    this.deadReckoning.setPosition(state.position);

    // Emit updated position
    this.emitPosition(state.position, this.kalman.getConfidence());
  }

  /**
   * Subscribe to position updates.
   */
  onPositionUpdate(callback: PositionCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private emitPosition(position: Vector3D, confidence: number): void {
    for (const cb of this.callbacks) {
      cb(position, confidence);
    }
  }

  getCurrentPosition(): Vector3D {
    return this.kalman.getState().position;
  }

  getConfidence(): number {
    return this.kalman.getConfidence();
  }

  getStepCount(): number {
    return this.deadReckoning.getStepCount();
  }

  getHeading(): number {
    return this.deadReckoning.getHeading();
  }

  reset(): void {
    this.kalman.reset();
    this.deadReckoning.reset();
    this.distanceCalc.clear();
    this.lastIMUTime = 0;
  }

  setInitialPosition(pos: Vector3D): void {
    this.kalman.setPosition(pos);
    this.deadReckoning.setPosition(pos);
  }
}
