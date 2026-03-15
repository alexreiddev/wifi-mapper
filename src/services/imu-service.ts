import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { IMUReading, IMUCallback, Vector3D } from '../types';
import { IMU_SAMPLE_INTERVAL_MS } from '../utils/constants';

type Subscription = { remove: () => void };

/**
 * IMU Service that wraps expo-sensors to provide unified
 * accelerometer + gyroscope + magnetometer readings.
 */
export class IMUService {
  private subscriptions: Subscription[] = [];
  private callbacks: IMUCallback[] = [];
  private isRunning = false;

  // Latest readings from each sensor
  private latestAccel: Vector3D = { x: 0, y: 0, z: 0 };
  private latestGyro: Vector3D = { x: 0, y: 0, z: 0 };
  private latestMag: Vector3D = { x: 0, y: 0, z: 0 };

  // Availability flags
  private accelAvailable = false;
  private gyroAvailable = false;
  private magAvailable = false;

  /**
   * Check sensor availability.
   */
  async checkAvailability(): Promise<{
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
  }> {
    const [accel, gyro, mag] = await Promise.all([
      Accelerometer.isAvailableAsync(),
      Gyroscope.isAvailableAsync(),
      Magnetometer.isAvailableAsync(),
    ]);

    this.accelAvailable = accel;
    this.gyroAvailable = gyro;
    this.magAvailable = mag;

    return { accelerometer: accel, gyroscope: gyro, magnetometer: mag };
  }

  /**
   * Start listening to all available sensors.
   */
  start(sampleRateMs: number = IMU_SAMPLE_INTERVAL_MS): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Set update intervals
    Accelerometer.setUpdateInterval(sampleRateMs);
    Gyroscope.setUpdateInterval(sampleRateMs);
    Magnetometer.setUpdateInterval(sampleRateMs);

    // Subscribe to accelerometer
    const accelSub = Accelerometer.addListener((data) => {
      this.latestAccel = { x: data.x, y: data.y, z: data.z };
      this.emitReading();
    });
    this.subscriptions.push(accelSub);

    // Subscribe to gyroscope
    const gyroSub = Gyroscope.addListener((data) => {
      this.latestGyro = { x: data.x, y: data.y, z: data.z };
    });
    this.subscriptions.push(gyroSub);

    // Subscribe to magnetometer
    const magSub = Magnetometer.addListener((data) => {
      this.latestMag = { x: data.x, y: data.y, z: data.z };
    });
    this.subscriptions.push(magSub);
  }

  /**
   * Stop all sensor subscriptions.
   */
  stop(): void {
    for (const sub of this.subscriptions) {
      sub.remove();
    }
    this.subscriptions = [];
    this.isRunning = false;
  }

  /**
   * Subscribe to unified IMU readings.
   * Readings are emitted at the accelerometer rate (highest priority sensor).
   */
  onReading(callback: IMUCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private emitReading(): void {
    const reading: IMUReading = {
      acceleration: { ...this.latestAccel },
      rotation: { ...this.latestGyro },
      magnetic: { ...this.latestMag },
      timestamp: Date.now(),
    };

    for (const cb of this.callbacks) {
      cb(reading);
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getLatestReading(): IMUReading {
    return {
      acceleration: { ...this.latestAccel },
      rotation: { ...this.latestGyro },
      magnetic: { ...this.latestMag },
      timestamp: Date.now(),
    };
  }

  destroy(): void {
    this.stop();
    this.callbacks = [];
  }
}
