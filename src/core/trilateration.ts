import { Vector3D } from '../types';
import {
  matMultiply,
  matTranspose,
  matInverse,
  distance as vecDistance,
} from '../utils/math';

interface APMeasurement {
  position: Vector3D;
  distance: number;
}

/**
 * 3D trilateration using linearized least squares.
 *
 * Given n access points with known positions and estimated distances,
 * solves for the user's position by linearizing the sphere equations.
 *
 * Method: Subtract the last AP's sphere equation from each other AP's
 * equation, yielding a linear system Ax = b.
 *
 * Automatically detects coplanar APs (all same z) and falls back to 2D.
 *
 * @returns estimated position, or null if insufficient data
 */
export function trilaterate(measurements: APMeasurement[]): Vector3D | null {
  if (measurements.length < 3) {
    return trilaterateDegraded(measurements);
  }

  // Check if all APs are coplanar in Z (common indoor case)
  const allSameZ = measurements.every(
    (m) => Math.abs(m.position.z - measurements[0].position.z) < 0.01,
  );

  if (allSameZ) {
    return trilaterate2D(measurements, measurements[0].position.z);
  }

  return trilaterate3D(measurements);
}

/**
 * Full 3D trilateration for non-coplanar APs.
 */
function trilaterate3D(measurements: APMeasurement[]): Vector3D | null {
  const n = measurements.length;
  const ref = measurements[n - 1];

  const A: number[][] = [];
  const b: number[][] = [];

  for (let i = 0; i < n - 1; i++) {
    const ap = measurements[i];
    // Derivation: subtract ref sphere eq from AP_i sphere eq
    // 2(xr-xi)x + 2(yr-yi)y + 2(zr-zi)z = di²-dr² - xi²+xr² - yi²+yr² - zi²+zr²
    A.push([
      2 * (ref.position.x - ap.position.x),
      2 * (ref.position.y - ap.position.y),
      2 * (ref.position.z - ap.position.z),
    ]);

    const bVal =
      ap.distance * ap.distance -
      ref.distance * ref.distance -
      ap.position.x * ap.position.x +
      ref.position.x * ref.position.x -
      ap.position.y * ap.position.y +
      ref.position.y * ref.position.y -
      ap.position.z * ap.position.z +
      ref.position.z * ref.position.z;
    b.push([bVal]);
  }

  return solveLeastSquares(A, b);
}

/**
 * 2D trilateration when all APs share the same Z coordinate.
 * Solves for (x, y) and uses the common z value.
 */
function trilaterate2D(
  measurements: APMeasurement[],
  commonZ: number,
): Vector3D | null {
  const n = measurements.length;
  const ref = measurements[n - 1];

  const A: number[][] = [];
  const b: number[][] = [];

  for (let i = 0; i < n - 1; i++) {
    const ap = measurements[i];
    A.push([
      2 * (ref.position.x - ap.position.x),
      2 * (ref.position.y - ap.position.y),
    ]);

    const bVal =
      ap.distance * ap.distance -
      ref.distance * ref.distance -
      ap.position.x * ap.position.x +
      ref.position.x * ref.position.x -
      ap.position.y * ap.position.y +
      ref.position.y * ref.position.y;
    b.push([bVal]);
  }

  const result = solveLeastSquares(A, b);
  if (!result) return null;

  return { x: result.x, y: result.y, z: commonZ };
}

/**
 * Solve Ax = b via least squares: x = (AᵀA)⁻¹Aᵀb
 * Returns a Vector3D with z=0 for 2D solutions.
 */
function solveLeastSquares(
  A: number[][],
  b: number[][],
): Vector3D | null {
  const AT = matTranspose(A);
  const ATA = matMultiply(AT, A);
  const ATAinv = matInverse(ATA);

  if (!ATAinv) return null;

  const ATb = matMultiply(AT, b);
  const result = matMultiply(ATAinv, ATb);

  return {
    x: result[0][0],
    y: result[1][0],
    z: result.length > 2 ? result[2][0] : 0,
  };
}

/**
 * Degraded trilateration with fewer than 3 APs.
 */
function trilaterateDegraded(
  measurements: APMeasurement[],
): Vector3D | null {
  if (measurements.length === 0) return null;

  if (measurements.length === 1) {
    return { ...measurements[0].position };
  }

  // 2 APs: weighted point on the line between them
  const [a, b] = measurements;
  const totalDist = a.distance + b.distance;
  if (totalDist === 0) {
    return {
      x: (a.position.x + b.position.x) / 2,
      y: (a.position.y + b.position.y) / 2,
      z: (a.position.z + b.position.z) / 2,
    };
  }

  const t = a.distance / totalDist;
  return {
    x: a.position.x + (b.position.x - a.position.x) * t,
    y: a.position.y + (b.position.y - a.position.y) * t,
    z: a.position.z + (b.position.z - a.position.z) * t,
  };
}

/**
 * Compute Geometric Dilution of Precision (GDOP).
 * Lower values = better AP geometry for positioning.
 */
export function computeGDOP(
  apPositions: Vector3D[],
  estimatedPosition: Vector3D,
): number {
  if (apPositions.length < 3) return Infinity;

  // Check if coplanar — use 2D GDOP
  const allSameZ = apPositions.every(
    (ap) => Math.abs(ap.z - apPositions[0].z) < 0.01,
  );

  // Build geometry matrix H
  const H: number[][] = [];
  for (const ap of apPositions) {
    const d = vecDistance(ap, estimatedPosition);
    if (d < 0.01) continue; // Skip if too close

    if (allSameZ) {
      H.push([
        (estimatedPosition.x - ap.x) / d,
        (estimatedPosition.y - ap.y) / d,
      ]);
    } else {
      H.push([
        (estimatedPosition.x - ap.x) / d,
        (estimatedPosition.y - ap.y) / d,
        (estimatedPosition.z - ap.z) / d,
      ]);
    }
  }

  if (H.length < (allSameZ ? 2 : 3)) return Infinity;

  const HT = matTranspose(H);
  const HTH = matMultiply(HT, H);
  const HTHinv = matInverse(HTH);

  if (!HTHinv) return Infinity;

  let trace = 0;
  for (let i = 0; i < HTHinv.length; i++) {
    trace += HTHinv[i][i];
  }

  return Math.sqrt(Math.max(0, trace));
}
