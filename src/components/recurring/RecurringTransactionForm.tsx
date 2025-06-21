import React, { useState } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { useRecurringTransactionStore } from '../../store/recurringTransactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useCategoryStore } from '../../store/categoryStore';
import { useThemeStore } from '../../store/themeStore';
import WalletSelector from '../WalletSelector';
import CurrencyInput from '../CurrencyInput';
import DateTimePicker from '../DateTimePicker';
import { toast } from '../../store/toastStore';

interface RecurringTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: any;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ 
  isOpen, 
  onClose, 
  editingTransaction 
}) => {
  const { addRecurringTransaction, updateRecurringTransaction } = useRecurringTransactionStore();
  const { wallets } = useWalletStore();
  const { getCategoriesByType } = useCategoryStore();
  const { isDark } = useThemeStore();

  const [formData, setFormData] = useState({
    name: editingTransaction?.name || '',
    type: editingTransaction?.type || 'expense',
    amount: editingTransaction?.amount || 0,
    category: editingTransaction?.category || '',
    frequency: editingTransaction?.frequency || 'monthly',
    nextDueDate: editingTransaction?.nextDueDate ? 
      editingTransaction.nextDueDate.split('T')[0] : 
      new Date().toISOString().split('T')[0],
    walletId: editingTransaction?.walletId || wallets[0]?.id || '',
    description: editingTransaction?.description || '',
    isActive: editingTransaction?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori wajib dipilih';
    }

    if (!formData.walletId) {
      newErrors.walletId = 'Dompet wajib dipilih';
    }

    if (!formData.nextDueDate) {
      newErrors.nextDueDate = 'Tanggal jatuh tempo wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert date to ISO string with time
    const dueDateWithTime = new Date(formData.nextDueDate + 'T09:00:00').toISOString();

    const transactionData = {
      ...formData,
      nextDueDate: dueDateWithTime,
    };

    if (editingTransaction) {
      updateRecurringTransaction(editingTransaction.id, transactionData);
      toast.success('Transaksi berulang berhasil diperbarui!');
    } else {
      addRecurringTransaction(transactionData);
      toast.success('Transaksi berulang berhasil ditambahkan!');
    }

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      amount: 0,
      category: '',
      frequency: 'monthly',
      nextDueDate: new Date().toISOString().split('T')[0],
      walletId: wallets[0]?.id || '',
      description: '',
      isActive: true,
    });
    setErrors({});
  };

  const getFrequencyOptions = () => [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'yearly', label: 'Tahunan' },
  ];

  if (!isOpen) return null;

  return (
    <div className="glass-modal flex items-center justify-center p-4">
      <div className="modal-content p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingTransaction ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}
              </h2>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Atur tagihan atau pemasukan rutin Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center justify-center space-x-3 glass-button p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'expense' ? 'ring-2 ring-red-500 bg-red-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: '' }))}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full transition-all ${
                  formData.type === 'expense' ? 'bg-red-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Pengeluaran</span>
              </label>
              
              <label className={`flex items-center justify-center space-x-3 glass-button p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'income' ? 'ring-2 ring-green-500 bg-green-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: '' }))}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full transition-all ${
                  formData.type === 'income' ? 'bg-green-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Pemasukan</span>
              </label>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Nama Transaksi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Contoh: Listrik PLN, Gaji Bulanan"
                  style={{ fontSize: '16px' }}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Jumlah *
                </label>
                <CurrencyInput
                  value={formData.amount}
                  onChange={(amount) => setFormData(prev => ({ ...prev, amount }))}
                  placeholder="0"
                  className="p-3"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Wallet */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Dompet *
                </label>
                <WalletSelector
                  selectedWallet={formData.walletId}
                  onWalletChange={(walletId) => setFormData(prev => ({ ...prev, walletId }))}
                  showBalance={true}
                />
                {errors.walletId && (
                  <p className="text-red-500 text-sm mt-1">{errors.walletId}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Kategori *
                </label>
                <div className="dropdown-container">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                    style={{ fontSize: '16px' }}
                  >
                    <option value="" className={isDark ? 'bg-black' : 'bg-white'} disabled>Pilih kategori</option>
                    {getCategoriesByType(formData.type).map((category) => (
                      <option key={category.id} value={category.name} className={isDark ? 'bg-black' : 'bg-white'}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/* Frequency */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Frekuensi *
                </label>
                <div className="dropdown-container">
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                    style={{ fontSize: '16px' }}
                  >
                    {getFrequencyOptions().map((option) => (
                      <option key={option.value} value={option.value} className={isDark ? 'bg-black' : 'bg-white'}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next Due Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Tanggal Jatuh Tempo Pertama *
                </label>
                <DateTimePicker
                  value={formData.nextDueDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, nextDueDate: date }))}
                  placeholder="Pilih tanggal jatuh tempo"
                  allowFuture={true} // Allow future dates for recurring transactions
                />
                {errors.nextDueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.nextDueDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Keterangan
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
              placeholder="Keterangan tambahan (opsional)"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 glass-button rounded-lg">
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Aktifkan Transaksi
              </p>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Transaksi akan muncul dalam pengingat jika diaktifkan
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer transition-all duration-300 ${
                formData.isActive 
                  ? 'bg-green-500' 
                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{editingTransaction ? 'Perbarui' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTransactionForm;