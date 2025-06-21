import React, { useState } from 'react';
import { Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useThemeStore } from '../store/themeStore';
import TransactionForm from '../components/TransactionForm';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from '../store/toastStore';

const Transactions: React.FC = () => {
  const { transactions, deleteTransaction } = useTransactionStore();
  const { wallets, updateWallet } = useWalletStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesWallet = filterWallet === 'all' || transaction.walletId === filterWallet;
    return matchesSearch && matchesType && matchesWallet;
  });

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      // Revert wallet balance
      const wallet = wallets.find(w => w.id === transaction.walletId);
      if (wallet) {
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        updateWallet(transaction.walletId, { 
          balance: wallet.balance + balanceChange 
        });
      }
      
      deleteTransaction(transaction.id);
      toast.success('Transaksi berhasil dihapus!');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown';
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Transaksi
        </h1>
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

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-white' : 'text-gray-500'
            } opacity-50`} />
            <input
              type="text"
              placeholder="Cari transaksi..."
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
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {getWalletName(transaction.walletId)}
                    </td>
                    <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {transaction.category}
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
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                        >
                          <Edit className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
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
            <p className={`text-lg opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Tidak ada transaksi ditemukan
            </p>
            <p className={`text-sm opacity-50 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              {searchTerm || filterType !== 'all' || filterWallet !== 'all'
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