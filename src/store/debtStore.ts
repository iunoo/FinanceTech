import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  walletId: string;
  method: string;
  notes?: string;
  timestamp: string;
  transactionId?: string;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  amount: number;
  remainingAmount: number;
  dueDate: string;
  description: string;
  type: 'debt' | 'credit';
  isPaid: boolean;
  createdAt: string;
  originalWalletId: string;
  paymentHistory: PaymentRecord[];
  originalTransactionId?: string;
}

interface DebtState {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'paymentHistory' | 'remainingAmount' | 'isPaid' | 'userId'>) => Promise<string>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<boolean>;
  deleteDebt: (id: string) => Promise<boolean>;
  makePayment: (id: string, amount: number, walletId: string, method: string, notes?: string, transactionId?: string) => Promise<{ success: boolean; message: string }>;
  cancelTransaction: (id: string) => Promise<{ success: boolean; message: string; canceledDebt?: Debt }>;
  deletePaymentRecord: (debtId: string, paymentId: string) => Promise<{ success: boolean; message: string; deletedPayment?: PaymentRecord }>;
  getUpcomingDebts: () => Debt[];
  getDebtsByContact: (contactName: string) => Debt[];
  getTotalDebtAmount: () => number;
  getTotalCreditAmount: () => number;
  getDebtSummaryByName: () => Record<string, { totalDebt: number; totalCredit: number; count: number }>;
  fetchDebts: () => Promise<void>;
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set, get) => ({
      debts: [],
      isLoading: false,
      error: null,
      
      fetchDebts: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            throw error;
          }
          
          // Transform data to match our interface
          const debts: Debt[] = data.map(debt => ({
            id: debt.id,
            userId: debt.user_id,
            name: debt.name,
            amount: debt.amount,
            remainingAmount: debt.remaining_amount,
            dueDate: debt.due_date,
            description: debt.description,
            type: debt.type as 'debt' | 'credit',
            isPaid: debt.is_paid,
            createdAt: debt.created_at,
            originalWalletId: debt.original_wallet_id,
            originalTransactionId: debt.original_transaction_id,
            paymentHistory: debt.payment_history as PaymentRecord[],
          }));
          
          set({ debts, isLoading: false });
        } catch (error: any) {
          console.error('Error fetching debts:', error.message);
          set({ error: error.message, isLoading: false });
        }
      },
      
      addDebt: async (debt) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return '';
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('debts')
            .insert([
              {
                user_id: currentUser.id,
                name: debt.name,
                amount: debt.amount,
                remaining_amount: debt.amount,
                due_date: debt.dueDate,
                description: debt.description,
                type: debt.type,
                is_paid: false,
                created_at: new Date().toISOString(),
                original_wallet_id: debt.originalWalletId,
                original_transaction_id: debt.originalTransactionId,
                payment_history: [],
              }
            ])
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          const newDebt: Debt = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            amount: data.amount,
            remainingAmount: data.remaining_amount,
            dueDate: data.due_date,
            description: data.description,
            type: data.type as 'debt' | 'credit',
            isPaid: data.is_paid,
            createdAt: data.created_at,
            originalWalletId: data.original_wallet_id,
            originalTransactionId: data.original_transaction_id,
            paymentHistory: data.payment_history as PaymentRecord[],
          };
          
          set(state => ({
            debts: [newDebt, ...state.debts],
            isLoading: false
          }));
          
          return newDebt.id;
        } catch (error: any) {
          console.error('Error adding debt:', error.message);
          set({ error: error.message, isLoading: false });
          return '';
        }
      },
      
      updateDebt: async (id, updates) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          // Get current debt to merge with updates
          const currentDebt = get().debts.find(d => d.id === id && d.userId === currentUser.id);
          if (!currentDebt) {
            throw new Error('Debt not found');
          }
          
          const { error } = await supabase
            .from('debts')
            .update({
              name: updates.name !== undefined ? updates.name : currentDebt.name,
              amount: updates.amount !== undefined ? updates.amount : currentDebt.amount,
              remaining_amount: updates.remainingAmount !== undefined ? updates.remainingAmount : currentDebt.remainingAmount,
              due_date: updates.dueDate !== undefined ? updates.dueDate : currentDebt.dueDate,
              description: updates.description !== undefined ? updates.description : currentDebt.description,
              type: updates.type !== undefined ? updates.type : currentDebt.type,
              is_paid: updates.isPaid !== undefined ? updates.isPaid : currentDebt.isPaid,
              original_wallet_id: updates.originalWalletId !== undefined ? updates.originalWalletId : currentDebt.originalWalletId,
              original_transaction_id: updates.originalTransactionId !== undefined ? updates.originalTransactionId : currentDebt.originalTransactionId,
              payment_history: updates.paymentHistory !== undefined ? updates.paymentHistory : currentDebt.paymentHistory,
            })
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            debts: state.debts.map(d => 
              d.id === id && d.userId === currentUser.id ? { ...d, ...updates } : d
            ),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error updating debt:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      deleteDebt: async (id) => {
        const { debts } = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        const debt = debts.find(d => d.id === id && d.userId === currentUser.id);
        if (!debt) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Delete all related transactions
          const { deleteTransactionsByDebtId } = await import('./transactionStore');
          await deleteTransactionsByDebtId(id);
          
          set(state => ({
            debts: state.debts.filter(d => !(d.id === id && d.userId === currentUser.id)),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error deleting debt:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      makePayment: async (id, amount, walletId, method, notes, transactionId) => {
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

        set({ isLoading: true, error: null });
        
        try {
          // Create payment record
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

          // Calculate new remaining amount
          const newRemainingAmount = debt.remainingAmount - amount;
          const isNowPaid = newRemainingAmount === 0;
          
          // Update payment history
          const newPaymentHistory = [...debt.paymentHistory, paymentRecord];

          // Update debt in Supabase
          const { error } = await supabase
            .from('debts')
            .update({
              remaining_amount: newRemainingAmount,
              is_paid: isNowPaid,
              payment_history: newPaymentHistory,
            })
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Update local state
          set(state => ({
            debts: state.debts.map(d => {
              if (d.id === id && d.userId === currentUser.id) {
                return {
                  ...d,
                  remainingAmount: newRemainingAmount,
                  isPaid: isNowPaid,
                  paymentHistory: newPaymentHistory,
                };
              }
              return d;
            }),
            isLoading: false
          }));

          const statusMessage = isNowPaid 
            ? `🎉 ${debt.type === 'debt' ? 'Utang' : 'Piutang'} kepada ${debt.name} telah LUNAS!\n\n💰 Transaksi pembayaran telah tercatat di riwayat`
            : `✅ Pembayaran berhasil dicatat!\n\n💰 Sisa ${debt.type === 'debt' ? 'utang' : 'piutang'}: Rp ${newRemainingAmount.toLocaleString('id-ID')}\n📝 Transaksi tercatat di riwayat`;

          return { success: true, message: statusMessage };
        } catch (error: any) {
          console.error('Error making payment:', error.message);
          set({ error: error.message, isLoading: false });
          return { success: false, message: `Error: ${error.message}` };
        }
      },

      cancelTransaction: async (id) => {
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

        set({ isLoading: true, error: null });
        
        try {
          // Delete debt from Supabase
          const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Delete related transactions
          const { deleteTransactionsByDebtId } = await import('./transactionStore');
          await deleteTransactionsByDebtId(id);
          
          // Revert wallet balance
          const { getWalletById, updateWallet } = await import('./walletStore');
          const wallet = getWalletById(debt.originalWalletId);
          
          if (wallet) {
            if (debt.type === 'debt') {
              // Debt creation is being canceled, so remove the money that was added
              await updateWallet(debt.originalWalletId, {
                balance: wallet.balance - debt.amount
              });
            } else {
              // Credit creation is being canceled, so add back the money that was removed
              await updateWallet(debt.originalWalletId, {
                balance: wallet.balance + debt.amount
              });
            }
          }
          
          // Update local state
          set(state => ({
            debts: state.debts.filter(d => !(d.id === id && d.userId === currentUser.id)),
            isLoading: false
          }));

          return { 
            success: true, 
            message: `🔄 Transaksi ${debt.type === 'debt' ? 'utang' : 'piutang'} dengan ${debt.name} berhasil dibatalkan`,
            canceledDebt: debt
          };
        } catch (error: any) {
          console.error('Error canceling transaction:', error.message);
          set({ error: error.message, isLoading: false });
          return { success: false, message: `Error: ${error.message}` };
        }
      },

      deletePaymentRecord: async (debtId, paymentId) => {
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

        set({ isLoading: true, error: null });
        
        try {
          // Calculate new remaining amount
          const newRemainingAmount = debt.remainingAmount + payment.amount;
          const newPaymentHistory = debt.paymentHistory.filter(p => p.id !== paymentId);
          
          // Update debt in Supabase
          const { error } = await supabase
            .from('debts')
            .update({
              remaining_amount: newRemainingAmount,
              is_paid: false, // Since there's remaining amount now
              payment_history: newPaymentHistory,
            })
            .eq('id', debtId)
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Delete related transaction if exists
          if (payment.transactionId) {
            const { deleteTransaction } = await import('./transactionStore');
            await deleteTransaction(payment.transactionId, true);
          }
          
          // Revert wallet balance
          const { getWalletById, updateWallet } = await import('./walletStore');
          const wallet = getWalletById(payment.walletId);
          
          if (wallet) {
            if (debt.type === 'debt') {
              // Payment deletion: add money back (since payment reduced balance)
              await updateWallet(payment.walletId, {
                balance: wallet.balance + payment.amount
              });
            } else {
              // Receipt deletion: remove money (since receipt added balance)
              await updateWallet(payment.walletId, {
                balance: wallet.balance - payment.amount
              });
            }
          }
          
          // Update local state
          set(state => ({
            debts: state.debts.map(d => {
              if (d.id === debtId && d.userId === currentUser.id) {
                return {
                  ...d,
                  remainingAmount: newRemainingAmount,
                  isPaid: false,
                  paymentHistory: newPaymentHistory,
                };
              }
              return d;
            }),
            isLoading: false
          }));

          return { 
            success: true, 
            message: `🗑️ Catatan pembayaran sebesar Rp ${payment.amount.toLocaleString('id-ID')} berhasil dihapus`,
            deletedPayment: payment
          };
        } catch (error: any) {
          console.error('Error deleting payment record:', error.message);
          set({ error: error.message, isLoading: false });
          return { success: false, message: `Error: ${error.message}` };
        }
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