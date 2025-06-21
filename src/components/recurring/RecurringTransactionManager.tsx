import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, AlertTriangle, Play, Pause, Calendar } from 'lucide-react';
import { useRecurringTransactionStore } from '../../store/recurringTransactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useCategoryStore } from '../../store/categoryStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import RecurringTransactionForm from './RecurringTransactionForm';

const RecurringTransactionManager: React.FC = () => {
  const { 
    recurringTransactions, 
    deleteRecurringTransaction, 
    getUpcomingTransactions, 
    getOverdueTransactions,
    markAsExecuted,
    toggleActive
  } = useRecurringTransactionStore();
  const { wallets, updateWallet, getWalletById } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const upcomingTransactions = getUpcomingTransactions(7);
  const overdueTransactions = getOverdueTransactions();

  const handleExecuteTransaction = (recurringTx: any) => {
    const wallet = getWalletById(recurringTx.walletId);
    if (!wallet) {
      toast.error('Dompet tidak ditemukan!');
      return;
    }

    // Check balance for expenses
    if (recurringTx.type === 'expense' && wallet.balance < recurringTx.amount) {
      toast.error(`Saldo tidak mencukupi!\nSaldo ${wallet.name}: Rp ${wallet.balance.toLocaleString('id-ID')}\nDibutuhkan: Rp ${recurringTx.amount.toLocaleString('id-ID')}`);
      return;
    }

    // Update wallet balance
    const balanceChange = recurringTx.type === 'income' ? recurringTx.amount : -recurringTx.amount;
    updateWallet(recurringTx.walletId, {
      balance: wallet.balance + balanceChange
    });

    // Create transaction
    addTransaction({
      type: recurringTx.type,
      amount: recurringTx.amount,
      category: recurringTx.category,
      description: `${recurringTx.name}${recurringTx.description ? ` - ${recurringTx.description}` : ''} (Otomatis)`,
      date: new Date().toISOString().split('T')[0],
      walletId: recurringTx.walletId,
      createdAt: new Date().toISOString(),
    });

    // Mark as executed
    markAsExecuted(recurringTx.id);

    toast.success(`✅ Transaksi berulang "${recurringTx.name}" berhasil dieksekusi!\n\n💰 ${recurringTx.type === 'income' ? '+' : '-'}Rp ${recurringTx.amount.toLocaleString('id-ID')}`);
  };

  const handleDelete = (id: string) => {
    const transaction = recurringTransactions.find(t => t.id === id);
    if (window.confirm(`Hapus transaksi berulang "${transaction?.name}"?`)) {
      deleteRecurringTransaction(id);
      toast.success('Transaksi berulang berhasil dihapus!');
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'yearly': return 'Tahunan';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Transaksi Berulang
          </h2>
          <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Kelola tagihan dan pemasukan rutin Anda
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="glass-button px-6 py-3 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Tambah Transaksi Berulang
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Total Aktif
              </h3>
              <p className="text-3xl font-bold text-blue-500">
                {recurringTransactions.filter(t => t.isActive).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Segera Jatuh Tempo
              </h3>
              <p className="text-3xl font-bold text-orange-500">
                {upcomingTransactions.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Terlambat
              </h3>
              <p className="text-3xl font-bold text-red-500">
                {overdueTransactions.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Transactions Alert */}
      {overdueTransactions.length > 0 && (
        <div className="glass-card p-6 rounded-lg border-l-4 border-red-500 bg-red-500/5">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className={`text-lg font-bold text-red-500 mb-2`}>
                ⚠️ Transaksi Terlambat
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Anda memiliki {overdueTransactions.length} transaksi yang sudah melewati jadwal:
              </p>
              <div className="space-y-2">
                {overdueTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 glass-button rounded-lg">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {tx.name}
                      </p>
                      <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        Terlambat {Math.abs(getDaysUntilDue(tx.nextDueDate))} hari
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteTransaction(tx)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Eksekusi Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Transactions */}
      {upcomingTransactions.length > 0 && (
        <div className="glass-card p-6 rounded-lg">
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📅 Transaksi Mendatang (7 Hari)
          </h3>
          <div className="space-y-3">
            {upcomingTransactions.map((tx) => {
              const daysUntil = getDaysUntilDue(tx.nextDueDate);
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 glass-button rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {tx.name}
                      </p>
                      <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        {daysUntil === 0 ? 'Hari ini' : `${daysUntil} hari lagi`} • {getFrequencyText(tx.frequency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className={`font-bold ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                    </p>
                    {daysUntil <= 1 && (
                      <button
                        onClick={() => handleExecuteTransaction(tx)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        Eksekusi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Recurring Transactions */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Semua Transaksi Berulang
          </h3>
        </div>
        
        {recurringTransactions.length > 0 ? (
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
                    Jumlah
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Frekuensi
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
                {recurringTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(tx.id)}
                        className={`p-2 rounded-lg transition-all ${
                          tx.isActive 
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                            : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                        }`}
                      >
                        {tx.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <div>
                        <p className="font-medium">{tx.name}</p>
                        <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                          {tx.category}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tx.type === 'income'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className={`p-4 font-bold ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {getFrequencyText(tx.frequency)}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <div>
                        <p>{format(new Date(tx.nextDueDate), 'dd/MM/yyyy', { locale: id })}</p>
                        <p className={`text-sm ${
                          getDaysUntilDue(tx.nextDueDate) < 0 ? 'text-red-500' :
                          getDaysUntilDue(tx.nextDueDate) <= 3 ? 'text-orange-500' : 'opacity-70'
                        }`}>
                          {getDaysUntilDue(tx.nextDueDate) < 0 
                            ? `Terlambat ${Math.abs(getDaysUntilDue(tx.nextDueDate))} hari`
                            : getDaysUntilDue(tx.nextDueDate) === 0 
                              ? 'Hari ini'
                              : `${getDaysUntilDue(tx.nextDueDate)} hari lagi`
                          }
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                        >
                          <Edit className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className={`w-16 h-16 mx-auto mb-4 opacity-50 ${isDark ? 'text-white' : 'text-gray-600'}`} />
            <p className={`text-lg opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Belum ada transaksi berulang
            </p>
            <p className={`text-sm opacity-50 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Tambahkan tagihan atau pemasukan rutin untuk memudahkan pengelolaan keuangan
            </p>
          </div>
        )}
      </div>

      <RecurringTransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default RecurringTransactionManager;