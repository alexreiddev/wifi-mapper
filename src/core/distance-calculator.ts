import { DEFAULT_PATH_LOSS_EXPONENT, DEFAULT_TX_POWER, RSSI_SMOOTHING_WINDOW } from '../utils/constants';
import { median } from '../utils/math';

/**
 * Convert RSSI to distance using the log-distance path loss model.
 *
 *   d = 10 ^ ((txPower - rssi) / (10 * n))
 *
 * @param rssi       - Received signal strength in dBm (e.g. -55)
 * @param txPower    - RSSI measured at 1 meter (e.g. -40)
 * @param pathLossN  - Path loss exponent (2.0 free space, 2.7 typical indoor)
 * @returns distance in meters
 */
export function rssiToDistance(
  rssi: number,
  txPower: number = DEFAULT_TX_POWER,
  pathLossN: number = DEFAULT_PATH_LOSS_EXPONENT,
): number {
  if (rssi >= txPower) return 0.1; // Clamp to minimum 10cm
  return Math.pow(10, (txPower - rssi) / (10 * pathLossN));
}

/**
 * Manages a sliding window of RSSI readings per BSSID and returns
 * smoothed distance estimates using the median.
 */
export class DistanceCalculator {
  private rssiHistory: Map<string, number[]> = new Map();
  private windowSize: number;
  private txPower: number;
  private pathLossN: number;

  constructor(
    txPower: number = DEFAULT_TX_POWER,
    pathLossN: number = DEFAULT_PATH_LOSS_EXPONENT,
    windowSize: number = RSSI_SMOOTHING_WINDOW,
  ) {
    this.txPower = txPower;
    this.pathLossN = pathLossN;
    this.windowSize = windowSize;
  }

  /**
   * Add a new RSSI reading and return the smoothed distance estimate.
   */
  addReading(bssid: string, rssi: number): number {
    let history = this.rssiHistory.get(bssid);
    if (!history) {
      history = [];
      this.rssiHistory.set(bssid, history);
    }

    history.push(rssi);
    if (history.length > this.windowSize) {
      history.shift();
    }

    const smoothedRssi = median(history);
    return rssiToDistance(smoothedRssi, this.txPower, this.pathLossN);
  }

  /**
   * Get the smoothed distance for a BSSID without adding a new reading.
   */
  getDistance(bssid: string): number | null {
    const history = this.rssiHistory.get(bssid);
    if (!history || history.length === 0) return null;
    const smoothedRssi = median(history);
    return rssiToDistance(smoothedRssi, this.txPower, this.pathLossN);
  }

  /**
   * Get the smoothed distance for a specific AP with custom parameters.
   */
  getDistanceWithParams(
    bssid: string,
    txPower: number,
    pathLossN: number,
  ): number | null {
    const history = this.rssiHistory.get(bssid);
    if (!history || history.length === 0) return null;
    const smoothedRssi = median(history);
    return rssiToDistance(smoothedRssi, txPower, pathLossN);
  }

  updateParams(txPower: number, pathLossN: number): void {
    this.txPower = txPower;
    this.pathLossN = pathLossN;
  }

  clear(): void {
    this.rssiHistory.clear();
  }

  clearBssid(bssid: string): void {
    this.rssiHistory.delete(bssid);
  }
}
