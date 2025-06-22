import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTransactionIdStore, transactionIdHelpers } from './transactionIdStore';
import { useAuthStore } from './authStore';

export interface Transaction {
  id: string;
  transactionId: string; // New: Human-readable transaction ID
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  walletId: string;
  createdAt: string;
  userId: string; // Add userId to associate transactions with users
  isTransfer?: boolean; // Mark transfer transactions to exclude from analysis
  isDebtTransaction?: boolean; // Mark debt-related transactions
  isBalanceAdjustment?: boolean; // Mark balance adjustment transactions to exclude from analysis
  linkedDebtId?: string; // Link to debt record
  debtTransactionType?: 'create' | 'payment' | 'cancel'; // Type of debt transaction
  debtType?: 'debt' | 'credit'; // For debt transactions
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transactionId' | 'userId'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string, isInternalCall?: boolean) => void;
  deleteTransactionsByDebtId: (debtId: string) => void;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByCategory: (walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => Record<string, number>;
  getTotalIncome: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => number;
  getTotalExpenses: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean, excludeAdjustments?: boolean) => number;
  getTransactionsByWallet: (walletId: string) => Transaction[];
  getDebtTransactions: (debtId: string) => Transaction[];
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionByTransactionId: (transactionId: string) => Transaction | undefined;
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
      
      addTransaction: (transaction) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        // Get current user ID
        const currentUser = useAuthStore.getState().user;
        const userId = currentUser?.id || 'unknown';
        
        // Generate transaction ID based on type
        const prefix = transactionIdHelpers.getPrefix(
          transaction.type,
          transaction.isTransfer,
          transaction.isDebtTransaction,
          transaction.isBalanceAdjustment,
          transaction.debtType
        );
        
        const transactionId = useTransactionIdStore.getState().generateTransactionId(prefix);
        
        const newTransaction: Transaction = {
          ...transaction,
          id,
          transactionId,
          userId, // Add userId to transaction
        };
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        
        return id;
      },
      
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },
      
      deleteTransaction: (id, isInternalCall = false) => {
        const { transactions } = get();
        const transaction = transactions.find(t => t.id === id);
        
        if (!transaction) {
          return;
        }
        
        // Only handle wallet balance reversion for regular transactions
        // Debt transactions are handled by the debt store
        // Balance adjustments should not revert wallet balance
        if (!transaction.isDebtTransaction && !transaction.isBalanceAdjustment && !isInternalCall) {
          // Regular transaction - revert wallet balance
          // Import wallet store dynamically to avoid circular dependency
          import('./walletStore').then(({ useWalletStore }) => {
            const walletStore = useWalletStore.getState();
            const wallet = walletStore.getWalletById(transaction.walletId);
            
            if (wallet) {
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              walletStore.updateWallet(transaction.walletId, { 
                balance: wallet.balance + balanceChange 
              });
            }
          });
        }
        
        // Remove transaction from store
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      deleteTransactionsByDebtId: (debtId) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.linkedDebtId !== debtId),
        }));
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
        return transactions.find(t => t.id === id);
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