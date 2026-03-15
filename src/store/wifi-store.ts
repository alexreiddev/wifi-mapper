import { create } from 'zustand';
import { AccessPoint } from '../types';

interface WifiState {
  accessPoints: AccessPoint[];
  isScanning: boolean;
  lastScanTime: number;
  remainingScans: number;

  updateScanResults: (aps: AccessPoint[]) => void;
  setScanning: (scanning: boolean) => void;
  setRemainingScans: (count: number) => void;
  clear: () => void;
}

export const useWifiStore = create<WifiState>((set) => ({
  accessPoints: [],
  isScanning: false,
  lastScanTime: 0,
  remainingScans: 4,

  updateScanResults: (aps) =>
    set({
      accessPoints: aps,
      lastScanTime: Date.now(),
    }),

  setScanning: (scanning) => set({ isScanning: scanning }),

  setRemainingScans: (count) => set({ remainingScans: count }),

  clear: () =>
    set({
      accessPoints: [],
      lastScanTime: 0,
    }),
}));
