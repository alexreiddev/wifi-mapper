import { Vector3D, MapPoint } from '../types';
import { OCTREE_MAX_DEPTH, OCTREE_MAX_POINTS_PER_LEAF } from '../utils/constants';

interface Bounds {
  min: Vector3D;
  max: Vector3D;
}

/**
 * Octree spatial index for efficient point cloud management.
 * Supports insertion, radius queries, and LOD-based retrieval.
 */
export class OctreeNode {
  private bounds: Bounds;
  private depth: number;
  private maxDepth: number;
  private maxPoints: number;
  private points: MapPoint[] = [];
  private children: OctreeNode[] | null = null;

  constructor(
    bounds: Bounds,
    depth = 0,
    maxDepth = OCTREE_MAX_DEPTH,
    maxPoints = OCTREE_MAX_POINTS_PER_LEAF,
  ) {
    this.bounds = bounds;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.maxPoints = maxPoints;
  }

  /**
   * Insert a point into the octree.
   */
  insert(point: MapPoint): boolean {
    if (!this.containsPoint(point.position)) return false;

    if (this.children) {
      // Try inserting into children
      for (const child of this.children) {
        if (child.insert(point)) return true;
      }
      return false;
    }

    this.points.push(point);

    if (this.points.length > this.maxPoints && this.depth < this.maxDepth) {
      this.subdivide();
    }

    return true;
  }

  private subdivide(): void {
    const { min, max } = this.bounds;
    const mid: Vector3D = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    };

    this.children = [
      new OctreeNode({ min: { x: min.x, y: min.y, z: min.z }, max: { x: mid.x, y: mid.y, z: mid.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: mid.x, y: min.y, z: min.z }, max: { x: max.x, y: mid.y, z: mid.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: min.x, y: mid.y, z: min.z }, max: { x: mid.x, y: max.y, z: mid.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: mid.x, y: mid.y, z: min.z }, max: { x: max.x, y: max.y, z: mid.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: min.x, y: min.y, z: mid.z }, max: { x: mid.x, y: mid.y, z: max.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: mid.x, y: min.y, z: mid.z }, max: { x: max.x, y: mid.y, z: max.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: min.x, y: mid.y, z: mid.z }, max: { x: mid.x, y: max.y, z: max.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
      new OctreeNode({ min: { x: mid.x, y: mid.y, z: mid.z }, max: { x: max.x, y: max.y, z: max.z } }, this.depth + 1, this.maxDepth, this.maxPoints),
    ];

    // Re-insert existing points into children
    for (const point of this.points) {
      for (const child of this.children) {
        if (child.insert(point)) break;
      }
    }
    this.points = [];
  }

  /**
   * Query all points within a radius of a center point.
   */
  queryRadius(center: Vector3D, radius: number): MapPoint[] {
    const results: MapPoint[] = [];
    this.queryRadiusRecursive(center, radius, radius * radius, results);
    return results;
  }

  private queryRadiusRecursive(
    center: Vector3D,
    radius: number,
    radiusSq: number,
    results: MapPoint[],
  ): void {
    // Check if this node's bounds intersect the query sphere
    if (!this.intersectsSphere(center, radius)) return;

    if (this.children) {
      for (const child of this.children) {
        child.queryRadiusRecursive(center, radius, radiusSq, results);
      }
    } else {
      for (const point of this.points) {
        const dx = point.position.x - center.x;
        const dy = point.position.y - center.y;
        const dz = point.position.z - center.z;
        if (dx * dx + dy * dy + dz * dz <= radiusSq) {
          results.push(point);
        }
      }
    }
  }

  /**
   * Get all points, up to a maximum count (for LOD rendering).
   */
  getAllPoints(maxCount?: number): MapPoint[] {
    const results: MapPoint[] = [];
    this.collectPoints(results, maxCount ?? Infinity);
    return results;
  }

  private collectPoints(results: MapPoint[], maxCount: number): void {
    if (results.length >= maxCount) return;

    if (this.children) {
      for (const child of this.children) {
        child.collectPoints(results, maxCount);
        if (results.length >= maxCount) return;
      }
    } else {
      for (const point of this.points) {
        results.push(point);
        if (results.length >= maxCount) return;
      }
    }
  }

  getTotalPointCount(): number {
    if (this.children) {
      return this.children.reduce((sum, child) => sum + child.getTotalPointCount(), 0);
    }
    return this.points.length;
  }

  private containsPoint(p: Vector3D): boolean {
    return (
      p.x >= this.bounds.min.x &&
      p.x <= this.bounds.max.x &&
      p.y >= this.bounds.min.y &&
      p.y <= this.bounds.max.y &&
      p.z >= this.bounds.min.z &&
      p.z <= this.bounds.max.z
    );
  }

  private intersectsSphere(center: Vector3D, radius: number): boolean {
    // Find closest point on AABB to sphere center
    const closestX = Math.max(this.bounds.min.x, Math.min(center.x, this.bounds.max.x));
    const closestY = Math.max(this.bounds.min.y, Math.min(center.y, this.bounds.max.y));
    const closestZ = Math.max(this.bounds.min.z, Math.min(center.z, this.bounds.max.z));

    const dx = closestX - center.x;
    const dy = closestY - center.y;
    const dz = closestZ - center.z;

    return dx * dx + dy * dy + dz * dz <= radius * radius;
  }

  getBounds(): Bounds {
    return { ...this.bounds };
  }
}

/**
 * Create an octree with default bounds suitable for indoor mapping.
 * Covers 200m x 200m x 50m centered at origin.
 */
export function createDefaultOctree(): OctreeNode {
  return new OctreeNode({
    min: { x: -100, y: -100, z: -25 },
    max: { x: 100, y: 100, z: 25 },
  });
}
