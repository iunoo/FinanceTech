import React, { useState } from 'react';
import { Plus, Edit, Trash2, Filter, Search, Eye, Lock, Copy, Calendar, Download } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useThemeStore } from '../store/themeStore';
import { transactionIdHelpers } from '../store/transactionIdStore';
import TransactionForm from '../components/TransactionForm';
import ExportDataButton from '../components/ExportDataButton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from '../store/toastStore';
import DateTimePicker from '../components/DateTimePicker';

const Transactions: React.FC = () => {
  const { transactions, deleteTransaction, getTransactionStats } = useTransactionStore();
  const { wallets } = useWalletStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const stats = getTransactionStats();

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesWallet = filterWallet === 'all' || transaction.walletId === filterWallet;
    
    // Date filter
    let matchesDate = true;
    if (startDate && endDate) {
      const transactionDate = new Date(transaction.date);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999); // End of day
      matchesDate = transactionDate >= filterStartDate && transactionDate <= filterEndDate;
    }
    
    return matchesSearch && matchesType && matchesWallet && matchesDate;
  });

  const handleEdit = (transaction) => {
    // Cek apakah ini transaksi utang/piutang
    if (transaction.isDebtTransaction) {
      toast.warning('⚠️ Transaksi utang/piutang tidak dapat diubah dari halaman ini.\n\nSilakan kelola dari menu "Utang & Piutang" untuk menjaga konsistensi data.');
      return;
    }
    
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction) => {
    // Cek apakah ini transaksi utang/piutang
    if (transaction.isDebtTransaction) {
      toast.error('🚫 Transaksi utang/piutang tidak dapat dihapus dari halaman ini.\n\nUntuk menghapus:\n• Buka menu "Utang & Piutang"\n• Gunakan tombol "Batalkan Transaksi" atau "Hapus Catatan Pembayaran"\n\nIni untuk menjaga konsistensi data keuangan Anda.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi ${transaction.transactionId}?`)) {
      // The deleteTransaction function will handle wallet balance adjustments
      deleteTransaction(transaction.id);
      toast.success(`Transaksi ${transaction.transactionId} berhasil dihapus!`);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const copyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success(`ID Transaksi ${transactionId} disalin!`);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown';
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.isDebtTransaction) {
      return <Lock className="w-4 h-4 text-orange-500" title="Transaksi Utang/Piutang - Terlindungi" />;
    }
    return null;
  };

  const getTransactionTypeLabel = (transaction: any) => {
    const parsed = transactionIdHelpers.parseTransactionId(transaction.transactionId);
    if (parsed) {
      return transactionIdHelpers.getTypeDescription(parsed.prefix);
    }
    return transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Transaksi
        </h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Calendar className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {showDateFilter ? 'Sembunyikan Filter' : 'Filter Tanggal'}
            </span>
          </button>
          
          <ExportDataButton 
            startDate={startDate}
            endDate={endDate}
            walletId={filterWallet !== 'all' ? filterWallet : undefined}
          />
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="glass-button px-6 py-3 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Tambah Transaksi
            </span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      {showDateFilter && (
        <div className="glass-card p-4 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Dari Tanggal
              </label>
              <DateTimePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Pilih tanggal mulai"
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Sampai Tanggal
              </label>
              <DateTimePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Pilih tanggal akhir"
              />
            </div>
            <div className="flex items-end space-x-2 mt-6">
              <button
                onClick={clearDateFilter}
                className={`px-4 py-2.5 glass-button rounded-lg text-sm hover:transform hover:scale-105 transition-all duration-200 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Statistics - More Compact */}
      <div className="glass-card p-4 rounded-lg">
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byPrefix).map(([prefix, count]) => (
            <div key={prefix} className="px-3 py-2 glass-button rounded-lg flex items-center space-x-2">
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {prefix}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-xs font-medium">
                {count}
              </span>
              <span className={`text-xs opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {transactionIdHelpers.getTypeDescription(prefix).split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card p-4 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start space-x-3">
          <Eye className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <p className="font-medium text-blue-500 mb-1">💡 Informasi Penting:</p>
            <ul className="space-y-1 opacity-90">
              <li>• Setiap transaksi memiliki <span className="font-bold">ID unik</span> dengan format: PREFIX-YYMMXXXX</li>
              <li>• Transaksi utang/piutang <span className="font-bold">tidak dapat diubah/dihapus</span> dari halaman ini</li>
              <li>• Kelola utang/piutang melalui menu <span className="font-bold">"Utang & Piutang"</span></li>
              <li>• Transaksi yang terlindungi ditandai dengan ikon <Lock className="w-3 h-3 inline text-orange-500" /></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-white' : 'text-gray-500'
            } opacity-50`} />
            <input
              type="text"
              placeholder="Cari transaksi atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 glass-input ${
                isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-500'} opacity-50`} />
            <div className="flex-1 dropdown-container">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full px-4 py-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
              >
                <option value="all" className={isDark ? 'bg-black' : 'bg-white'}>Semua Jenis</option>
                <option value="income" className={isDark ? 'bg-black' : 'bg-white'}>Pemasukan</option>
                <option value="expense" className={isDark ? 'bg-black' : 'bg-white'}>Pengeluaran</option>
              </select>
            </div>
          </div>

          <div className="dropdown-container">
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className={`w-full px-4 py-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              <option value="all" className={isDark ? 'bg-black' : 'bg-white'}>Semua Dompet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id} className={isDark ? 'bg-black' : 'bg-white'}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card rounded-lg overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Status
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    ID Transaksi
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Tanggal
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Dompet
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Kategori
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Keterangan
                  </th>
                  <th className={`text-left p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Jenis
                  </th>
                  <th className={`text-right p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Jumlah
                  </th>
                  <th className={`text-right p-4 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      {getTransactionIcon(transaction)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {transaction.transactionId}
                        </span>
                        <button
                          onClick={() => copyTransactionId(transaction.transactionId)}
                          className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200"
                          title="Salin ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {getWalletName(transaction.walletId)}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <div className="flex items-center space-x-2">
                        <span>{transaction.category}</span>
                        {transaction.isDebtTransaction && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 text-xs rounded-full">
                            Utang/Piutang
                          </span>
                        )}
                        {transaction.isTransfer && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-full">
                            Transfer
                          </span>
                        )}
                        {transaction.isBalanceAdjustment && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-500 text-xs rounded-full">
                            Adjustment
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-600'} opacity-70`}>
                      {transaction.description || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        transaction.type === 'income'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {getTransactionTypeLabel(transaction)}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {transaction.isDebtTransaction ? (
                          // Transaksi utang/piutang - hanya bisa dilihat
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500`}>
                              Terlindungi
                            </span>
                            <button
                              onClick={() => toast.info('💡 Transaksi ini terkait dengan utang/piutang.\n\nKelola melalui menu "Utang & Piutang" untuk menjaga konsistensi data.')}
                              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                              title="Info Transaksi"
                            >
                              <Eye className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            </button>
                          </div>
                        ) : (
                          // Transaksi biasa - bisa diedit dan dihapus
                          <>
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                              title="Edit Transaksi"
                            >
                              <Edit className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction)}
                              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={`text-lg opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Tidak ada transaksi ditemukan
            </p>
            <p className={`text-sm opacity-50 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              {searchTerm || filterType !== 'all' || filterWallet !== 'all' || (startDate && endDate)
                ? 'Coba sesuaikan pencarian atau filter Anda'
                : 'Tambahkan transaksi pertama Anda untuk memulai'
              }
            </p>
          </div>
        )}
      </div>

      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;