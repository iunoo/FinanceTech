import React, { useState } from 'react';
import { Edit, Trash2, CreditCard, AlertTriangle, History, X, Undo2, Eye } from 'lucide-react';
import { useDebtStore } from '../../store/debtStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useThemeStore } from '../../store/themeStore';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from '../../store/toastStore';

interface DebtTableProps {
  debts: any[];
  onEdit: (debt: any) => void;
  onDelete: (id: string) => void;
  onMakePayment: (debt: any) => void;
}

const DebtTable: React.FC<DebtTableProps> = ({ debts, onEdit, onDelete, onMakePayment }) => {
  const { cancelTransaction, deletePaymentRecord } = useDebtStore();
  const { addTransaction, getDebtTransactions } = useTransactionStore();
  const { updateWallet, getWalletById } = useWalletStore();
  const { isDark } = useThemeStore();
  const [showPaymentHistory, setShowPaymentHistory] = useState<string | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState<string | null>(null);

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getStatusColor = (debt: any) => {
    if (debt.isPaid) return 'text-green-500';
    const daysUntilDue = getDaysUntilDue(debt.dueDate);
    if (daysUntilDue < 0) return 'text-red-500';
    if (daysUntilDue <= 3) return 'text-orange-500';
    return isDark ? 'text-white' : 'text-gray-800';
  };

  const getStatusIcon = (debt: any) => {
    if (debt.isPaid) return <span className="text-green-500 font-bold">✅</span>;
    const daysUntilDue = getDaysUntilDue(debt.dueDate);
    if (daysUntilDue <= 3 && daysUntilDue >= 0) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (daysUntilDue < 0) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return null;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: id });
  };

  const formatCurrency = (amount: number) => {
    // Add null check to prevent undefined error
    const validAmount = amount || 0;
    return `Rp ${validAmount.toLocaleString('id-ID')}`;
  };

  const handleCancelTransaction = (debt: any) => {
    if (window.confirm(`Apakah Anda yakin ingin MEMBATALKAN SELURUH transaksi "${debt.name}"?\n\nIni akan:\n- Menghapus catatan utang/piutang\n- Mengembalikan saldo ke kondisi sebelum transaksi\n- Menghapus semua transaksi terkait dari riwayat\n\nJumlah: ${formatCurrency(debt.amount)}\nJenis: ${debt.type === 'debt' ? 'Utang' : 'Piutang'}`)) {
      
      const result = cancelTransaction(debt.id);
      
      if (result.success) {
        // Kembalikan saldo ke kondisi awal
        const wallet = getWalletById(debt.originalWalletId);
        if (wallet) {
          if (debt.type === 'debt') {
            // Utang dibatalkan: kurangi saldo (karena awalnya ditambah)
            updateWallet(debt.originalWalletId, { 
              balance: wallet.balance - debt.amount 
            });
            
            // Buat transaksi pembatalan
            addTransaction({
              type: 'expense',
              amount: debt.amount,
              category: 'Pembatalan Utang',
              description: `Pembatalan utang dari ${debt.name}`,
              date: new Date().toISOString().split('T')[0],
              walletId: debt.originalWalletId,
              createdAt: new Date().toISOString(),
            });
          } else {
            // Piutang dibatalkan: tambah saldo (karena awalnya dikurangi)
            updateWallet(debt.originalWalletId, { 
              balance: wallet.balance + debt.amount 
            });
            
            // Buat transaksi pembatalan
            addTransaction({
              type: 'income',
              amount: debt.amount,
              category: 'Pembatalan Piutang',
              description: `Pembatalan piutang ke ${debt.name}`,
              date: new Date().toISOString().split('T')[0],
              walletId: debt.originalWalletId,
              createdAt: new Date().toISOString(),
            });
          }
        }
        
        toast.success(result.message + '. Saldo telah dikembalikan ke kondisi awal.');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleDeletePayment = (debt: any, payment: any) => {
    if (window.confirm(`Hapus catatan pembayaran sebesar ${formatCurrency(payment.amount)}?\n\nSaldo akan dikembalikan dan sisa kewajiban akan bertambah.`)) {
      
      const result = deletePaymentRecord(debt.id, payment.id);
      
      if (result.success) {
        // Kembalikan saldo
        const wallet = getWalletById(payment.walletId);
        if (wallet) {
          if (debt.type === 'debt') {
            // Pembayaran utang dihapus: tambah saldo kembali
            updateWallet(payment.walletId, { 
              balance: wallet.balance + payment.amount 
            });
            
            // Buat transaksi pembatalan pembayaran
            addTransaction({
              type: 'income',
              amount: payment.amount,
              category: 'Pembatalan Bayar Utang',
              description: `Pembatalan pembayaran utang ke ${debt.name}`,
              date: new Date().toISOString().split('T')[0],
              walletId: payment.walletId,
              createdAt: new Date().toISOString(),
            });
          } else {
            // Penerimaan piutang dihapus: kurangi saldo
            updateWallet(payment.walletId, { 
              balance: wallet.balance - payment.amount 
            });
            
            // Buat transaksi pembatalan penerimaan
            addTransaction({
              type: 'expense',
              amount: payment.amount,
              category: 'Pembatalan Terima Piutang',
              description: `Pembatalan penerimaan piutang dari ${debt.name}`,
              date: new Date().toISOString().split('T')[0],
              walletId: payment.walletId,
              createdAt: new Date().toISOString(),
            });
          }
        }
        
        toast.success(result.message + '. Saldo telah disesuaikan.');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleShowTransactionHistory = (debtId: string) => {
    setShowTransactionHistory(showTransactionHistory === debtId ? null : debtId);
  };

  if (debts.length === 0) {
    return (
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="text-center py-12">
          <p className={`text-lg opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Tidak ada utang atau piutang ditemukan
          </p>
          <p className={`text-sm opacity-50 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Tambahkan utang atau piutang pertama Anda untuk memulai
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Status
              </th>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Nama
              </th>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Jenis
              </th>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Jumlah Awal
              </th>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Sisa Kewajiban
              </th>
              <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Jatuh Tempo
              </th>
              <th className={`text-right p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <React.Fragment key={debt.id}>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    {getStatusIcon(debt)}
                  </td>
                  <td className={`p-4 ${getStatusColor(debt)}`}>
                    <div>
                      <p className="font-medium">{debt.name}</p>
                      {debt.description && (
                        <p className="text-sm opacity-70">{debt.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      debt.type === 'debt'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}>
                      {debt.type === 'debt' ? 'Utang' : 'Piutang'}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${
                    debt.type === 'debt' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {formatCurrency(debt.amount)}
                  </td>
                  <td className={`p-4 font-bold ${
                    debt.isPaid ? 'text-green-500' : (debt.type === 'debt' ? 'text-red-500' : 'text-green-500')
                  }`}>
                    {debt.isPaid ? '✅ LUNAS' : formatCurrency(debt.remainingAmount || 0)}
                  </td>
                  <td className={`p-4 ${getStatusColor(debt)}`}>
                    <div>
                      <p>{formatDate(debt.dueDate)}</p>
                      {!debt.isPaid && (
                        <p className="text-sm">
                          {(() => {
                            const days = getDaysUntilDue(debt.dueDate);
                            if (days < 0) return <span className="text-red-500 font-medium">🚨 Terlambat {Math.abs(days)} hari</span>;
                            if (days === 0) return <span className="text-orange-500 font-medium">⚠️ Hari Ini</span>;
                            if (days <= 3) return <span className="text-orange-500 font-medium">⚠️ {days} hari lagi</span>;
                            return <span>{days} hari</span>;
                          })()
                        }
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Transaction History Button */}
                      <button
                        onClick={() => handleShowTransactionHistory(debt.id)}
                        className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-purple-500/20"
                        title="Lihat Riwayat Transaksi"
                      >
                        <Eye className="w-4 h-4 text-purple-500" />
                      </button>

                      {/* Payment History Button */}
                      {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                        <button
                          onClick={() => setShowPaymentHistory(showPaymentHistory === debt.id ? null : debt.id)}
                          className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-blue-500/20"
                          title="Lihat Riwayat Pembayaran"
                        >
                          <History className="w-4 h-4 text-blue-500" />
                        </button>
                      )}

                      {/* Payment Button */}
                      {!debt.isPaid && (
                        <button
                          onClick={() => onMakePayment(debt)}
                          className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-green-500/20"
                          title={debt.type === 'debt' ? 'Bayar Utang' : 'Terima Piutang'}
                        >
                          <CreditCard className="w-4 h-4 text-green-500" />
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(debt)}
                        className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                        title="Edit"
                      >
                        <Edit className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                      </button>

                      {/* Cancel Transaction Button */}
                      <button
                        onClick={() => handleCancelTransaction(debt)}
                        className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-orange-500/20"
                        title="Batalkan Transaksi"
                      >
                        <Undo2 className="w-4 h-4 text-orange-500" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete(debt.id)}
                        className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Transaction History Row */}
                {showTransactionHistory === debt.id && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="bg-white/5 p-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Riwayat Transaksi Terkait
                          </h4>
                          <button
                            onClick={() => setShowTransactionHistory(null)}
                            className="glass-button p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <TransactionHistoryView debtId={debt.id} />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Payment History Row */}
                {showPaymentHistory === debt.id && debt.paymentHistory.length > 0 && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="bg-white/5 p-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Riwayat Pembayaran
                          </h4>
                          <button
                            onClick={() => setShowPaymentHistory(null)}
                            className="glass-button p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {debt.paymentHistory.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 glass-button rounded-lg">
                              <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                                  {formatDate(payment.timestamp)} • {payment.method}
                                </p>
                                {payment.notes && (
                                  <p className={`text-sm opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                                    {payment.notes}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeletePayment(debt, payment)}
                                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                                title="Hapus Catatan Pembayaran"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component untuk menampilkan riwayat transaksi
const TransactionHistoryView: React.FC<{ debtId: string }> = ({ debtId }) => {
  const { getDebtTransactions } = useTransactionStore();
  const { getWalletById } = useWalletStore();
  const { isDark } = useThemeStore();
  
  const transactions = getDebtTransactions(debtId);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
          Tidak ada transaksi terkait ditemukan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => {
        const wallet = getWalletById(transaction.walletId);
        return (
          <div key={transaction.id} className="flex items-center justify-between p-3 glass-button rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <span className={`text-sm font-bold ${
                  transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                </span>
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {transaction.category}
                </p>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  {wallet?.name} • {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: id })}
                </p>
                {transaction.description && (
                  <p className={`text-sm opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    {transaction.description}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
              </p>
              <p className={`text-xs opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {transaction.debtTransactionType === 'create' ? 'Transaksi Awal' : 
                 transaction.debtTransactionType === 'payment' ? 'Pembayaran' : 
                 'Lainnya'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DebtTable;