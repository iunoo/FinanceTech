import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  walletId: string;
  createdAt: string;
  isTransfer?: boolean; // Mark transfer transactions to exclude from analysis
  isDebtTransaction?: boolean; // Mark debt-related transactions
  linkedDebtId?: string; // Link to debt record
  debtTransactionType?: 'create' | 'payment' | 'cancel'; // Type of debt transaction
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactionsByDebtId: (debtId: string) => void;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByCategory: (walletId?: string, excludeTransfers?: boolean) => Record<string, number>;
  getTotalIncome: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean) => number;
  getTotalExpenses: (startDate?: string, endDate?: string, walletId?: string, excludeTransfers?: boolean) => number;
  getTransactionsByWallet: (walletId: string) => Transaction[];
  getDebtTransactions: (debtId: string) => Transaction[];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (transaction) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newTransaction: Transaction = {
          ...transaction,
          id,
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
      
      deleteTransaction: (id) => {
        const { transactions } = get();
        const transaction = transactions.find(t => t.id === id);
        
        // If this is a debt transaction, we need to handle the debt side
        if (transaction?.isDebtTransaction && transaction.linkedDebtId) {
          // Import debt store to handle the debt side
          import('../store/debtStore.js').then(({ useDebtStore }) => {
            const debtStore = useDebtStore.getState();
            
            if (transaction.debtTransactionType === 'create') {
              // This is the original debt creation transaction
              // We need to cancel the entire debt
              const result = debtStore.cancelTransaction(transaction.linkedDebtId!);
              if (result.success) {
                // Also need to revert wallet balance
                import('../store/walletStore.js').then(({ useWalletStore }) => {
                  const walletStore = useWalletStore.getState();
                  const wallet = walletStore.getWalletById(transaction.walletId);
                  
                  if (wallet && result.canceledDebt) {
                    if (result.canceledDebt.type === 'debt') {
                      // Debt creation is being deleted, so remove the money that was added
                      walletStore.updateWallet(transaction.walletId, {
                        balance: wallet.balance - transaction.amount
                      });
                    } else {
                      // Credit creation is being deleted, so add back the money that was removed
                      walletStore.updateWallet(transaction.walletId, {
                        balance: wallet.balance + transaction.amount
                      });
                    }
                  }
                });
              }
            } else if (transaction.debtTransactionType === 'payment') {
              // This is a payment transaction
              // We need to reverse the payment in the debt record
              const debt = debtStore.debts.find(d => d.id === transaction.linkedDebtId);
              if (debt) {
                // Find the payment record that matches this transaction
                const paymentRecord = debt.paymentHistory.find(p => p.transactionId === transaction.id);
                if (paymentRecord) {
                  const result = debtStore.deletePaymentRecord(debt.id, paymentRecord.id);
                  if (result.success) {
                    // Revert wallet balance
                    import('../store/walletStore.js').then(({ useWalletStore }) => {
                      const walletStore = useWalletStore.getState();
                      const wallet = walletStore.getWalletById(transaction.walletId);
                      
                      if (wallet) {
                        if (debt.type === 'debt') {
                          // Payment deletion: add money back (since payment reduced balance)
                          walletStore.updateWallet(transaction.walletId, {
                            balance: wallet.balance + transaction.amount
                          });
                        } else {
                          // Receipt deletion: remove money (since receipt added balance)
                          walletStore.updateWallet(transaction.walletId, {
                            balance: wallet.balance - transaction.amount
                          });
                        }
                      }
                    });
                  }
                }
              }
            }
          });
        }
        
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
        return transactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
      },
      
      getTransactionsByCategory: (walletId, excludeTransfers = true) => {
        const { transactions } = get();
        let filteredTransactions = transactions;
        
        if (walletId) {
          filteredTransactions = filteredTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          filteredTransactions = filteredTransactions.filter(t => !t.isTransfer);
        }
        
        return filteredTransactions.reduce((acc, transaction) => {
          if (transaction.type === 'expense') {
            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
          }
          return acc;
        }, {} as Record<string, number>);
      },
      
      getTotalIncome: (startDate, endDate, walletId, excludeTransfers = true) => {
        const { transactions, getTransactionsByDateRange } = get();
        let relevantTransactions = startDate && endDate 
          ? getTransactionsByDateRange(startDate, endDate)
          : transactions;
        
        if (walletId) {
          relevantTransactions = relevantTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          relevantTransactions = relevantTransactions.filter(t => !t.isTransfer);
        }
        
        return relevantTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTotalExpenses: (startDate, endDate, walletId, excludeTransfers = true) => {
        const { transactions, getTransactionsByDateRange } = get();
        let relevantTransactions = startDate && endDate 
          ? getTransactionsByDateRange(startDate, endDate)
          : transactions;
        
        if (walletId) {
          relevantTransactions = relevantTransactions.filter(t => t.walletId === walletId);
        }
        
        if (excludeTransfers) {
          relevantTransactions = relevantTransactions.filter(t => !t.isTransfer);
        }
        
        return relevantTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTransactionsByWallet: (walletId) => {
        const { transactions } = get();
        return transactions.filter(t => t.walletId === walletId);
      },

      getDebtTransactions: (debtId) => {
        const { transactions } = get();
        return transactions.filter(t => t.linkedDebtId === debtId);
      },
    }),
    {
      name: 'transaction-storage',
    }
  )
);