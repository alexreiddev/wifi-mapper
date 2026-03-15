import { Platform, PermissionsAndroid } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { AccessPoint } from '../types';
import { DistanceCalculator } from '../core/distance-calculator';
import {
  ANDROID_SCAN_LIMIT,
  ANDROID_SCAN_WINDOW_MS,
  WIFI_SCAN_INTERVAL_MS,
} from '../utils/constants';

/**
 * WiFi Scanner service wrapping react-native-wifi-reborn.
 * Handles Android scan throttle (4 scans per 2 minutes)
 * and permission management.
 */
export class WifiScannerService {
  private scanTimestamps: number[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private distanceCalc: DistanceCalculator;
  private onScanCallbacks: Array<(aps: AccessPoint[]) => void> = [];

  constructor(distanceCalc?: DistanceCalculator) {
    this.distanceCalc = distanceCalc ?? new DistanceCalculator();
  }

  /**
   * Request required permissions for WiFi scanning.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true; // iOS permissions handled via Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'WiFi Mapper Location Permission',
          message:
            'WiFi Mapper needs access to your location to scan nearby WiFi networks for spatial mapping.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  /**
   * Check if we can perform a scan without exceeding Android throttle.
   */
  private canScan(): boolean {
    if (Platform.OS !== 'android') return true;

    const now = Date.now();
    // Remove timestamps outside the 2-minute window
    this.scanTimestamps = this.scanTimestamps.filter(
      (t) => now - t < ANDROID_SCAN_WINDOW_MS,
    );

    return this.scanTimestamps.length < ANDROID_SCAN_LIMIT;
  }

  /**
   * Perform a single WiFi scan.
   */
  async scan(): Promise<AccessPoint[]> {
    if (!this.canScan()) {
      console.warn('WiFi scan throttled: Android limit reached');
      return [];
    }

    try {
      this.scanTimestamps.push(Date.now());

      const wifiList = await WifiManager.loadWifiList();
      const now = Date.now();

      const accessPoints: AccessPoint[] = wifiList.map((wifi: any) => {
        const bssid = (wifi.BSSID || '').toLowerCase();
        const rssi = wifi.level ?? wifi.RSSI ?? -100;

        // Update distance calculator with new reading
        const estimatedDistance = this.distanceCalc.addReading(bssid, rssi);

        return {
          bssid,
          ssid: wifi.SSID || '<hidden>',
          rssi,
          frequency: wifi.frequency ?? 0,
          timestamp: now,
          estimatedDistance,
        };
      });

      // Sort by signal strength (strongest first)
      accessPoints.sort((a, b) => b.rssi - a.rssi);

      // Notify callbacks
      for (const cb of this.onScanCallbacks) {
        cb(accessPoints);
      }

      return accessPoints;
    } catch (error) {
      console.error('WiFi scan failed:', error);
      return [];
    }
  }

  /**
   * Start periodic scanning at the given interval.
   */
  startPeriodicScan(intervalMs: number = WIFI_SCAN_INTERVAL_MS): void {
    this.stopPeriodicScan();

    // Do an immediate scan
    this.scan();

    this.intervalHandle = setInterval(() => {
      this.scan();
    }, intervalMs);
  }

  /**
   * Stop periodic scanning.
   */
  stopPeriodicScan(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Subscribe to scan results.
   */
  onScan(callback: (aps: AccessPoint[]) => void): () => void {
    this.onScanCallbacks.push(callback);
    return () => {
      this.onScanCallbacks = this.onScanCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Get the number of remaining scans in the current throttle window.
   */
  getRemainingScans(): number {
    const now = Date.now();
    this.scanTimestamps = this.scanTimestamps.filter(
      (t) => now - t < ANDROID_SCAN_WINDOW_MS,
    );
    return Math.max(0, ANDROID_SCAN_LIMIT - this.scanTimestamps.length);
  }

  /**
   * Get time until next scan is allowed (0 if can scan now).
   */
  getTimeUntilNextScan(): number {
    if (this.canScan()) return 0;
    const oldest = this.scanTimestamps[0];
    return Math.max(0, ANDROID_SCAN_WINDOW_MS - (Date.now() - oldest));
  }

  getDistanceCalculator(): DistanceCalculator {
    return this.distanceCalc;
  }

  destroy(): void {
    this.stopPeriodicScan();
    this.onScanCallbacks = [];
  }
}
