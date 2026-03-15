import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { MapPoint, Vector3D } from '../types';
import { COLORS, SIGNAL_STRONG_THRESHOLD, SIGNAL_WEAK_THRESHOLD } from '../utils/constants';
import { clamp } from '../utils/math';

interface PointCloud3DProps {
  points: MapPoint[];
  currentPosition: Vector3D | null;
  maxPoints?: number;
}

/**
 * 3D point cloud renderer using expo-gl + expo-three.
 * Renders map points colored by signal strength with
 * touch controls for rotation and zoom.
 */
export function PointCloud3D({
  points,
  currentPosition,
  maxPoints = 10000,
}: PointCloud3DProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const pointsGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const positionMarkerRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastPointCountRef = useRef(0);

  // Camera orbit state
  const cameraOrbit = useRef({
    theta: Math.PI / 4, // horizontal angle
    phi: Math.PI / 3, // vertical angle
    radius: 30, // distance
    target: new THREE.Vector3(0, 0, 0),
  });

  // Touch tracking
  const touchState = useRef({
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    isMultiTouch: false,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          touchState.current.lastX = touches[0].pageX;
          touchState.current.lastY = touches[0].pageY;
          touchState.current.isMultiTouch = false;
        } else if (touches.length === 2) {
          touchState.current.isMultiTouch = true;
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          touchState.current.lastDist = Math.sqrt(dx * dx + dy * dy);
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        const orbit = cameraOrbit.current;

        if (touches.length === 2) {
          // Pinch to zoom
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const delta = dist - touchState.current.lastDist;
          orbit.radius = clamp(orbit.radius - delta * 0.1, 5, 200);
          touchState.current.lastDist = dist;
        } else if (touches.length === 1 && !touchState.current.isMultiTouch) {
          // Single finger to rotate
          const dx = touches[0].pageX - touchState.current.lastX;
          const dy = touches[0].pageY - touchState.current.lastY;
          orbit.theta -= dx * 0.01;
          orbit.phi = clamp(orbit.phi - dy * 0.01, 0.1, Math.PI - 0.1);
          touchState.current.lastX = touches[0].pageX;
          touchState.current.lastY = touches[0].pageY;
        }

        updateCameraPosition();
      },

      onPanResponderRelease: () => {
        touchState.current.isMultiTouch = false;
      },
    }),
  ).current;

  function updateCameraPosition() {
    const camera = cameraRef.current;
    if (!camera) return;

    const { theta, phi, radius, target } = cameraOrbit.current;
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.cos(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(target);
  }

  function signalToColor(rssi: number): THREE.Color {
    // Green (strong) → Yellow (medium) → Red (weak)
    const t = clamp(
      (rssi - SIGNAL_WEAK_THRESHOLD) /
        (SIGNAL_STRONG_THRESHOLD - SIGNAL_WEAK_THRESHOLD),
      0,
      1,
    );
    const color = new THREE.Color();
    color.setHSL(t * 0.33, 1, 0.5); // Hue: 0 (red) to 0.33 (green)
    return color;
  }

  const updatePointCloud = useCallback(() => {
    const geometry = pointsGeomRef.current;
    if (!geometry || points.length === lastPointCountRef.current) return;

    const count = Math.min(points.length, maxPoints);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const p = points[i];
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.z; // Swap Y/Z for Three.js coordinate system
      positions[i * 3 + 2] = p.position.y;

      const color = signalToColor(p.signalStrength);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, count);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeBoundingSphere();

    lastPointCountRef.current = points.length;
  }, [points, maxPoints]);

  const updatePositionMarker = useCallback(() => {
    const marker = positionMarkerRef.current;
    if (!marker || !currentPosition) return;

    marker.position.set(
      currentPosition.x,
      currentPosition.z, // Y/Z swap
      currentPosition.y,
    );
    marker.visible = true;
  }, [currentPosition]);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      // Renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor(COLORS.background);
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      cameraRef.current = camera;
      updateCameraPosition();

      // Grid helper
      const gridHelper = new THREE.GridHelper(50, 50, 0x333366, 0x222244);
      scene.add(gridHelper);

      // Axes helper
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // Point cloud
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(maxPoints * 3);
      const colors = new Float32Array(maxPoints * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setDrawRange(0, 0);
      pointsGeomRef.current = geometry;

      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        sizeAttenuation: true,
      });

      const pointCloud = new THREE.Points(geometry, material);
      scene.add(pointCloud);

      // Current position marker (pulsing sphere)
      const markerGeom = new THREE.SphereGeometry(0.3, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: COLORS.accent,
        transparent: true,
        opacity: 0.8,
      });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.visible = false;
      scene.add(marker);
      positionMarkerRef.current = marker;

      // Ambient light
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      // Render loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);

        // Pulse the position marker
        if (marker.visible) {
          const scale = 1 + 0.2 * Math.sin(Date.now() * 0.005);
          marker.scale.set(scale, scale, scale);
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    },
    [maxPoints],
  );

  // Update point cloud when points change
  useEffect(() => {
    updatePointCloud();
  }, [updatePointCloud]);

  // Update position marker when position changes
  useEffect(() => {
    updatePositionMarker();
  }, [updatePositionMarker]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glView: {
    flex: 1,
  },
});
