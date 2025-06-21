import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'ewallet' | 'custom';
  balance: number;
  color: string;
  icon: string;
}

interface WalletState {
  wallets: Wallet[];
  activeWallet: string | null;
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  setActiveWallet: (id: string) => void;
  getTotalBalance: () => number;
  getWalletById: (id: string) => Wallet | undefined;
}

const defaultWallets: Wallet[] = [
  { id: '1', name: 'BCA', type: 'bank', balance: 0, color: '#0066CC', icon: '🏦' },
  { id: '2', name: 'Blu+ BCA', type: 'bank', balance: 0, color: '#00AAFF', icon: '💙' },
  { id: '3', name: 'Dana', type: 'ewallet', balance: 0, color: '#118EEA', icon: '💰' },
  { id: '4', name: 'ShopeePay', type: 'ewallet', balance: 0, color: '#EE4D2D', icon: '🛒' },
  { id: '5', name: 'GoPay', type: 'ewallet', balance: 0, color: '#00AA13', icon: '🟢' },
  { id: '6', name: 'Sea Bank', type: 'bank', balance: 0, color: '#00C851', icon: '🌊' },
  { id: '7', name: 'Mandiri', type: 'bank', balance: 0, color: '#FFD700', icon: '🏛️' },
  { id: '8', name: 'BRI', type: 'bank', balance: 0, color: '#003d82', icon: '🏢' },
  { id: '9', name: 'BNI', type: 'bank', balance: 0, color: '#ff6600', icon: '🏪' },
  { id: '10', name: 'OVO', type: 'ewallet', balance: 0, color: '#4c3494', icon: '🟣' },
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: defaultWallets,
      activeWallet: '1',
      
      addWallet: (wallet) => {
        const newWallet: Wallet = {
          ...wallet,
          id: Date.now().toString(),
        };
        set((state) => ({
          wallets: [...state.wallets, newWallet],
        }));
      },
      
      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },
      
      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          activeWallet: state.activeWallet === id ? state.wallets[0]?.id || null : state.activeWallet,
        }));
      },
      
      setActiveWallet: (id) => {
        set({ activeWallet: id });
      },
      
      getTotalBalance: () => {
        const { wallets } = get();
        return wallets.reduce((total, wallet) => total + wallet.balance, 0);
      },
      
      getWalletById: (id) => {
        const { wallets } = get();
        return wallets.find((w) => w.id === id);
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);