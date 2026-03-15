import { trilaterate, computeGDOP } from '../core/trilateration';

describe('trilaterate', () => {
  it('should return null with fewer than 2 measurements', () => {
    expect(trilaterate([])).toBeNull();
  });

  it('should return weighted midpoint with 2 measurements', () => {
    const result = trilaterate([
      { position: { x: 0, y: 0, z: 0 }, distance: 3 },
      { position: { x: 10, y: 0, z: 0 }, distance: 7 },
    ]);

    expect(result).not.toBeNull();
    // Weighted: t = 3/10, position = (0,0,0) + (10,0,0) * 0.3 = (3, 0, 0)
    expect(result!.x).toBeCloseTo(3, 0);
    expect(result!.y).toBeCloseTo(0, 0);
  });

  it('should find position at center with equidistant APs', () => {
    // 3 APs at triangle corners, user at center
    const result = trilaterate([
      { position: { x: 0, y: 0, z: 0 }, distance: 5.77 },
      { position: { x: 10, y: 0, z: 0 }, distance: 5.77 },
      { position: { x: 5, y: 8.66, z: 0 }, distance: 5.77 },
    ]);

    expect(result).not.toBeNull();
    // Center of equilateral triangle with side 10
    expect(result!.x).toBeCloseTo(5, 0);
    expect(result!.y).toBeCloseTo(2.89, 0);
  });

  it('should find a known position with 4 APs', () => {
    // User at (3, 4, 0)
    const userPos = { x: 3, y: 4, z: 0 };
    const aps = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 10, y: 10, z: 0 },
    ];

    const measurements = aps.map((ap) => ({
      position: ap,
      distance: Math.sqrt(
        (ap.x - userPos.x) ** 2 +
        (ap.y - userPos.y) ** 2 +
        (ap.z - userPos.z) ** 2,
      ),
    }));

    const result = trilaterate(measurements);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(3, 0);
    expect(result!.y).toBeCloseTo(4, 0);
    expect(result!.z).toBeCloseTo(0, 0);
  });

  it('should handle 3D positioning', () => {
    // User at (2, 3, 1.5)
    const userPos = { x: 2, y: 3, z: 1.5 };
    const aps = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 0, y: 0, z: 3 },
    ];

    const measurements = aps.map((ap) => ({
      position: ap,
      distance: Math.sqrt(
        (ap.x - userPos.x) ** 2 +
        (ap.y - userPos.y) ** 2 +
        (ap.z - userPos.z) ** 2,
      ),
    }));

    const result = trilaterate(measurements);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(2, 0);
    expect(result!.y).toBeCloseTo(3, 0);
    expect(result!.z).toBeCloseTo(1.5, 0);
  });
});

describe('computeGDOP', () => {
  it('should return Infinity with fewer than 3 APs', () => {
    const gdop = computeGDOP([{ x: 0, y: 0, z: 0 }], { x: 1, y: 1, z: 0 });
    expect(gdop).toBe(Infinity);
  });

  it('should return lower GDOP for well-distributed APs', () => {
    const position = { x: 5, y: 5, z: 0 };

    // Well distributed (square corners)
    const goodAPs = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 10, y: 10, z: 0 },
    ];

    // Poorly distributed (all on one side)
    const badAPs = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ];

    const goodGDOP = computeGDOP(goodAPs, position);
    const badGDOP = computeGDOP(badAPs, position);

    expect(goodGDOP).toBeLessThan(badGDOP);
    expect(goodGDOP).toBeLessThan(5); // Good geometry
  });
});
