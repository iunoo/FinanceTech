import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useTransactionIdStore, transactionIdHelpers } from './transactionIdStore';
import { useAuthStore } from './authStore';

export interface Transaction {
  id: string;
  transactionId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  walletId: string;
  createdAt: string;
  userId: string;
  isTransfer?: boolean;
  isDebtTransaction?: boolean;
  isBalanceAdjustment?: boolean;
  linkedDebtId?: string;
  debtTransactionType?: 'create' | 'payment' | 'cancel';
  debtType?: 'debt' | 'credit';
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transactionId' | 'userId'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string, isInternalCall?: boolean) => Promise<boolean>;
  deleteTransactionsByDebtId: (debtId: string) => Promise<boolean>;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByCategory: (walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => Record<string, number>;
  getTotalIncome: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => number;
  getTotalExpenses: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => number;
  getTransactionsByWallet: (walletId: string) => Transaction[];
  getDebtTransactions: (debtId: string) => Transaction[];
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionByTransactionId: (transactionId: string) => Transaction | undefined;
  fetchTransactions: () => Promise<void>;
  getTransactionStats: () => {
    totalTransactions: number;
    byPrefix: Record<string, number>;
    thisMonth: Record<string, number>;
  };
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,
      
      fetchTransactions: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            throw error;
          }
          
          // Transform data to match our interface
          const transactions: Transaction[] = data.map(tx => ({
            id: tx.id,
            transactionId: tx.transaction_id,
            userId: tx.user_id,
            type: tx.type as 'income' | 'expense',
            amount: tx.amount,
            category: tx.category,
            description: tx.description,
            date: tx.date,
            walletId: tx.wallet_id,
            createdAt: tx.created_at,
            isTransfer: tx.is_transfer,
            isDebtTransaction: tx.is_debt_transaction,
            isBalanceAdjustment: tx.is_balance_adjustment,
            linkedDebtId: tx.linked_debt_id,
            debtTransactionType: tx.debt_transaction_type as 'create' | 'payment' | 'cancel' | undefined,
            debtType: tx.debt_type as 'debt' | 'credit' | undefined,
          }));
          
