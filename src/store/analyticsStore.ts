import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTransactionStore } from './transactionStore';

export interface ExpensePattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastAmount: number;
  prediction: number;
}

export interface SmartCategory {
  description: string;
  suggestedCategory: string;
  confidence: number;
  pattern: string;
}

interface AnalyticsState {
  expensePatterns: ExpensePattern[];
  smartCategories: SmartCategory[];
  lastAnalysisDate: string | null;
  
  // Actions
  analyzeExpensePatterns: () => void;
  generateSmartCategories: () => void;
  getSuggestedCategory: (description: string, amount: number) => string | null;
  getSpendingTrends: (timeframe: 'week' | 'month' | 'quarter') => any;
  getCategoryInsights: (category: string) => any;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      expensePatterns: [],
      smartCategories: [],
      lastAnalysisDate: null,
      
      analyzeExpensePatterns: () => {
        const transactionStore = useTransactionStore.getState();
        const transactions = transactionStore.transactions.filter(t => 
          t.type === 'expense' && !t.isTransfer && !t.isBalanceAdjustment
        );
        
        // Group by category
        const categoryGroups = transactions.reduce((acc, transaction) => {
          if (!acc[transaction.category]) {
            acc[transaction.category] = [];
          }
          acc[transaction.category].push(transaction);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Analyze patterns
        const patterns: ExpensePattern[] = Object.entries(categoryGroups).map(([category, txns]) => {
          const amounts = txns.map(t => t.amount);
          const averageAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
          const frequency = txns.length;
          
          // Calculate trend (simple: compare last 3 vs previous 3)
          const recent = amounts.slice(-3);
          const previous = amounts.slice(-6, -3);
          const recentAvg = recent.reduce((sum, amt) => sum + amt, 0) / recent.length;
          const previousAvg = previous.reduce((sum, amt) => sum + amt, 0) / previous.length;
          
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
          if (recentAvg > previousAvg * 1.1) trend = 'increasing';
          else if (recentAvg < previousAvg * 0.9) trend = 'decreasing';
          
          return {
            category,
            averageAmount,
            frequency,
            trend,
            lastAmount: amounts[amounts.length - 1] || 0,
            prediction: trend === 'increasing' ? averageAmount * 1.1 : 
                       trend === 'decreasing' ? averageAmount * 0.9 : averageAmount
          };
        });
        
        set({
          expensePatterns: patterns,
          lastAnalysisDate: new Date().toISOString()
        });
      },
      
      generateSmartCategories: () => {
        const transactionStore = useTransactionStore.getState();
        const transactions = transactionStore.transactions.filter(t => 
          !t.isTransfer && !t.isBalanceAdjustment
        );
        
        // Build smart category suggestions based on description patterns
        const categoryPatterns: SmartCategory[] = [];
        
        // Common patterns
        const patterns = [
          { keywords: ['gojek', 'grab', 'ojol', 'ojek'], category: 'Transportasi', confidence: 0.9 },
          { keywords: ['makan', 'nasi', 'ayam', 'sate', 'bakso', 'mie'], category: 'Makanan & Minuman', confidence: 0.8 },
          { keywords: ['bensin', 'pertamax', 'spbu'], category: 'Transportasi', confidence: 0.9 },
          { keywords: ['listrik', 'pln', 'token'], category: 'Tagihan', confidence: 0.9 },
          { keywords: ['pulsa', 'paket', 'internet'], category: 'Tagihan', confidence: 0.8 },
          { keywords: ['shopee', 'tokopedia', 'lazada', 'blibli'], category: 'Belanja', confidence: 0.8 },
          { keywords: ['netflix', 'spotify', 'youtube'], category: 'Hiburan', confidence: 0.9 },
          { keywords: ['dokter', 'rumah sakit', 'obat', 'apotek'], category: 'Kesehatan', confidence: 0.9 },
          { keywords: ['sekolah', 'kuliah', 'kursus', 'buku'], category: 'Pendidikan', confidence: 0.8 },
        ];
        
        patterns.forEach(pattern => {
          categoryPatterns.push({
            description: pattern.keywords.join(', '),
            suggestedCategory: pattern.category,
            confidence: pattern.confidence,
            pattern: pattern.keywords.join('|')
          });
        });
        
        set({ smartCategories: categoryPatterns });
      },
      
      getSuggestedCategory: (description: string, amount: number) => {
        const { smartCategories } = get();
        const lowerDesc = description.toLowerCase();
        
        // Find matching pattern
        for (const smartCat of smartCategories) {
          const keywords = smartCat.pattern.split('|');
          for (const keyword of keywords) {
            if (lowerDesc.includes(keyword.toLowerCase())) {
              return smartCat.suggestedCategory;
            }
          }
        }
        
        // Amount-based suggestions
        if (amount < 50000) {
          if (lowerDesc.includes('makan') || lowerDesc.includes('jajan')) {
            return 'Makanan & Minuman';
          }
        } else if (amount > 500000) {
          return 'Belanja';
        }
        
        return null;
      },
      
      getSpendingTrends: (timeframe) => {
        const transactionStore = useTransactionStore.getState();
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        const transactions = transactionStore.transactions.filter(t => 
          new Date(t.date) >= startDate && 
          t.type === 'expense' && 
          !t.isTransfer && 
          !t.isBalanceAdjustment
        );
        
        const dailySpending = transactions.reduce((acc, t) => {
          const date = t.date;
          acc[date] = (acc[date] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          dailySpending,
          totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
          averageDaily: Object.values(dailySpending).reduce((sum, amt) => sum + amt, 0) / Object.keys(dailySpending).length || 0,
          transactionCount: transactions.length
        };
      },
      
      getCategoryInsights: (category) => {
        const { expensePatterns } = get();
        return expensePatterns.find(p => p.category === category);
      },
    }),
    {
      name: 'analytics-storage',
    }
  )
);