import { DeadReckoning } from '../core/dead-reckoning';
import { IMUReading } from '../types';

function makeReading(
  ax: number,
  ay: number,
  az: number,
  timestamp: number,
): IMUReading {
  return {
    acceleration: { x: ax, y: ay, z: az },
    rotation: { x: 0, y: 0, z: 0 },
    magnetic: { x: 0, y: 1, z: 0 }, // Pointing north
    timestamp,
  };
}

describe('DeadReckoning', () => {
  it('should start at origin', () => {
    const dr = new DeadReckoning();
    expect(dr.getPosition()).toEqual({ x: 0, y: 0, z: 0 });
    expect(dr.getStepCount()).toBe(0);
  });

  it('should detect a step from accelerometer peak', () => {
    const dr = new DeadReckoning(11.5, 100); // Lower min interval for test
    let t = 0;

    // Initialize
    dr.update(makeReading(0, 0, 9.8, t));
    t += 50;

    // Simulate walking: rising acceleration
    for (let i = 0; i < 5; i++) {
      dr.update(makeReading(0, 0, 10 + i * 0.5, t));
      t += 50;
    }

    // Peak
    dr.update(makeReading(0, 0, 13, t));
    t += 50;

    // Falling
    for (let i = 0; i < 5; i++) {
      dr.update(makeReading(0, 0, 12 - i * 0.5, t));
      t += 50;
    }

    expect(dr.getStepCount()).toBeGreaterThanOrEqual(1);
  });

  it('should not count steps below threshold', () => {
    const dr = new DeadReckoning(11.5, 100);
    let t = 0;

    dr.update(makeReading(0, 0, 9.8, t));
    t += 50;

    // Small accelerations - no step
    for (let i = 0; i < 20; i++) {
      dr.update(makeReading(0, 0, 9.8 + Math.sin(i) * 0.5, t));
      t += 50;
    }

    expect(dr.getStepCount()).toBe(0);
  });

  it('should reset correctly', () => {
    const dr = new DeadReckoning();
    dr.update(makeReading(0, 0, 13, 0));
    dr.update(makeReading(0, 0, 9, 100));

    dr.reset();
    expect(dr.getPosition()).toEqual({ x: 0, y: 0, z: 0 });
    expect(dr.getStepCount()).toBe(0);
  });

  it('should allow external position setting', () => {
    const dr = new DeadReckoning();
    dr.setPosition({ x: 5, y: 10, z: 0 });
    expect(dr.getPosition()).toEqual({ x: 5, y: 10, z: 0 });
  });
});
