import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColorRange {
  min: number;
  max: number;
  color: string;
  label: string;
  icon?: string;
  glowEnabled?: boolean;
}

interface WalletColorState {
  colorRanges: ColorRange[];
  walletSettings: Record<string, ColorRange[]>; // Per wallet settings
  updateColorRanges: (ranges: ColorRange[]) => void;
  updateWalletColorRanges: (walletIds: string[], ranges: ColorRange[]) => void;
  getColorForBalance: (balance: number, walletId?: string) => string;
  getGlowSettings: (balance: number, walletId?: string) => { enabled: boolean; color: string };
}

const defaultColorRanges: ColorRange[] = [
  { min: -Infinity, max: 0, color: '#EF4444', label: 'Saldo Negatif', icon: 'x', glowEnabled: true },
  { min: 0, max: 100000, color: '#F59E0B', label: 'Saldo Rendah', icon: 'warning', glowEnabled: true },
  { min: 100001, max: 1000000, color: '#10B981', label: 'Saldo Normal', icon: 'check', glowEnabled: false },
  { min: 1000001, max: Infinity, color: '#3B82F6', label: 'Saldo Tinggi', icon: 'check', glowEnabled: true },
];

export const useWalletColorStore = create<WalletColorState>()(
  persist(
    (set, get) => ({
      colorRanges: defaultColorRanges,
      walletSettings: {},
      
      updateColorRanges: (ranges) => {
        set({ colorRanges: ranges });
      },
      
      updateWalletColorRanges: (walletIds, ranges) => {
        const { walletSettings } = get();
        const newWalletSettings = { ...walletSettings };
        
        walletIds.forEach(walletId => {
          newWalletSettings[walletId] = ranges;
        });
        
        set({ walletSettings: newWalletSettings });
      },
      
      getColorForBalance: (balance, walletId) => {
        const { colorRanges, walletSettings } = get();
        
        // Use wallet-specific settings if available, otherwise use global
        const ranges = walletId && walletSettings[walletId] ? walletSettings[walletId] : colorRanges;
        
        const range = ranges.find(r => balance >= r.min && balance <= r.max);
        return range?.color || '#6B7280';
      },

      getGlowSettings: (balance, walletId) => {
        const { colorRanges, walletSettings } = get();
        
        // Use wallet-specific settings if available, otherwise use global
        const ranges = walletId && walletSettings[walletId] ? walletSettings[walletId] : colorRanges;
        
        const range = ranges.find(r => balance >= r.min && balance <= r.max);
        return {
          enabled: range?.glowEnabled || false,
          color: range?.color || '#6B7280'
        };
      },
    }),
    {
      name: 'wallet-color-storage',
    }
  )
);