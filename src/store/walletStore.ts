import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface Wallet {
  id: string;
  userId: string; // Add userId to associate wallets with users
  name: string;
  type: 'bank' | 'ewallet' | 'custom';
  balance: number;
  color: string;
  icon: string;
}

interface WalletState {
  wallets: Wallet[];
  activeWallet: string | null;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  resetWalletBalance: (id: string) => void;
  setActiveWallet: (id: string) => void;
  getTotalBalance: () => number;
  getWalletById: (id: string) => Wallet | undefined;
  initializeDefaultWallets: () => void; // New function to initialize default wallets for new users
}

const defaultWalletTemplates = [
  { name: 'BCA', type: 'bank' as const, balance: 0, color: '#0066CC', icon: '🏦' },
  { name: 'Blu+ BCA', type: 'bank' as const, balance: 0, color: '#00AAFF', icon: '💙' },
  { name: 'Dana', type: 'ewallet' as const, balance: 0, color: '#118EEA', icon: '💰' },
  { name: 'ShopeePay', type: 'ewallet' as const, balance: 0, color: '#EE4D2D', icon: '🛒' },
  { name: 'GoPay', type: 'ewallet' as const, balance: 0, color: '#00AA13', icon: '🟢' },
  { name: 'Sea Bank', type: 'bank' as const, balance: 0, color: '#00C851', icon: '🌊' },
  { name: 'Mandiri', type: 'bank' as const, balance: 0, color: '#FFD700', icon: '🏛️' },
  { name: 'BRI', type: 'bank' as const, balance: 0, color: '#003d82', icon: '🏢' },
  { name: 'BNI', type: 'bank' as const, balance: 0, color: '#ff6600', icon: '🏪' },
  { name: 'OVO', type: 'ewallet' as const, balance: 0, color: '#4c3494', icon: '🟣' },
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      activeWallet: null,
      
      addWallet: (wallet) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        const newWallet: Wallet = {
          ...wallet,
          id: Date.now().toString(),
          userId: currentUser.id,
        };
        
        set((state) => ({
          wallets: [...state.wallets, newWallet],
          activeWallet: state.activeWallet || newWallet.id, // Set as active if no active wallet
        }));
      },
      
      updateWallet: (id, updates) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id && w.userId === currentUser.id ? { ...w, ...updates } : w
          ),
        }));
      },
      
      deleteWallet: (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set((state) => {
          const userWallets = state.wallets.filter(w => w.userId === currentUser.id);
          const walletToDelete = userWallets.find(w => w.id === id);
          
          if (!walletToDelete) return state;
          
          const remainingWallets = state.wallets.filter(w => w.id !== id);
          const nextActiveWallet = state.activeWallet === id 
            ? userWallets.find(w => w.id !== id)?.id || null
            : state.activeWallet;
            
          return {
            wallets: remainingWallets,
            activeWallet: nextActiveWallet,
          };
        });
      },

      resetWalletBalance: (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id && w.userId === currentUser.id ? { ...w, balance: 0 } : w
          ),
        }));
      },
      
      setActiveWallet: (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        const { wallets } = get();
        const wallet = wallets.find(w => w.id === id && w.userId === currentUser.id);
        
        if (wallet) {
          set({ activeWallet: id });
        }
      },
      
      getTotalBalance: () => {
        const { wallets } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return 0;
        
        return wallets
          .filter(w => w.userId === currentUser.id)
          .reduce((total, wallet) => total + wallet.balance, 0);
      },
      
      getWalletById: (id) => {
        const { wallets } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return undefined;
        
        return wallets.find((w) => w.id === id && w.userId === currentUser.id);
      },
      
      initializeDefaultWallets: () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        // Check if user already has wallets
        const { wallets } = get();
        const userWallets = wallets.filter(w => w.userId === currentUser.id);
        
        if (userWallets.length > 0) return; // User already has wallets
        
        // Create default wallets for new user
        const newWallets = defaultWalletTemplates.map((template, index) => ({
          ...template,
          id: `${currentUser.id}-${Date.now()}-${index}`,
          userId: currentUser.id,
        }));
        
        set((state) => ({
          wallets: [...state.wallets, ...newWallets],
          activeWallet: newWallets[0]?.id || null,
        }));
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);