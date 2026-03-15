// ─── Physical Constants ───────────────────────────────────────────

export const GRAVITY = 9.81;
export const SPEED_OF_LIGHT = 299792458; // m/s

// ─── WiFi Defaults ────────────────────────────────────────────────

export const DEFAULT_PATH_LOSS_EXPONENT = 2.7;
export const DEFAULT_TX_POWER = -40; // dBm at 1 meter
export const RSSI_SMOOTHING_WINDOW = 10;

// ─── Android WiFi Throttle ───────────────────────────────────────

export const ANDROID_SCAN_LIMIT = 4;
export const ANDROID_SCAN_WINDOW_MS = 120_000; // 2 minutes

// ─── Scan & IMU Intervals ────────────────────────────────────────

export const WIFI_SCAN_INTERVAL_MS = 10_000;
export const IMU_SAMPLE_INTERVAL_MS = 50; // 20 Hz

// ─── Dead Reckoning ──────────────────────────────────────────────

export const STEP_DETECTION_THRESHOLD = 11.5; // m/s^2
export const MIN_STEP_INTERVAL_MS = 300;
export const STEP_LENGTH_K = 0.5; // Weinberg constant
export const HEADING_COMPLEMENTARY_ALPHA = 0.98;

// ─── Kalman Filter ───────────────────────────────────────────────

export const KALMAN_PROCESS_NOISE = 0.1;
export const KALMAN_MEASUREMENT_NOISE = 5.0;

// ─── Point Cloud ─────────────────────────────────────────────────

export const MAX_POINT_CLOUD_POINTS = 10_000;
export const OCTREE_MAX_DEPTH = 6;
export const OCTREE_MAX_POINTS_PER_LEAF = 8;

// ─── Signal Thresholds ──────────────────────────────────────────

export const SIGNAL_STRONG_THRESHOLD = -50; // dBm
export const SIGNAL_MEDIUM_THRESHOLD = -65;
export const SIGNAL_WEAK_THRESHOLD = -80;

// ─── UI Colors ───────────────────────────────────────────────────

export const COLORS = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#0f3460',
  primary: '#e94560',
  primaryLight: '#ff6b81',
  accent: '#00d2ff',
  accentGreen: '#00e676',
  warning: '#ffab00',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#606070',
  signalStrong: '#00e676',
  signalMedium: '#ffab00',
  signalWeak: '#e94560',
  border: '#2a2a4e',
} as const;

// ─── Default Settings ────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  defaultPathLossExponent: DEFAULT_PATH_LOSS_EXPONENT,
  defaultTxPower: DEFAULT_TX_POWER,
  scanIntervalMs: WIFI_SCAN_INTERVAL_MS,
  imuSampleRateMs: IMU_SAMPLE_INTERVAL_MS,
  kalmanProcessNoise: KALMAN_PROCESS_NOISE,
  kalmanMeasurementNoise: KALMAN_MEASUREMENT_NOISE,
  pointCloudMaxPoints: MAX_POINT_CLOUD_POINTS,
  autoSaveEnabled: true,
  showDebugOverlay: false,
} as const;
