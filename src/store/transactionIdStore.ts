import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TransactionCounter {
  year: number;
  month: number;
  counters: {
    CO: number; // Cash Out (Pengeluaran)
    CI: number; // Cash In (Pemasukan)
    AP: number; // Account Payable (Utang)
    AR: number; // Account Receivable (Piutang)
    TR: number; // Transfer
    BA: number; // Balance Adjustment
  };
}

interface TransactionIdState {
  counters: TransactionCounter[];
  
  // Actions
  generateTransactionId: (prefix: 'CO' | 'CI' | 'AP' | 'AR' | 'TR' | 'BA') => string;
  getCurrentCounter: (prefix: string) => number;
  resetMonthlyCounters: () => void;
  getTransactionsByPrefix: (prefix: string, year?: number, month?: number) => number;
}

export const useTransactionIdStore = create<TransactionIdState>()(
  persist(
    (set, get) => ({
      counters: [],
      
      generateTransactionId: (prefix) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        
        const { counters } = get();
        
        // Find or create counter for current month/year
        let currentCounter = counters.find(
          c => c.year === currentYear && c.month === currentMonth
        );
        
        if (!currentCounter) {
          // Create new counter for this month
          currentCounter = {
            year: currentYear,
            month: currentMonth,
            counters: {
              CO: 0,
              CI: 0,
              AP: 0,
              AR: 0,
              TR: 0,
              BA: 0
            }
          };
        }
        
        // Increment counter for this prefix
        currentCounter.counters[prefix] += 1;
        const sequence = currentCounter.counters[prefix];
        
        // Update state
        const updatedCounters = counters.filter(
          c => !(c.year === currentYear && c.month === currentMonth)
        );
        updatedCounters.push(currentCounter);
        
        set({ counters: updatedCounters });
        
        // Generate ID: PREFIX-YYMMXXXX
        const yearStr = currentYear.toString().slice(-2); // Last 2 digits
        const monthStr = currentMonth.toString().padStart(2, '0');
        const sequenceStr = sequence.toString().padStart(4, '0');
        
        return `${prefix}-${yearStr}${monthStr}${sequenceStr}`;
      },
      
      getCurrentCounter: (prefix) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const { counters } = get();
        const currentCounter = counters.find(
          c => c.year === currentYear && c.month === currentMonth
        );
        
        return currentCounter?.counters[prefix as keyof typeof currentCounter.counters] || 0;
      },
      
      resetMonthlyCounters: () => {
        // This will be called automatically when month changes
        // Remove old counters (keep only last 12 months)
        const now = new Date();
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        
        set((state) => ({
          counters: state.counters.filter(c => {
            const counterDate = new Date(c.year, c.month - 1, 1);
            return counterDate >= cutoffDate;
          })
        }));
      },
      
      getTransactionsByPrefix: (prefix, year, month) => {
        const { counters } = get();
        
        if (year && month) {
          const counter = counters.find(c => c.year === year && c.month === month);
          return counter?.counters[prefix as keyof typeof counter.counters] || 0;
        }
        
        // Return total for all time
        return counters.reduce((total, counter) => {
          return total + (counter.counters[prefix as keyof typeof counter.counters] || 0);
        }, 0);
      }
    }),
    {
      name: 'transaction-id-storage',
    }
  )
);

// Helper functions
export const transactionIdHelpers = {
  // Get prefix based on transaction type
  getPrefix: (type: 'income' | 'expense', isTransfer?: boolean, isDebtTransaction?: boolean, isBalanceAdjustment?: boolean, debtType?: 'debt' | 'credit'): 'CO' | 'CI' | 'AP' | 'AR' | 'TR' | 'BA' => {
    if (isBalanceAdjustment) return 'BA';
    if (isTransfer) return 'TR';
    if (isDebtTransaction) {
      if (debtType === 'debt') return 'AP'; // Account Payable
      if (debtType === 'credit') return 'AR'; // Account Receivable
    }
    return type === 'income' ? 'CI' : 'CO';
  },
  
  // Parse transaction ID
  parseTransactionId: (id: string) => {
    // Add null/undefined check
    if (!id || typeof id !== 'string') {
      return null;
    }
    
    const parts = id.split('-');
    if (parts.length !== 2) return null;
    
    const [prefix, numberPart] = parts;
    // Fix: numberPart should be 8 characters (YYMMXXXX), not 6
    if (numberPart.length !== 8) return null;
    
    const year = 2000 + parseInt(numberPart.slice(0, 2));
    const month = parseInt(numberPart.slice(2, 4));
    // Fix: sequence should be extracted from last 4 characters
    const sequence = parseInt(numberPart.slice(4, 8));
    
    return {
      prefix,
      year,
      month,
      sequence,
      fullYear: year
    };
  },
  
  // Get transaction type description
  getTypeDescription: (prefix: string): string => {
    switch (prefix) {
      case 'CO': return 'Cash Out (Pengeluaran)';
      case 'CI': return 'Cash In (Pemasukan)';
      case 'AP': return 'Account Payable (Utang)';
      case 'AR': return 'Account Receivable (Piutang)';
      case 'TR': return 'Transfer';
      case 'BA': return 'Balance Adjustment';
      default: return 'Unknown';
    }
  },
  
  // Validate transaction ID format
  isValidTransactionId: (id: string): boolean => {
    if (!id || typeof id !== 'string') {
      return false;
    }
    // Fix: pattern should match 8-digit number part (YYMMXXXX)
    const regex = /^(CO|CI|AP|AR|TR|BA)-\d{8}$/;
    return regex.test(id);
  }
};

// Auto cleanup old counters every day
setInterval(() => {
  useTransactionIdStore.getState().resetMonthlyCounters();
}, 24 * 60 * 60 * 1000);