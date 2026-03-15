import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface SettingsState extends AppSettings {
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSetting: (key, value) => set({ [key]: value }),

      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'wifi-mapper-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
