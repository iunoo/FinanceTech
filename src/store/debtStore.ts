import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  walletId: string;
  method: string;
  notes?: string;
  timestamp: string;
  transactionId?: string; // Link to transaction record
}

export interface Debt {
  id: string;
  name: string; // Nama orang
  amount: number; // Jumlah awal
  remainingAmount: number; // Sisa yang belum dibayar
  dueDate: string;
  description: string;
  type: 'debt' | 'credit'; // debt = saya berutang, credit = saya memberi pinjaman
  isPaid: boolean;
  createdAt: string;
  originalWalletId: string; // Dompet yang digunakan saat transaksi awal
  paymentHistory: PaymentRecord[]; // Riwayat pembayaran parsial
  originalTransactionId?: string; // Link to original transaction
}

interface DebtState {
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'paymentHistory' | 'remainingAmount' | 'isPaid'>) => string;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  makePayment: (id: string, amount: number, walletId: string, method: string, notes?: string, transactionId?: string) => { success: boolean; message: string };
  cancelTransaction: (id: string) => { success: boolean; message: string; canceledDebt?: Debt };
  deletePaymentRecord: (debtId: string, paymentId: string) => { success: boolean; message: string; deletedPayment?: PaymentRecord };
  getUpcomingDebts: () => Debt[];
  getDebtsByContact: (contactName: string) => Debt[];
  getTotalDebtAmount: () => number;
  getTotalCreditAmount: () => number;
  getDebtSummaryByName: () => Record<string, { totalDebt: number; totalCredit: number; count: number }>;
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set, get) => ({
      debts: [],
      
      addDebt: (debt) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newDebt: Debt = {
          ...debt,
          id,
          createdAt: new Date().toISOString(),
          paymentHistory: [],
          remainingAmount: debt.amount,
          isPaid: false,
        };
        set((state) => ({
          debts: [newDebt, ...state.debts],
        }));
        return id;
      },
      
      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },
      
      deleteDebt: (id) => {
        const { debts } = get();
        const debt = debts.find(d => d.id === id);
        
        if (debt) {
          // Also delete related transactions
          import('../store/transactionStore.js').then(({ useTransactionStore }) => {
            const transactionStore = useTransactionStore.getState();
            transactionStore.deleteTransactionsByDebtId(id);
          });
        }
        
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }));
      },

      makePayment: (id, amount, walletId, method, notes, transactionId) => {
        const { debts } = get();
        const debt = debts.find(d => d.id === id);
        
        if (!debt) {
          return { success: false, message: 'Utang/Piutang tidak ditemukan' };
        }

        if (debt.isPaid) {
          return { success: false, message: 'Utang/Piutang ini sudah lunas' };
        }

        if (amount <= 0) {
          return { success: false, message: 'Jumlah pembayaran harus lebih dari 0' };
        }

        if (amount > debt.remainingAmount) {
          return { success: false, message: `Pembayaran tidak boleh melebihi sisa kewajiban!\n\nSisa kewajiban: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\nJumlah yang dimasukkan: Rp ${amount.toLocaleString('id-ID')}` };
        }

        // Buat record pembayaran
        const paymentRecord: PaymentRecord = {
          id: Date.now().toString(),
          amount,
          date: new Date().toISOString().split('T')[0],
          walletId,
          method,
          notes,
          timestamp: new Date().toISOString(),
          transactionId,
        };

        // Update debt
        const newRemainingAmount = debt.remainingAmount - amount;
        const isNowPaid = newRemainingAmount === 0;

        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id === id) {
              return {
                ...d,
                remainingAmount: newRemainingAmount,
                isPaid: isNowPaid,
                paymentHistory: [...d.paymentHistory, paymentRecord],
              };
            }
            return d;
          }),
        }));

        const statusMessage = isNowPaid 
          ? `🎉 ${debt.type === 'debt' ? 'Utang' : 'Piutang'} kepada ${debt.name} telah LUNAS!\n\n💰 Transaksi pembayaran telah tercatat di riwayat`
          : `✅ Pembayaran berhasil dicatat!\n\n💰 Sisa ${debt.type === 'debt' ? 'utang' : 'piutang'}: Rp ${newRemainingAmount.toLocaleString('id-ID')}\n📝 Transaksi tercatat di riwayat`;

        return { success: true, message: statusMessage };
      },

      cancelTransaction: (id) => {
        const { debts } = get();
        const debt = debts.find(d => d.id === id);
        
        if (!debt) {
          return { success: false, message: 'Utang/Piutang tidak ditemukan' };
        }

        if (debt.paymentHistory.length > 0) {
          return { success: false, message: 'Tidak dapat membatalkan transaksi yang sudah ada pembayaran. Hapus riwayat pembayaran terlebih dahulu.' };
        }

        // Delete related transactions
        import('../store/transactionStore.js').then(({ useTransactionStore }) => {
          const transactionStore = useTransactionStore.getState();
          transactionStore.deleteTransactionsByDebtId(id);
        });

        // Hapus debt dari store
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }));

        return { 
          success: true, 
          message: `🔄 Transaksi ${debt.type === 'debt' ? 'utang' : 'piutang'} dengan ${debt.name} berhasil dibatalkan`,
          canceledDebt: debt
        };
      },

      deletePaymentRecord: (debtId, paymentId) => {
        const { debts } = get();
        const debt = debts.find(d => d.id === debtId);
        
        if (!debt) {
          return { success: false, message: 'Utang/Piutang tidak ditemukan' };
        }

        const payment = debt.paymentHistory.find(p => p.id === paymentId);
        if (!payment) {
          return { success: false, message: 'Catatan pembayaran tidak ditemukan' };
        }

        // Delete related transaction if exists
        if (payment.transactionId) {
          import('../store/transactionStore.js').then(({ useTransactionStore }) => {
            const transactionStore = useTransactionStore.getState();
            transactionStore.deleteTransaction(payment.transactionId!);
          });
        }

        // Update debt dengan menghapus payment record dan mengembalikan sisa amount
        const newRemainingAmount = debt.remainingAmount + payment.amount;
        const newPaymentHistory = debt.paymentHistory.filter(p => p.id !== paymentId);

        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id === debtId) {
              return {
                ...d,
                remainingAmount: newRemainingAmount,
                isPaid: false, // Karena ada sisa lagi
                paymentHistory: newPaymentHistory,
              };
            }
            return d;
          }),
        }));

        return { 
          success: true, 
          message: `🗑️ Catatan pembayaran sebesar Rp ${payment.amount.toLocaleString('id-ID')} berhasil dihapus`,
          deletedPayment: payment
        };
      },
      
      getUpcomingDebts: () => {
        const { debts } = get();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        return debts.filter((debt) => {
          const dueDate = new Date(debt.dueDate);
          return !debt.isPaid && dueDate <= threeDaysFromNow && dueDate >= new Date();
        });
      },

      getDebtsByContact: (contactName) => {
        const { debts } = get();
        return debts.filter(debt => 
          debt.name.toLowerCase().includes(contactName.toLowerCase())
        );
      },

      getTotalDebtAmount: () => {
        const { debts } = get();
        return debts
          .filter(d => d.type === 'debt' && !d.isPaid)
          .reduce((sum, d) => sum + d.remainingAmount, 0);
      },

      getTotalCreditAmount: () => {
        const { debts } = get();
        return debts
          .filter(d => d.type === 'credit' && !d.isPaid)
          .reduce((sum, d) => sum + d.remainingAmount, 0);
      },

      getDebtSummaryByName: () => {
        const { debts } = get();
        const summary: Record<string, { totalDebt: number; totalCredit: number; count: number }> = {};
        
        debts.forEach(debt => {
          if (!summary[debt.name]) {
            summary[debt.name] = { totalDebt: 0, totalCredit: 0, count: 0 };
          }
          
          if (debt.type === 'debt' && !debt.isPaid) {
            summary[debt.name].totalDebt += debt.remainingAmount;
          } else if (debt.type === 'credit' && !debt.isPaid) {
            summary[debt.name].totalCredit += debt.remainingAmount;
          }
          
          summary[debt.name].count += 1;
        });
        
        return summary;
      },
    }),
    {
      name: 'debt-storage',
    }
  )
);