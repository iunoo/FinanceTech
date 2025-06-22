import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

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
  userId: string; // Add userId to associate debts with users
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
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'paymentHistory' | 'remainingAmount' | 'isPaid' | 'userId'>) => string;
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
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return '';
        
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newDebt: Debt = {
          ...debt,
          id,
          userId: currentUser.id,
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
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id && d.userId === currentUser.id ? { ...d, ...updates } : d
          ),
        }));
      },
      
      deleteDebt: (id) => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        const debt = debts.find(d => d.id === id && d.userId === currentUser.id);
        
        if (debt) {
          // Delete all related transactions when debt is deleted
          import('./transactionStore').then(({ useTransactionStore }) => {
            const transactionStore = useTransactionStore.getState();
            
            // Delete original transaction if exists - pass true to prevent recursion
            if (debt.originalTransactionId) {
              transactionStore.deleteTransaction(debt.originalTransactionId, true);
            }
            
            // Delete all payment transactions - pass true to prevent recursion
            debt.paymentHistory.forEach(payment => {
              if (payment.transactionId) {
                transactionStore.deleteTransaction(payment.transactionId, true);
              }
            });
          });
        }
        
        set((state) => ({
          debts: state.debts.filter((d) => !(d.id === id && d.userId === currentUser.id)),
        }));
      },

      makePayment: (id, amount, walletId, method, notes, transactionId) => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          return { success: false, message: 'User tidak terautentikasi' };
        }
        
        const debt = debts.find(d => d.id === id && d.userId === currentUser.id);
        
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
            if (d.id === id && d.userId === currentUser.id) {
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
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          return { success: false, message: 'User tidak terautentikasi' };
        }
        
        const debt = debts.find(d => d.id === id && d.userId === currentUser.id);
        
        if (!debt) {
          return { success: false, message: 'Utang/Piutang tidak ditemukan' };
        }

        if (debt.paymentHistory.length > 0) {
          return { success: false, message: 'Tidak dapat membatalkan transaksi yang sudah ada pembayaran. Hapus riwayat pembayaran terlebih dahulu.' };
        }

        // Delete related transactions - pass true to prevent recursion
        import('./transactionStore').then(({ useTransactionStore }) => {
          const transactionStore = useTransactionStore.getState();
          
          // Delete original transaction
          if (debt.originalTransactionId) {
            transactionStore.deleteTransaction(debt.originalTransactionId, true);
          }
        });

        // Revert wallet balance manually since we're bypassing transaction deletion logic
        import('./walletStore').then(({ useWalletStore }) => {
          const walletStore = useWalletStore.getState();
          const wallet = walletStore.getWalletById(debt.originalWalletId);
          
          if (wallet) {
            if (debt.type === 'debt') {
              // Debt creation is being canceled, so remove the money that was added
              walletStore.updateWallet(debt.originalWalletId, {
                balance: wallet.balance - debt.amount
              });
            } else {
              // Credit creation is being canceled, so add back the money that was removed
              walletStore.updateWallet(debt.originalWalletId, {
                balance: wallet.balance + debt.amount
              });
            }
          }
        });

        // Hapus debt dari store
        set((state) => ({
          debts: state.debts.filter((d) => !(d.id === id && d.userId === currentUser.id)),
        }));

        return { 
          success: true, 
          message: `🔄 Transaksi ${debt.type === 'debt' ? 'utang' : 'piutang'} dengan ${debt.name} berhasil dibatalkan`,
          canceledDebt: debt
        };
      },

      deletePaymentRecord: (debtId, paymentId) => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          return { success: false, message: 'User tidak terautentikasi' };
        }
        
        const debt = debts.find(d => d.id === debtId && d.userId === currentUser.id);
        
        if (!debt) {
          return { success: false, message: 'Utang/Piutang tidak ditemukan' };
        }

        const payment = debt.paymentHistory.find(p => p.id === paymentId);
        if (!payment) {
          return { success: false, message: 'Catatan pembayaran tidak ditemukan' };
        }

        // Delete related transaction if exists - pass true to prevent recursion
        if (payment.transactionId) {
          import('./transactionStore').then(({ useTransactionStore }) => {
            const transactionStore = useTransactionStore.getState();
            transactionStore.deleteTransaction(payment.transactionId, true);
          });
        }

        // Revert wallet balance manually
        import('./walletStore').then(({ useWalletStore }) => {
          const walletStore = useWalletStore.getState();
          const wallet = walletStore.getWalletById(payment.walletId);
          
          if (wallet) {
            if (debt.type === 'debt') {
              // Payment deletion: add money back (since payment reduced balance)
              walletStore.updateWallet(payment.walletId, {
                balance: wallet.balance + payment.amount
              });
            } else {
              // Receipt deletion: remove money (since receipt added balance)
              walletStore.updateWallet(payment.walletId, {
                balance: wallet.balance - payment.amount
              });
            }
          }
        });

        // Update debt dengan menghapus payment record dan mengembalikan sisa amount
        const newRemainingAmount = debt.remainingAmount + payment.amount;
        const newPaymentHistory = debt.paymentHistory.filter(p => p.id !== paymentId);

        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id === debtId && d.userId === currentUser.id) {
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
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return [];
        
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        return debts.filter((debt) => {
          if (debt.userId !== currentUser.id) return false;
          
          const dueDate = new Date(debt.dueDate);
          return !debt.isPaid && dueDate <= threeDaysFromNow && dueDate >= new Date();
        });
      },

      getDebtsByContact: (contactName) => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return [];
        
        return debts.filter(debt => 
          debt.userId === currentUser.id &&
          debt.name.toLowerCase().includes(contactName.toLowerCase())
        );
      },

      getTotalDebtAmount: () => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return 0;
        
        return debts
          .filter(d => d.userId === currentUser.id && d.type === 'debt' && !d.isPaid)
          .reduce((sum, d) => sum + d.remainingAmount, 0);
      },

      getTotalCreditAmount: () => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return 0;
        
        return debts
          .filter(d => d.userId === currentUser.id && d.type === 'credit' && !d.isPaid)
          .reduce((sum, d) => sum + d.remainingAmount, 0);
      },

      getDebtSummaryByName: () => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return {};
        
        const summary: Record<string, { totalDebt: number; totalCredit: number; count: number }> = {};
        
        debts
          .filter(debt => debt.userId === currentUser.id)
          .forEach(debt => {
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