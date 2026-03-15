import { Vector3D, KalmanState } from '../types';
import {
  identity,
  matMultiply,
  matTranspose,
  matAdd,
  matSubtract,
  matInverse,
  matCreate,
  ZERO_VECTOR,
} from '../utils/math';
import {
  KALMAN_PROCESS_NOISE,
  KALMAN_MEASUREMENT_NOISE,
} from '../utils/constants';

/**
 * Extended Kalman Filter for 3D position tracking.
 *
 * State vector: [x, y, z, vx, vy, vz] (position + velocity)
 *
 * - Predict: constant velocity model with IMU acceleration as control input
 * - Update: WiFi trilaterated position as measurement
 * - Adaptive R: measurement noise scales with confidence
 */
export class KalmanFilter {
  private state: number[][]; // 6x1 column vector
  private P: number[][]; // 6x6 covariance matrix
  private Q: number[][]; // 6x6 process noise
  private baseR: number; // base measurement noise

  constructor(
    processNoise = KALMAN_PROCESS_NOISE,
    measurementNoise = KALMAN_MEASUREMENT_NOISE,
  ) {
    // Initialize state to origin with zero velocity
    this.state = [[0], [0], [0], [0], [0], [0]];

    // Initial covariance: high uncertainty
    this.P = identity(6).map((row) => row.map((v) => v * 100));

    // Process noise
    this.Q = identity(6).map((row) => row.map((v) => v * processNoise));

    this.baseR = measurementNoise;
  }

  /**
   * Predict step: advance state using constant velocity model + IMU acceleration.
   *
   * @param dt - time step in seconds
   * @param acceleration - IMU acceleration in m/s^2 (body frame, gravity-compensated)
   */
  predict(dt: number, acceleration: Vector3D = ZERO_VECTOR): void {
    if (dt <= 0 || dt > 2) return;

    // State transition matrix F (constant velocity)
    // [x]     [1 0 0 dt 0  0 ] [x]     [0.5*dt^2  0        0       ]
    // [y]     [0 1 0 0  dt 0 ] [y]     [0         0.5*dt^2 0       ]
    // [z]  =  [0 0 1 0  0  dt] [z]  +  [0         0        0.5*dt^2] * [ax, ay, az]
    // [vx]    [0 0 0 1  0  0 ] [vx]    [dt        0        0       ]
    // [vy]    [0 0 0 0  1  0 ] [vy]    [0         dt       0       ]
    // [vz]    [0 0 0 0  0  1 ] [vz]    [0         0        dt      ]
    const F = identity(6);
    F[0][3] = dt;
    F[1][4] = dt;
    F[2][5] = dt;

    // Control input matrix B
    const dt2 = 0.5 * dt * dt;
    const u: number[][] = [
      [acceleration.x],
      [acceleration.y],
      [acceleration.z],
    ];
    const B: number[][] = [
      [dt2, 0, 0],
      [0, dt2, 0],
      [0, 0, dt2],
      [dt, 0, 0],
      [0, dt, 0],
      [0, 0, dt],
    ];

    // x_k = F * x_{k-1} + B * u
    const Fx = matMultiply(F, this.state);
    const Bu = matMultiply(B, u);
    this.state = matAdd(Fx, Bu);

    // P_k = F * P * F^T + Q
    const FP = matMultiply(F, this.P);
    const FT = matTranspose(F);
    const FPFT = matMultiply(FP, FT);

    // Scale Q with dt for time-varying process noise
    const Qscaled = this.Q.map((row) => row.map((v) => v * dt));
    this.P = matAdd(FPFT, Qscaled);
  }

  /**
   * Update step: correct state using WiFi trilaterated position.
   *
   * @param position - measured position from trilateration
   * @param confidence - 0 to 1, higher = more trust in measurement
   */
  updateWifi(position: Vector3D, confidence: number = 0.5): void {
    // Measurement vector z (position only)
    const z: number[][] = [[position.x], [position.y], [position.z]];

    // Observation matrix H: maps state to measurement (picks out position)
    const H: number[][] = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
    ];

    // Adaptive measurement noise R
    // Lower confidence → higher noise (trust measurement less)
    const rScale = this.baseR / Math.max(confidence, 0.01);
    const R: number[][] = [
      [rScale, 0, 0],
      [0, rScale, 0],
      [0, 0, rScale * 2], // Z-axis has more uncertainty
    ];

    // Innovation: y = z - H * x
    const Hx = matMultiply(H, this.state);
    const y = matSubtract(z, Hx);

    // Innovation covariance: S = H * P * H^T + R
    const HT = matTranspose(H);
    const HP = matMultiply(H, this.P);
    const HPHT = matMultiply(HP, HT);
    const S = matAdd(HPHT, R);

    // Kalman gain: K = P * H^T * S^-1
    const Sinv = matInverse(S);
    if (!Sinv) return; // Singular, skip update

    const PHT = matMultiply(this.P, HT);
    const K = matMultiply(PHT, Sinv);

    // State update: x = x + K * y
    const Ky = matMultiply(K, y);
    this.state = matAdd(this.state, Ky);

    // Covariance update: P = (I - K * H) * P
    const KH = matMultiply(K, H);
    const IKH = matSubtract(identity(6), KH);
    this.P = matMultiply(IKH, this.P);
  }

  /**
   * Get the current estimated state.
   */
  getState(): KalmanState {
    return {
      position: {
        x: this.state[0][0],
        y: this.state[1][0],
        z: this.state[2][0],
      },
      velocity: {
        x: this.state[3][0],
        y: this.state[4][0],
        z: this.state[5][0],
      },
      covariance: this.P.map((row) => [...row]),
    };
  }

  /**
   * Get the position uncertainty (sqrt of position covariance diagonal).
   */
  getPositionUncertainty(): Vector3D {
    return {
      x: Math.sqrt(Math.max(0, this.P[0][0])),
      y: Math.sqrt(Math.max(0, this.P[1][1])),
      z: Math.sqrt(Math.max(0, this.P[2][2])),
    };
  }

  /**
   * Get a scalar confidence value (0-1) from the covariance.
   */
  getConfidence(): number {
    const unc = this.getPositionUncertainty();
    const totalUnc = Math.sqrt(unc.x * unc.x + unc.y * unc.y + unc.z * unc.z);
    // Map uncertainty to confidence: 0m → 1.0, 10m+ → ~0.0
    return Math.max(0, Math.min(1, 1 - totalUnc / 10));
  }

  /**
   * Set the state position directly (for initialization).
   */
  setPosition(pos: Vector3D): void {
    this.state[0][0] = pos.x;
    this.state[1][0] = pos.y;
    this.state[2][0] = pos.z;
  }

  reset(): void {
    this.state = [[0], [0], [0], [0], [0], [0]];
    this.P = identity(6).map((row) => row.map((v) => v * 100));
  }

  updateParams(processNoise: number, measurementNoise: number): void {
    this.Q = identity(6).map((row) => row.map((v) => v * processNoise));
    this.baseR = measurementNoise;
  }
}
