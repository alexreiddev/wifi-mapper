import { Vector3D, IMUReading } from '../types';
import {
  STEP_DETECTION_THRESHOLD,
  MIN_STEP_INTERVAL_MS,
  STEP_LENGTH_K,
  HEADING_COMPLEMENTARY_ALPHA,
} from '../utils/constants';
import { magnitude, degreesToRadians } from '../utils/math';

/**
 * Pedestrian Dead Reckoning (PDR) using smartphone IMU sensors.
 *
 * Estimates relative displacement from a starting point by:
 * 1. Detecting steps via accelerometer magnitude peaks
 * 2. Estimating step length via Weinberg's model
 * 3. Tracking heading via complementary filter (gyro + magnetometer)
 */
export class DeadReckoning {
  private position: Vector3D = { x: 0, y: 0, z: 0 };
  private heading = 0; // radians, 0 = north (+y)
  private stepCount = 0;
  private lastStepTime = 0;

  // Step detection state
  private accelWindow: number[] = [];
  private windowSize = 20; // ~1 second at 20Hz
  private peakDetected = false;
  private lastPeakMagnitude = 0;

  // Heading integration
  private gyroHeading = 0;
  private lastTimestamp = 0;
  private isInitialized = false;

  // Configurable
  private stepThreshold: number;
  private minStepInterval: number;
  private stepLengthK: number;
  private complementaryAlpha: number;

  constructor(
    stepThreshold = STEP_DETECTION_THRESHOLD,
    minStepInterval = MIN_STEP_INTERVAL_MS,
    stepLengthK = STEP_LENGTH_K,
    complementaryAlpha = HEADING_COMPLEMENTARY_ALPHA,
  ) {
    this.stepThreshold = stepThreshold;
    this.minStepInterval = minStepInterval;
    this.stepLengthK = stepLengthK;
    this.complementaryAlpha = complementaryAlpha;
  }

  /**
   * Process a new IMU reading. Returns the current cumulative displacement.
   */
  update(reading: IMUReading): Vector3D {
    const now = reading.timestamp;

    if (!this.isInitialized) {
      this.lastTimestamp = now;
      this.isInitialized = true;
      this.heading = this.magnetometerHeading(reading.magnetic);
      this.gyroHeading = this.heading;
      return { ...this.position };
    }

    const dt = (now - this.lastTimestamp) / 1000; // seconds
    this.lastTimestamp = now;

    if (dt <= 0 || dt > 1) return { ...this.position }; // Skip bad intervals

    // 1. Update heading with complementary filter
    this.updateHeading(reading, dt);

    // 2. Detect steps and update position
    this.detectStep(reading, now);

    return { ...this.position };
  }

  private updateHeading(reading: IMUReading, dt: number): void {
    // Integrate gyroscope (z-axis rotation = heading change)
    // Note: gyroscope z-axis gives yaw rate when phone is held upright
    this.gyroHeading += reading.rotation.z * dt;

    // Get absolute heading from magnetometer
    const magHeading = this.magnetometerHeading(reading.magnetic);

    // Complementary filter: trust gyro short-term, mag long-term
    this.heading =
      this.complementaryAlpha * this.gyroHeading +
      (1 - this.complementaryAlpha) * magHeading;

    // Normalize to [0, 2*PI)
    this.heading = ((this.heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  private magnetometerHeading(magnetic: Vector3D): number {
    // atan2(x, y) gives heading relative to magnetic north
    return Math.atan2(magnetic.x, magnetic.y);
  }

  private detectStep(reading: IMUReading, now: number): void {
    const accelMag = magnitude(reading.acceleration);
    this.accelWindow.push(accelMag);
    if (this.accelWindow.length > this.windowSize) {
      this.accelWindow.shift();
    }

    if (this.accelWindow.length < 3) return;

    // Simple peak detection
    const prev = this.accelWindow[this.accelWindow.length - 2];
    const curr = this.accelWindow[this.accelWindow.length - 1];
    const prevPrev =
      this.accelWindow.length >= 3
        ? this.accelWindow[this.accelWindow.length - 3]
        : prev;

    const isPeak = prev > prevPrev && prev > curr && prev > this.stepThreshold;
    const timeSinceLastStep = now - this.lastStepTime;

    if (isPeak && timeSinceLastStep > this.minStepInterval) {
      // Step detected!
      this.stepCount++;
      this.lastStepTime = now;
      this.lastPeakMagnitude = prev;

      // Estimate step length using Weinberg's model
      const aMax = Math.max(...this.accelWindow);
      const aMin = Math.min(...this.accelWindow);
      const stepLength = this.stepLengthK * Math.pow(aMax - aMin, 0.25);

      // Update position based on heading
      this.position.x += stepLength * Math.sin(this.heading);
      this.position.y += stepLength * Math.cos(this.heading);
      // z stays 0 for V1 (flat floor assumption)

      // Clear window after step
      this.accelWindow = [];
    }
  }

  getPosition(): Vector3D {
    return { ...this.position };
  }

  getHeading(): number {
    return this.heading;
  }

  getStepCount(): number {
    return this.stepCount;
  }

  reset(): void {
    this.position = { x: 0, y: 0, z: 0 };
    this.heading = 0;
    this.gyroHeading = 0;
    this.stepCount = 0;
    this.lastStepTime = 0;
    this.accelWindow = [];
    this.peakDetected = false;
    this.isInitialized = false;
  }

  /**
   * Set position externally (e.g. from WiFi fix to correct drift).
   */
  setPosition(pos: Vector3D): void {
    this.position = { ...pos };
  }
}
