import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vector3D, MapPoint, SavedMap, KnownAccessPoint } from '../types';
import { generateId } from '../utils/math';

interface MapState {
  // Current mapping session
  currentPoints: MapPoint[];
  currentPosition: Vector3D | null;
  confidence: number;
  isMapping: boolean;
  stepCount: number;
  heading: number;

  // Saved data
  savedMaps: SavedMap[];
  knownAPs: KnownAccessPoint[];

  // Actions - current session
  addPoint: (point: MapPoint) => void;
  updatePosition: (position: Vector3D, confidence: number) => void;
  setMapping: (mapping: boolean) => void;
  updateStats: (stepCount: number, heading: number) => void;
  clearCurrentPoints: () => void;

  // Actions - saved maps
  saveMap: (map: SavedMap) => void;
  deleteMap: (id: string) => void;
  loadMapPoints: (id: string) => MapPoint[];

  // Actions - known APs
  addKnownAP: (ap: KnownAccessPoint) => void;
  removeKnownAP: (bssid: string) => void;
  updateKnownAP: (bssid: string, updates: Partial<KnownAccessPoint>) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      currentPoints: [],
      currentPosition: null,
      confidence: 0,
      isMapping: false,
      stepCount: 0,
      heading: 0,
      savedMaps: [],
      knownAPs: [],

      addPoint: (point) =>
        set((state) => ({
          currentPoints: [...state.currentPoints, point],
        })),

      updatePosition: (position, confidence) =>
        set({ currentPosition: position, confidence }),

      setMapping: (mapping) => set({ isMapping: mapping }),

      updateStats: (stepCount, heading) => set({ stepCount, heading }),

      clearCurrentPoints: () =>
        set({ currentPoints: [], currentPosition: null, confidence: 0 }),

      saveMap: (map) =>
        set((state) => ({
          savedMaps: [map, ...state.savedMaps],
        })),

      deleteMap: (id) =>
        set((state) => ({
          savedMaps: state.savedMaps.filter((m) => m.id !== id),
        })),

      loadMapPoints: (id) => {
        const map = get().savedMaps.find((m) => m.id === id);
        return map?.points ?? [];
      },

      addKnownAP: (ap) =>
        set((state) => ({
          knownAPs: [
            ...state.knownAPs.filter(
              (existing) => existing.bssid !== ap.bssid,
            ),
            ap,
          ],
        })),

      removeKnownAP: (bssid) =>
        set((state) => ({
          knownAPs: state.knownAPs.filter((ap) => ap.bssid !== bssid),
        })),

      updateKnownAP: (bssid, updates) =>
        set((state) => ({
          knownAPs: state.knownAPs.map((ap) =>
            ap.bssid === bssid ? { ...ap, ...updates } : ap,
          ),
        })),
    }),
    {
      name: 'wifi-mapper-maps',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedMaps: state.savedMaps,
        knownAPs: state.knownAPs,
      }),
    },
  ),
);