          set({ transactions, isLoading: false });
        } catch (error: any) {
          console.error('Error fetching transactions:', error.message);
          set({ error: error.message, isLoading: false });
        }
      },
      
      addTransaction: async (transaction) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return '';
        
        set({ isLoading: true, error: null });
        
        try {
          // Generate transaction ID based on type
          const prefix = transactionIdHelpers.getPrefix(
            transaction.type,
            transaction.isTransfer,
            transaction.isDebtTransaction,
            transaction.isBalanceAdjustment,
            transaction.debtType
          );
          
          const transactionId = useTransactionIdStore.getState().generateTransactionId(prefix);
          
          // Insert transaction into Supabase
          const { data, error } = await supabase
            .from('transactions')
            .insert([
              {
                transaction_id: transactionId,
                user_id: currentUser.id,
                type: transaction.type,
                amount: transaction.amount,
                category: transaction.category,
                description: transaction.description,
                date: transaction.date,
                wallet_id: transaction.walletId,
                created_at: transaction.createdAt || new Date().toISOString(),
                is_transfer: transaction.isTransfer || false,
                is_debt_transaction: transaction.isDebtTransaction || false,
                is_balance_adjustment: transaction.isBalanceAdjustment || false,
                linked_debt_id: transaction.linkedDebtId || null,
                debt_transaction_type: transaction.debtTransactionType || null,
                debt_type: transaction.debtType || null,
              }
            ])
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          // Transform to our interface
          const newTransaction: Transaction = {
            id: data.id,
            transactionId: data.transaction_id,
            userId: data.user_id,
            type: data.type as 'income' | 'expense',
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date,
            walletId: data.wallet_id,
            createdAt: data.created_at,
            isTransfer: data.is_transfer,
            isDebtTransaction: data.is_debt_transaction,
            isBalanceAdjustment: data.is_balance_adjustment,
            linkedDebtId: data.linked_debt_id,
            debtTransactionType: data.debt_transaction_type as 'create' | 'payment' | 'cancel' | undefined,
            debtType: data.debt_type as 'debt' | 'credit' | undefined,
          };
          
          set(state => ({
            transactions: [newTransaction, ...state.transactions],
            isLoading: false
          }));
          
          // Update wallet balance
          if (!transaction.isDebtTransaction) {
            const { getWalletById, updateWallet } = await import('./walletStore');
            const wallet = getWalletById(transaction.walletId);
            
            if (wallet) {
              const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
              await updateWallet(transaction.walletId, { 
                balance: wallet.balance + balanceChange 
              });
            }
          }
          
          return newTransaction.id;
        } catch (error: any) {
          console.error('Error adding transaction:', error.message);
          set({ error: error.message, isLoading: false });
          return '';
        }
      },
      
      updateTransaction: async (id, updates) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('transactions')
            .update({
              type: updates.type,
              amount: updates.amount,
              category: updates.category,
              description: updates.description,
              date: updates.date,
              wallet_id: updates.walletId,
              created_at: updates.createdAt,
              is_transfer: updates.isTransfer,
              is_debt_transaction: updates.isDebtTransaction,
              is_balance_adjustment: updates.isBalanceAdjustment,
              linked_debt_id: updates.linkedDebtId,
              debt_transaction_type: updates.debtTransactionType,
              debt_type: updates.debtType,
            })
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            transactions: state.transactions.map(t => 
              t.id === id ? { ...t, ...updates } : t
            ),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error updating transaction:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      deleteTransaction: async (id, isInternalCall = false) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        const transaction = transactions.find(t => t.id === id && t.userId === currentUser.id);
        if (!transaction) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Only handle wallet balance reversion for regular transactions
          if (!transaction.isDebtTransaction && !transaction.isBalanceAdjustment && !isInternalCall) {
            const { getWalletById, updateWallet } = await import('./walletStore');
            const wallet = getWalletById(transaction.walletId);
            
            if (wallet) {
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              await updateWallet(transaction.walletId, { 
                balance: wallet.balance + balanceChange 
              });
            }
          }
          
          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error deleting transaction:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      deleteTransactionsByDebtId: async (debtId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('linked_debt_id', debtId)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            transactions: state.transactions.filter(t => t.linkedDebtId !== debtId),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error deleting transactions by debt ID:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      getTransactionsByDateRange: (startDate, endDate) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        return transactions.filter((t) => {
          // Filter by user ID
          if (t.userId !== currentUser?.id) return false;
          
          const transactionDate = new Date(t.date);
          return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
      },
      
      getTransactionsByCategory: (walletId, excludeTransfers = true, excludeAdjustments = true) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        let filteredTransactions = transactions.filter(t => t.userId === currentUser?.id);
        
        if (walletId) {
          filteredTransactions = filteredTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          filteredTransactions = filteredTransactions.filter(t => !t.isTransfer);
        }

        if (excludeAdjustments) {
          filteredTransactions = filteredTransactions.filter(t => !t.isBalanceAdjustment);
        }
        
        return filteredTransactions.reduce((acc, transaction) => {
          if (transaction.type === 'expense') {
            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
          }
          return acc;
        }, {} as Record<string, number>);
      },
      
      getTotalIncome: (startDate, endDate, walletId, excludeTransfers = true, excludeAdjustments = true) => {
        const { transactions, getTransactionsByDateRange } = get();
        const currentUser = useAuthStore.getState().user;
        
        let relevantTransactions = currentUser ? transactions.filter(t => t.userId === currentUser.id) : [];
        
        if (startDate && endDate) {
          relevantTransactions = getTransactionsByDateRange(startDate, endDate);
        }
        
        if (walletId) {
          relevantTransactions = relevantTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          relevantTransactions = relevantTransactions.filter(t => !t.isTransfer);
        }

        if (excludeAdjustments) {
          relevantTransactions = relevantTransactions.filter(t => !t.isBalanceAdjustment);
        }
        
        return relevantTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTotalExpenses: (startDate, endDate, walletId, excludeTransfers = true, excludeAdjustments = true) => {
        const { transactions, getTransactionsByDateRange } = get();
        const currentUser = useAuthStore.getState().user;
        
        let relevantTransactions = currentUser ? transactions.filter(t => t.userId === currentUser.id) : [];
        
        if (startDate && endDate) {
          relevantTransactions = getTransactionsByDateRange(startDate, endDate);
        }
        
        if (walletId) {
          relevantTransactions = relevantTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          relevantTransactions = relevantTransactions.filter(t => !t.isTransfer);
        }

        if (excludeAdjustments) {
          relevantTransactions = relevantTransactions.filter(t => !t.isBalanceAdjustment);
        }
        
        return relevantTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTransactionsByWallet: (walletId) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        return transactions.filter(t => 
          t.walletId === walletId && 
          t.userId === currentUser?.id
        );
      },

      getDebtTransactions: (debtId) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        return transactions.filter(t => 
          t.linkedDebtId === debtId && 
          t.userId === currentUser?.id
        );
      },
      
      getTransactionById: (id) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        return transactions.find(t => 
          t.id === id && 
          t.userId === currentUser?.id
        );
      },
      
      getTransactionByTransactionId: (transactionId) => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        return transactions.find(t => 
          t.transactionId === transactionId && 
          t.userId === currentUser?.id
        );
      },
      
      getTransactionStats: () => {
        const { transactions } = get();
        const currentUser = useAuthStore.getState().user;
        
        // Filter transactions by current user
        const userTransactions = currentUser 
          ? transactions.filter(t => t.userId === currentUser.id)
          : [];
          
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Count by prefix
        const byPrefix: Record<string, number> = {};
        const thisMonth: Record<string, number> = {};
        
        userTransactions.forEach(transaction => {
          const parsed = transactionIdHelpers.parseTransactionId(transaction.transactionId);
          if (parsed) {
            byPrefix[parsed.prefix] = (byPrefix[parsed.prefix] || 0) + 1;
            
            if (parsed.year === currentYear && parsed.month === currentMonth) {
              thisMonth[parsed.prefix] = (thisMonth[parsed.prefix] || 0) + 1;
            }
          }
        });
        
        return {
          totalTransactions: userTransactions.length,
          byPrefix,
          thisMonth
        };
      }
    }),
    {
      name: 'transaction-storage',
    }
  )
);