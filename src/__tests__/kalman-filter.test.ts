import { KalmanFilter } from '../core/kalman-filter';

describe('KalmanFilter', () => {
  it('should initialize at origin', () => {
    const kf = new KalmanFilter();
    const state = kf.getState();
    expect(state.position.x).toBe(0);
    expect(state.position.y).toBe(0);
    expect(state.position.z).toBe(0);
  });

  it('should advance position with velocity after predict', () => {
    const kf = new KalmanFilter();
    // Set initial velocity by updating with a position
    kf.updateWifi({ x: 1, y: 0, z: 0 }, 1.0);

    // Predict with dt=1s and acceleration
    kf.predict(1.0, { x: 1, y: 0, z: 0 });

    const state = kf.getState();
    // Position should have moved from the acceleration
    expect(state.position.x).toBeGreaterThan(0.5);
  });

  it('should pull position toward measurement on update', () => {
    const kf = new KalmanFilter();

    // Predict to build some uncertainty
    kf.predict(1.0);
    kf.predict(1.0);

    // Update with a measurement at (10, 5, 0)
    kf.updateWifi({ x: 10, y: 5, z: 0 }, 0.8);

    const state = kf.getState();
    // Position should move toward measurement
    expect(state.position.x).toBeGreaterThan(0);
    expect(state.position.y).toBeGreaterThan(0);
  });

  it('should converge toward repeated measurements', () => {
    const kf = new KalmanFilter(0.1, 2.0);
    const target = { x: 5, y: 3, z: 1 };

    // Apply many measurements at the same position
    for (let i = 0; i < 20; i++) {
      kf.predict(0.1);
      kf.updateWifi(target, 0.7);
    }

    const state = kf.getState();
    expect(state.position.x).toBeCloseTo(target.x, 0);
    expect(state.position.y).toBeCloseTo(target.y, 0);
    expect(state.position.z).toBeCloseTo(target.z, 0);
  });

  it('should have higher confidence after updates', () => {
    const kf = new KalmanFilter();

    const confBefore = kf.getConfidence();

    for (let i = 0; i < 5; i++) {
      kf.predict(0.1);
      kf.updateWifi({ x: 5, y: 5, z: 0 }, 0.5);
    }

    const confAfter = kf.getConfidence();
    expect(confAfter).toBeGreaterThan(confBefore);
  });

  it('should handle setPosition', () => {
    const kf = new KalmanFilter();
    kf.setPosition({ x: 10, y: 20, z: 3 });

    const state = kf.getState();
    expect(state.position.x).toBe(10);
    expect(state.position.y).toBe(20);
    expect(state.position.z).toBe(3);
  });

  it('should skip predict with invalid dt', () => {
    const kf = new KalmanFilter();
    kf.setPosition({ x: 5, y: 5, z: 0 });

    kf.predict(0); // Should be ignored
    kf.predict(-1); // Should be ignored
    kf.predict(3); // Should be ignored (> 2s)

    const state = kf.getState();
    expect(state.position.x).toBe(5);
    expect(state.position.y).toBe(5);
  });
});
