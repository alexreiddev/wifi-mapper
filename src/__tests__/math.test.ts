import {
  magnitude,
  normalize,
  add,
  subtract,
  scale,
  dot,
  cross,
  distance,
  matMultiply,
  matInverse,
  identity,
  median,
  clamp,
  degreesToRadians,
  radiansToDegrees,
} from '../utils/math';

describe('Vector operations', () => {
  it('magnitude', () => {
    expect(magnitude({ x: 3, y: 4, z: 0 })).toBe(5);
    expect(magnitude({ x: 0, y: 0, z: 0 })).toBe(0);
    expect(magnitude({ x: 1, y: 1, z: 1 })).toBeCloseTo(Math.sqrt(3));
  });

  it('normalize', () => {
    const n = normalize({ x: 3, y: 4, z: 0 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(magnitude(n)).toBeCloseTo(1);
  });

  it('normalize zero vector', () => {
    const n = normalize({ x: 0, y: 0, z: 0 });
    expect(n).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('add', () => {
    const r = add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });
    expect(r).toEqual({ x: 5, y: 7, z: 9 });
  });

  it('subtract', () => {
    const r = subtract({ x: 5, y: 7, z: 9 }, { x: 1, y: 2, z: 3 });
    expect(r).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('scale', () => {
    const r = scale({ x: 1, y: 2, z: 3 }, 2);
    expect(r).toEqual({ x: 2, y: 4, z: 6 });
  });

  it('dot product', () => {
    expect(dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(0);
    expect(dot({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toBe(32);
  });

  it('cross product', () => {
    const r = cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(r).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('distance', () => {
    const d = distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
    expect(d).toBe(5);
  });
});

describe('Matrix operations', () => {
  it('identity', () => {
    const I = identity(3);
    expect(I).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });

  it('matMultiply identity', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const I = identity(2);
    expect(matMultiply(A, I)).toEqual(A);
  });

  it('matMultiply', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const B = [
      [5, 6],
      [7, 8],
    ];
    expect(matMultiply(A, B)).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it('matInverse 2x2', () => {
    const A = [
      [4, 7],
      [2, 6],
    ];
    const inv = matInverse(A);
    expect(inv).not.toBeNull();
    expect(inv![0][0]).toBeCloseTo(0.6);
    expect(inv![0][1]).toBeCloseTo(-0.7);
    expect(inv![1][0]).toBeCloseTo(-0.2);
    expect(inv![1][1]).toBeCloseTo(0.4);
  });

  it('matInverse singular returns null', () => {
    const A = [
      [1, 2],
      [2, 4],
    ];
    expect(matInverse(A)).toBeNull();
  });

  it('A * A^-1 = I', () => {
    const A = [
      [1, 2, 3],
      [0, 1, 4],
      [5, 6, 0],
    ];
    const inv = matInverse(A);
    expect(inv).not.toBeNull();
    const product = matMultiply(A, inv!);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product[i][j]).toBeCloseTo(i === j ? 1 : 0, 8);
      }
    }
  });
});

describe('Scalar utilities', () => {
  it('median odd length', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('median even length', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('median empty', () => {
    expect(median([])).toBe(0);
  });

  it('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('degreesToRadians', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it('radiansToDegrees', () => {
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
  });
});
