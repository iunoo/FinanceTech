// Dedicated service for debt-wallet linking logic
// This ensures debt and wallet operations stay in sync

import { useDebtStore } from '../store/debtStore';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';

export class DebtWalletService {
  private static instance: DebtWalletService;
  
  static getInstance(): DebtWalletService {
    if (!DebtWalletService.instance) {
      DebtWalletService.instance = new DebtWalletService();
    }
    return DebtWalletService.instance;
  }

  // Create debt with wallet transaction
  createDebtWithTransaction(debtData: any, walletId: string) {
    const debtStore = useDebtStore.getState();
    const transactionStore = useTransactionStore.getState();
    const walletStore = useWalletStore.getState();

    try {
      // 1. Create debt record
      const debtId = debtStore.addDebt({
        ...debtData,
        originalWalletId: walletId
      });

      // 2. Update wallet balance
      const wallet = walletStore.getWalletById(walletId);
      if (!wallet) throw new Error('Wallet not found');

      const balanceChange = debtData.type === 'debt' ? debtData.amount : -debtData.amount;
      walletStore.updateWallet(walletId, {
        balance: wallet.balance + balanceChange
      });

      // 3. Create linked transaction
      const transactionId = transactionStore.addTransaction({
        type: debtData.type === 'debt' ? 'income' : 'expense',
        amount: debtData.amount,
        category: debtData.type === 'debt' ? 'Utang Diterima' : 'Piutang Diberikan',
        description: `${debtData.type === 'debt' ? 'Utang dari' : 'Memberikan pinjaman ke'} ${debtData.name}`,
        date: new Date().toISOString().split('T')[0],
        walletId: walletId,
        createdAt: new Date().toISOString(),
        isDebtTransaction: true,
        linkedDebtId: debtId,
        debtTransactionType: 'create',
      });

      // 4. Link transaction to debt
      debtStore.updateDebt(debtId, { originalTransactionId: transactionId });

      return { success: true, debtId, transactionId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Make payment with wallet transaction
  makePaymentWithTransaction(debtId: string, amount: number, walletId: string, notes?: string) {
    const debtStore = useDebtStore.getState();
    const transactionStore = useTransactionStore.getState();
    const walletStore = useWalletStore.getState();

    try {
      const debt = debtStore.debts.find(d => d.id === debtId);
      if (!debt) throw new Error('Debt not found');

      const wallet = walletStore.getWalletById(walletId);
      if (!wallet) throw new Error('Wallet not found');

      // Validate payment amount
      if (amount > debt.remainingAmount) {
        throw new Error('Payment exceeds remaining amount');
      }

      // Check balance for debt payments
      if (debt.type === 'debt' && wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // 1. Update wallet balance
      const balanceChange = debt.type === 'debt' ? -amount : amount;
      walletStore.updateWallet(walletId, {
        balance: wallet.balance + balanceChange
      });

      // 2. Create payment transaction
      const transactionId = transactionStore.addTransaction({
        type: debt.type === 'debt' ? 'expense' : 'income',
        amount: amount,
        category: debt.type === 'debt' ? 'Pembayaran Utang' : 'Penerimaan Piutang',
        description: `${debt.type === 'debt' ? 'Bayar utang ke' : 'Terima piutang dari'} ${debt.name}${notes ? ` - ${notes}` : ''}`,
        date: new Date().toISOString().split('T')[0],
        walletId: walletId,
        createdAt: new Date().toISOString(),
        isDebtTransaction: true,
        linkedDebtId: debtId,
        debtTransactionType: 'payment',
      });

      // 3. Update debt record
      const result = debtStore.makePayment(debtId, amount, walletId, 'transfer', notes, transactionId);

      return { success: true, result, transactionId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cancel debt with wallet reversal
  cancelDebtWithReversal(debtId: string) {
    const debtStore = useDebtStore.getState();
    const transactionStore = useTransactionStore.getState();
    const walletStore = useWalletStore.getState();

    try {
      const debt = debtStore.debts.find(d => d.id === debtId);
      if (!debt) throw new Error('Debt not found');

      // 1. Revert wallet balance
      const wallet = walletStore.getWalletById(debt.originalWalletId);
      if (wallet) {
        const balanceChange = debt.type === 'debt' ? -debt.amount : debt.amount;
        walletStore.updateWallet(debt.originalWalletId, {
          balance: wallet.balance + balanceChange
        });
      }

      // 2. Delete all related transactions
      if (debt.originalTransactionId) {
        transactionStore.deleteTransaction(debt.originalTransactionId, true);
      }

      debt.paymentHistory.forEach(payment => {
        if (payment.transactionId) {
          transactionStore.deleteTransaction(payment.transactionId, true);
        }
      });

      // 3. Delete debt record
      const result = debtStore.cancelTransaction(debtId);

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Validate debt-wallet consistency
  validateDebtWalletConsistency() {
    const debtStore = useDebtStore.getState();
    const transactionStore = useTransactionStore.getState();
    const walletStore = useWalletStore.getState();

    const issues = [];

    debtStore.debts.forEach(debt => {
      // Check if original wallet exists
      const wallet = walletStore.getWalletById(debt.originalWalletId);
      if (!wallet) {
        issues.push(`Debt ${debt.id}: Original wallet ${debt.originalWalletId} not found`);
      }

      // Check if original transaction exists
      if (debt.originalTransactionId) {
        const transaction = transactionStore.transactions.find(t => t.id === debt.originalTransactionId);
        if (!transaction) {
          issues.push(`Debt ${debt.id}: Original transaction ${debt.originalTransactionId} not found`);
        }
      }

      // Check payment transactions
      debt.paymentHistory.forEach(payment => {
        if (payment.transactionId) {
          const transaction = transactionStore.transactions.find(t => t.id === payment.transactionId);
          if (!transaction) {
            issues.push(`Debt ${debt.id}: Payment transaction ${payment.transactionId} not found`);
          }
        }
      });
    });

    return issues;
  }
}

export const debtWalletService = DebtWalletService.getInstance();