import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'ewallet' | 'custom';
  balance: number;
  color: string;
  icon: string;
}

interface WalletState {
  wallets: Wallet[];
  activeWallet: string | null;
  isLoading: boolean;
  error: string | null;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<string | null>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<boolean>;
  deleteWallet: (id: string) => Promise<boolean>;
  resetWalletBalance: (id: string) => Promise<boolean>;
  setActiveWallet: (id: string) => void;
  getTotalBalance: () => number;
  getWalletById: (id: string) => Wallet | undefined;
  fetchWallets: () => Promise<void>;
  initializeDefaultWallets: () => Promise<void>;
}

const defaultWalletTemplates = [
  { name: 'BCA', type: 'bank' as const, balance: 0, color: '#0066CC', icon: '🏦' },
  { name: 'Blu+ BCA', type: 'bank' as const, balance: 0, color: '#00AAFF', icon: '💙' },
  { name: 'Dana', type: 'ewallet' as const, balance: 0, color: '#118EEA', icon: '💰' },
  { name: 'ShopeePay', type: 'ewallet' as const, balance: 0, color: '#EE4D2D', icon: '🛒' },
  { name: 'GoPay', type: 'ewallet' as const, balance: 0, color: '#00AA13', icon: '🟢' },
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      activeWallet: null,
      isLoading: false,
      error: null,
      
      fetchWallets: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            throw error;
          }
          
          // Transform data to match our interface
          const wallets: Wallet[] = data.map(wallet => ({
            id: wallet.id,
            userId: wallet.user_id,
            name: wallet.name,
            type: wallet.type as 'bank' | 'ewallet' | 'custom',
            balance: wallet.balance,
            color: wallet.color,
            icon: wallet.icon,
          }));
          
          set({ 
            wallets,
            activeWallet: wallets.length > 0 ? wallets[0].id : null,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Error fetching wallets:', error.message);
          set({ error: error.message, isLoading: false });
        }
      },
      
      addWallet: async (wallet) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return null;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('wallets')
            .insert([
              {
                user_id: currentUser.id,
                name: wallet.name,
                type: wallet.type,
                balance: wallet.balance,
                color: wallet.color,
                icon: wallet.icon,
                created_at: new Date().toISOString(),
              }
            ])
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          const newWallet: Wallet = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            type: data.type as 'bank' | 'ewallet' | 'custom',
            balance: data.balance,
            color: data.color,
            icon: data.icon,
          };
          
          set(state => ({
            wallets: [newWallet, ...state.wallets],
            activeWallet: state.activeWallet || newWallet.id,
            isLoading: false
          }));
          
          return newWallet.id;
        } catch (error: any) {
          console.error('Error adding wallet:', error.message);
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      updateWallet: async (id, updates) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('wallets')
            .update({
              name: updates.name,
              type: updates.type,
              balance: updates.balance,
              color: updates.color,
              icon: updates.icon,
            })
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            wallets: state.wallets.map(w => 
              w.id === id ? { ...w, ...updates } : w
            ),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error updating wallet:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      deleteWallet: async (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('wallets')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => {
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
              isLoading: false
            };
          });
          
          return true;
        } catch (error: any) {
          console.error('Error deleting wallet:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      resetWalletBalance: async (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('wallets')
            .update({ balance: 0 })
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            wallets: state.wallets.map(w => 
              w.id === id ? { ...w, balance: 0 } : w
            ),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error resetting wallet balance:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      setActiveWallet: (id) => {
        const { wallets } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
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
      
      initializeDefaultWallets: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set({ isLoading: true, error: null });
        
        try {
          // Check if user already has wallets
          const { data: existingWallets, error: checkError } = await supabase
            .from('wallets')
            .select('id')
            .eq('user_id', currentUser.id);
            
          if (checkError) {
            throw checkError;
          }
          
          if (existingWallets.length > 0) {
            // User already has wallets, no need to create defaults
            set({ isLoading: false });
            return;
          }
          
          // Create default wallets for new user
          const walletsToInsert = defaultWalletTemplates.map(template => ({
            user_id: currentUser.id,
            name: template.name,
            type: template.type,
            balance: template.balance,
            color: template.color,
            icon: template.icon,
            created_at: new Date().toISOString(),
          }));
          
          const { data, error } = await supabase
            .from('wallets')
            .insert(walletsToInsert)
            .select();
            
          if (error) {
            throw error;
          }
          
          // Transform data to match our interface
          const newWallets: Wallet[] = data.map(wallet => ({
            id: wallet.id,
            userId: wallet.user_id,
            name: wallet.name,
            type: wallet.type as 'bank' | 'ewallet' | 'custom',
            balance: wallet.balance,
            color: wallet.color,
            icon: wallet.icon,
          }));
          
          set(state => ({
            wallets: [...state.wallets, ...newWallets],
            activeWallet: newWallets.length > 0 ? newWallets[0].id : state.activeWallet,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error initializing default wallets:', error.message);
          set({ error: error.message, isLoading: false });
        }
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);