import React, { useState } from 'react';
import { Plus, Search, Filter, Users, TrendingUp, TrendingDown, AlertTriangle, CreditCard } from 'lucide-react';
import { useDebtStore } from '../store/debtStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from '../store/toastStore';
import DebtForm from '../components/debt/DebtForm';
import PaymentModal from '../components/debt/PaymentModal';
import DebtTable from '../components/debt/DebtTable';

const Debts: React.FC = () => {
  const { debts, deleteDebt, getTotalDebtAmount, getTotalCreditAmount, getDebtSummaryByName } = useDebtStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleEdit = (debt: any) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    try {
      if (window.confirm(`Apakah Anda yakin ingin menghapus "${debt.name}"?\n\nJumlah: Rp ${debt.amount.toLocaleString('id-ID')}\nJenis: ${debt.type === 'debt' ? 'Utang' : 'Piutang'}\n\nCatatan: Ini hanya menghapus catatan, tidak mempengaruhi saldo.`)) {
        deleteDebt(id);
        toast.success('Catatan utang/piutang berhasil dihapus!');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMakePayment = (debt: any) => {
    if (debt.isPaid) {
      toast.warning('Utang/Piutang ini sudah lunas!');
      return;
    }
    setSelectedDebt(debt);
    setIsPaymentModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDebt(null);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedDebt(null);
  };

  // Filter debts based on search and filters
  const filteredDebts = debts.filter(debt => {
    const matchesSearch = 
      debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || debt.type === filterType;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'paid' && debt.isPaid) ||
      (filterStatus === 'unpaid' && !debt.isPaid);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalDebtAmount = getTotalDebtAmount();
  const totalCreditAmount = getTotalCreditAmount();
  const upcomingDebts = debts.filter(d => {
    if (d.isPaid) return false;
    const daysUntilDue = Math.ceil((new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  });

  const debtSummary = getDebtSummaryByName();
  const uniqueContacts = Object.keys(debtSummary).length;

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Utang & Piutang
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSummaryModal(true)}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Users className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Rekapan</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="glass-button px-6 py-3 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Tambah Utang/Piutang
            </span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Total Utang
              </h3>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalDebtAmount)}
              </p>
              <p className={`text-sm mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Yang belum dibayar
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Total Piutang
              </h3>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalCreditAmount)}
              </p>
              <p className={`text-sm mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Yang belum diterima
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Segera Jatuh Tempo
              </h3>
              <p className="text-2xl font-bold text-orange-500">
                {upcomingDebts.length}
              </p>
              <p className={`text-sm mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Dalam 3 hari
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Total Kontak
              </h3>
              <p className="text-2xl font-bold text-blue-500">
                {uniqueContacts}
              </p>
              <p className={`text-sm mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Orang berbeda
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
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
              placeholder="Cari nama atau keterangan..."
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
                <option value="debt" className={isDark ? 'bg-black' : 'bg-white'}>Utang</option>
                <option value="credit" className={isDark ? 'bg-black' : 'bg-white'}>Piutang</option>
              </select>
            </div>
          </div>

          <div className="dropdown-container">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              <option value="all" className={isDark ? 'bg-black' : 'bg-white'}>Semua Status</option>
              <option value="unpaid" className={isDark ? 'bg-black' : 'bg-white'}>Belum Lunas</option>
              <option value="paid" className={isDark ? 'bg-black' : 'bg-white'}>Sudah Lunas</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`text-sm px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500`}>
            {filteredDebts.length} dari {debts.length} data
          </span>
          {searchTerm && (
            <span className={`text-sm px-3 py-1 rounded-lg bg-green-500/10 text-green-500`}>
              Pencarian: "{searchTerm}"
            </span>
          )}
          {filterType !== 'all' && (
            <span className={`text-sm px-3 py-1 rounded-lg bg-purple-500/10 text-purple-500`}>
              Jenis: {filterType === 'debt' ? 'Utang' : 'Piutang'}
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className={`text-sm px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500`}>
              Status: {filterStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
            </span>
          )}
        </div>
      </div>

      {/* Debts Table */}
      <DebtTable
        debts={filteredDebts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMakePayment={handleMakePayment}
      />

      {/* Summary Modal */}
      {showSummaryModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: isDark 
              ? 'rgba(0, 0, 0, 0.9)' 
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
          }}
        >
          <div 
            className="p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            style={{
              background: isDark 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: isDark 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Rekapan Utang & Piutang per Nama
              </h2>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
              >
                <Plus className={`w-5 h-5 rotate-45 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(debtSummary).map(([name, summary]) => (
                <div key={name} className="glass-button p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {name}
                      </h3>
                      <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        {summary.count} transaksi
                      </p>
                    </div>
                    <div className="text-right">
                      {summary.totalDebt > 0 && (
                        <p className="text-red-500 font-bold">
                          Utang: {formatCurrency(summary.totalDebt)}
                        </p>
                      )}
                      {summary.totalCredit > 0 && (
                        <p className="text-green-500 font-bold">
                          Piutang: {formatCurrency(summary.totalCredit)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {Object.keys(debtSummary).length === 0 && (
                <div className="text-center py-8">
                  <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Belum ada data utang/piutang
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DebtForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingDebt={editingDebt}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        debt={selectedDebt}
      />
    </div>
  );
};

export default Debts;