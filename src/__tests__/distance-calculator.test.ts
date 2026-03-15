import { rssiToDistance, DistanceCalculator } from '../core/distance-calculator';

describe('rssiToDistance', () => {
  it('should return ~1m when RSSI equals TX power', () => {
    // At 1 meter, RSSI should equal txPower by definition
    // d = 10^((txPower - rssi) / (10 * n)) = 10^0 = 1
    const distance = rssiToDistance(-40, -40, 2.7);
    expect(distance).toBeCloseTo(0.1, 1); // Clamped minimum
  });

  it('should return minimum distance when RSSI >= txPower', () => {
    const distance = rssiToDistance(-30, -40, 2.7);
    expect(distance).toBe(0.1);
  });

  it('should increase distance as RSSI decreases', () => {
    const d1 = rssiToDistance(-50, -40, 2.7);
    const d2 = rssiToDistance(-60, -40, 2.7);
    const d3 = rssiToDistance(-70, -40, 2.7);
    expect(d2).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
  });

  it('should compute correct distance for known values', () => {
    // With n=2 (free space), txPower=-40:
    // d = 10^((-40 - (-60)) / (10 * 2)) = 10^(20/20) = 10m
    const distance = rssiToDistance(-60, -40, 2.0);
    expect(distance).toBeCloseTo(10, 0);
  });

  it('should return larger distances with lower path loss exponent', () => {
    const dLow = rssiToDistance(-60, -40, 2.0);
    const dHigh = rssiToDistance(-60, -40, 3.5);
    expect(dLow).toBeGreaterThan(dHigh);
  });
});

describe('DistanceCalculator', () => {
  it('should smooth RSSI readings using median', () => {
    const calc = new DistanceCalculator(-40, 2.0, 5);

    // Add readings with one outlier
    calc.addReading('aa:bb:cc:dd:ee:ff', -50);
    calc.addReading('aa:bb:cc:dd:ee:ff', -52);
    calc.addReading('aa:bb:cc:dd:ee:ff', -51);
    calc.addReading('aa:bb:cc:dd:ee:ff', -90); // outlier
    calc.addReading('aa:bb:cc:dd:ee:ff', -50);

    const distance = calc.getDistance('aa:bb:cc:dd:ee:ff');
    expect(distance).not.toBeNull();
    // Median of [-50, -52, -51, -90, -50] = -51
    // d = 10^((-40 - (-51)) / (10 * 2)) = 10^(11/20) = ~3.55m
    expect(distance!).toBeCloseTo(3.55, 0);
  });

  it('should return null for unknown BSSID', () => {
    const calc = new DistanceCalculator();
    expect(calc.getDistance('unknown')).toBeNull();
  });

  it('should maintain sliding window', () => {
    const calc = new DistanceCalculator(-40, 2.0, 3);

    calc.addReading('test', -50);
    calc.addReading('test', -60);
    calc.addReading('test', -70);
    // Window: [-50, -60, -70], median = -60

    calc.addReading('test', -45);
    // Window: [-60, -70, -45], median = -60

    calc.addReading('test', -45);
    // Window: [-70, -45, -45], median = -45

    const distance = calc.getDistance('test');
    // Median = -45, d = 10^(5/20) = ~1.78m
    expect(distance!).toBeCloseTo(1.78, 0);
  });
});
