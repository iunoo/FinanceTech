import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  walletId: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
}

interface RecurringTransactionState {
  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  getUpcomingTransactions: (days?: number) => RecurringTransaction[];
  getOverdueTransactions: () => RecurringTransaction[];
  markAsExecuted: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useRecurringTransactionStore = create<RecurringTransactionState>()(
  persist(
    (set, get) => ({
      recurringTransactions: [],
      
      addRecurringTransaction: (transaction) => {
        const newTransaction: RecurringTransaction = {
          ...transaction,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          recurringTransactions: [...state.recurringTransactions, newTransaction],
        }));
      },
      
      updateRecurringTransaction: (id, updates) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },
      
      deleteRecurringTransaction: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((t) => t.id !== id),
        }));
      },
      
      getUpcomingTransactions: (days = 7) => {
        const { recurringTransactions } = get();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);
        
        return recurringTransactions.filter((t) => {
          if (!t.isActive) return false;
          const dueDate = new Date(t.nextDueDate);
          return dueDate >= now && dueDate <= futureDate;
        }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
      },
      
      getOverdueTransactions: () => {
        const { recurringTransactions } = get();
        const now = new Date();
        
        return recurringTransactions.filter((t) => {
          if (!t.isActive) return false;
          const dueDate = new Date(t.nextDueDate);
          return dueDate < now;
        });
      },
      
      markAsExecuted: (id) => {
        const { recurringTransactions } = get();
        const transaction = recurringTransactions.find(t => t.id === id);
        if (!transaction) return;
        
        // Calculate next due date based on frequency
        const currentDue = new Date(transaction.nextDueDate);
        const nextDue = new Date(currentDue);
        
        switch (transaction.frequency) {
          case 'daily':
            nextDue.setDate(currentDue.getDate() + 1);
            break;
          case 'weekly':
            nextDue.setDate(currentDue.getDate() + 7);
            break;
          case 'monthly':
            nextDue.setMonth(currentDue.getMonth() + 1);
            break;
          case 'yearly':
            nextDue.setFullYear(currentDue.getFullYear() + 1);
            break;
        }
        
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((t) =>
            t.id === id ? { 
              ...t, 
              lastExecuted: new Date().toISOString(),
              nextDueDate: nextDue.toISOString()
            } : t
          ),
        }));
      },
      
      toggleActive: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((t) =>
            t.id === id ? { ...t, isActive: !t.isActive } : t
          ),
        }));
      },
    }),
    {
      name: 'recurring-transaction-storage',
    }
  )
);