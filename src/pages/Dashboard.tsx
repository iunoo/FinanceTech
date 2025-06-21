import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowRightLeft, Settings, Wallet } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useWalletColorStore } from '../store/walletColorStore';
import { useDebtStore } from '../store/debtStore';
import { useThemeStore } from '../store/themeStore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import TransactionForm from '../components/TransactionForm';
import WalletCard from '../components/WalletCard';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { transactions, getTotalIncome, getTotalExpenses } = useTransactionStore();
  const { wallets, getTotalBalance, activeWallet, setActiveWallet } = useWalletStore();
  const { getColorForBalance } = useWalletColorStore();
  const { debts, getUpcomingDebts } = useDebtStore();
  const { isDark } = useThemeStore();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const navigate = useNavigate();

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyIncome = getTotalIncome(monthStart.toISOString(), monthEnd.toISOString());
  const monthlyExpenses = getTotalExpenses(monthStart.toISOString(), monthEnd.toISOString());
  const balance = monthlyIncome - monthlyExpenses;
  const totalBalance = getTotalBalance();
  const upcomingDebts = getUpcomingDebts();
  const recentTransactions = transactions.slice(0, 5);

  const stats = [
    {
      title: 'Total Saldo Semua Dompet',
      value: `Rp ${totalBalance.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: getColorForBalance(totalBalance),
      bgColor: totalBalance >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: `Rp ${monthlyIncome.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: '#10B981',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Pengeluaran Bulan Ini',
      value: `Rp ${monthlyExpenses.toLocaleString('id-ID')}`,
      icon: TrendingDown,
      color: '#EF4444',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Hutang Aktif',
      value: debts.filter(d => !d.isPaid).length.toString(),
      icon: CreditCard,
      color: '#F59E0B',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: id });
  };

  const handleAddTransaction = () => {
    setTransactionFormType('expense');
    setIsTransactionFormOpen(true);
  };

  const handleTransfer = () => {
    setTransactionFormType('transfer');
    setIsTransactionFormOpen(true);
  };

  const handleWalletSettings = () => {
    navigate('/settings?tab=wallets');
  };

  return (
    <div className="space-y-6">
      {/* Quick Action - Tambah Transaksi */}
      <div className="glass-card p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddTransaction}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Transaksi</span>
          </button>
          <button
            onClick={handleTransfer}
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span>Transfer Antar Dompet</span>
          </button>
        </div>
      </div>

      {/* Enhanced Wallet Overview - No Animation */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Dompet Saya
            </h2>
          </div>
          <button 
            onClick={handleWalletSettings}
            className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
          >
            <Settings className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>
        
        {/* Responsive Wallet Grid - No Animation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isActive={activeWallet === wallet.id}
              onClick={() => setActiveWallet(wallet.id)}
            />
          ))}
        </div>

        {/* Total Balance Summary */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Saldo Semua Dompet
            </p>
            <p 
              className="text-3xl font-bold mt-2"
              style={{ color: getColorForBalance(totalBalance) }}
            >
              Rp {totalBalance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="glass-card p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  {stat.title}
                </p>
                <p 
                  className="text-2xl font-bold mt-1 amount-display"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Transaksi Terbaru
            </h2>
            <button 
              onClick={() => navigate('/transactions')}
              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const wallet = wallets.find(w => w.id === transaction.walletId);
                return (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 glass-button rounded-lg hover:transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {transaction.category}
                        </p>
                        <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                          {wallet?.name} • {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold amount-display ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Belum ada transaksi
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Debts */}
        <div className="glass-card p-6 rounded-lg">
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Hutang yang Akan Jatuh Tempo
          </h2>
          
          <div className="space-y-3">
            {upcomingDebts.length > 0 ? (
              upcomingDebts.map((debt) => (
                <div 
                  key={debt.id} 
                  className="flex items-center justify-between p-3 glass-button rounded-lg hover:transform hover:scale-105 transition-all duration-200"
                >
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {debt.name}
                    </p>
                    <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      Jatuh tempo: {formatDate(debt.dueDate)}
                    </p>
                  </div>
                  <p className={`font-bold amount-display ${
                    debt.type === 'debt' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    Rp {debt.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Tidak ada hutang yang akan jatuh tempo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Aksi Cepat Lainnya
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/analysis')}
            className="glass-button p-4 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-center"
          >
            <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Lihat Analisis</p>
          </button>
          <button 
            onClick={() => navigate('/debts')}
            className="glass-button p-4 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-center"
          >
            <CreditCard className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Kelola Hutang</p>
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="glass-button p-4 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-center"
          >
            <Settings className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Pengaturan</p>
          </button>
        </div>
      </div>

      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
        defaultType={transactionFormType}
      />
    </div>
  );
};

export default Dashboard;