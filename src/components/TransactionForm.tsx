import React, { useState } from 'react';
import { X, Plus, ArrowRightLeft } from 'lucide-react';
import { useTransactionStore, Transaction } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useCategoryStore } from '../store/categoryStore';
import { useThemeStore } from '../store/themeStore';
import WalletSelector from './WalletSelector';
import CurrencyInput from './CurrencyInput';
import { toast } from '../store/toastStore';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  defaultType?: 'income' | 'expense' | 'transfer';
}

interface FormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
  walletId: string;
  toWalletId?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  defaultType = 'expense' 
}) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { wallets, updateWallet } = useWalletStore();
  const { getCategoriesByType } = useCategoryStore();
  const { isDark } = useThemeStore();
  
  const now = new Date();
  const [formData, setFormData] = useState<FormData>({
    type: transaction?.type || defaultType,
    amount: transaction?.amount || 0,
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date || now.toISOString().split('T')[0],
    time: transaction ? new Date(transaction.createdAt).toTimeString().slice(0, 5) : now.toTimeString().slice(0, 5),
    walletId: transaction?.walletId || wallets[0]?.id || '',
    toWalletId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0';
    }

    if (!formData.category && formData.type !== 'transfer') {
      newErrors.category = 'Kategori wajib dipilih';
    }

    if (!formData.walletId) {
      newErrors.walletId = 'Dompet wajib dipilih';
    }

    if (formData.type === 'transfer') {
      if (!formData.toWalletId) {
        newErrors.toWalletId = 'Dompet tujuan wajib dipilih';
      }
      if (formData.walletId === formData.toWalletId) {
        newErrors.toWalletId = 'Dompet tujuan harus berbeda dengan dompet asal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const wallet = wallets.find(w => w.id === formData.walletId);
    if (!wallet) {
      toast.error('Dompet tidak ditemukan!');
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${formData.date}T${formData.time}`);

    if (formData.type === 'transfer') {
      const toWallet = wallets.find(w => w.id === formData.toWalletId);
      if (!toWallet) {
        toast.error('Dompet tujuan tidak ditemukan!');
        return;
      }

      if (wallet.balance < formData.amount) {
        toast.error('Saldo tidak mencukupi untuk transfer!');
        return;
      }

      // Create transfer transactions (not included in analysis)
      const transferOut = {
        ...formData,
        type: 'expense' as const,
        category: 'Transfer Keluar',
        description: `Transfer ke ${toWallet.name}${formData.description ? ` - ${formData.description}` : ''}`,
        date: formData.date,
        createdAt: dateTime.toISOString(),
        isTransfer: true // Mark as transfer to exclude from analysis
      };

      const transferIn = {
        ...formData,
        type: 'income' as const,
        category: 'Transfer Masuk',
        description: `Transfer dari ${wallet.name}${formData.description ? ` - ${formData.description}` : ''}`,
        walletId: formData.toWalletId!,
        date: formData.date,
        createdAt: dateTime.toISOString(),
        isTransfer: true // Mark as transfer to exclude from analysis
      };

      updateWallet(formData.walletId, { balance: wallet.balance - formData.amount });
      updateWallet(formData.toWalletId!, { balance: toWallet.balance + formData.amount });

      addTransaction(transferOut);
      addTransaction(transferIn);

      toast.success(`Transfer Rp ${formData.amount.toLocaleString('id-ID')} berhasil!`);
    } else {
      // Regular transaction
      const balanceChange = formData.type === 'income' ? formData.amount : -formData.amount;
      
      if (transaction) {
        const oldBalanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        updateWallet(transaction.walletId, { 
          balance: wallets.find(w => w.id === transaction.walletId)!.balance + oldBalanceChange 
        });
        
        updateWallet(formData.walletId, { 
          balance: wallets.find(w => w.id === formData.walletId)!.balance + balanceChange 
        });
        
        updateTransaction(transaction.id, {
          ...formData,
          createdAt: dateTime.toISOString()
        });
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        updateWallet(formData.walletId, { 
          balance: wallet.balance + balanceChange 
        });
        
        addTransaction({
          ...formData,
          createdAt: dateTime.toISOString()
        });
        toast.success('Transaksi berhasil ditambahkan!');
      }
    }
    
    // Reset form
    const newNow = new Date();
    setFormData({
      type: defaultType,
      amount: 0,
      category: '',
      description: '',
      date: newNow.toISOString().split('T')[0],
      time: newNow.toTimeString().slice(0, 5),
      walletId: wallets[0]?.id || '',
      toWalletId: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        className="p-6 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto"
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
            {transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Transaction Type - Compact */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex items-center justify-center space-x-2 glass-button p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'expense' ? 'ring-2 ring-red-500 bg-red-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: '' }))}
                  className="sr-only"
                />
                <div className={`w-3 h-3 rounded-full transition-all ${
                  formData.type === 'expense' ? 'bg-red-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Keluar</span>
              </label>

              <label className={`flex items-center justify-center space-x-2 glass-button p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'transfer' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="transfer"
                  checked={formData.type === 'transfer'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: 'Transfer Antar Dompet' }))}
                  className="sr-only"
                />
                <div className={`w-3 h-3 rounded-full transition-all ${
                  formData.type === 'transfer' ? 'bg-blue-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Transfer</span>
              </label>
              
              <label className={`flex items-center justify-center space-x-2 glass-button p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'income' ? 'ring-2 ring-green-500 bg-green-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: '' }))}
                  className="sr-only"
                />
                <div className={`w-3 h-3 rounded-full transition-all ${
                  formData.type === 'income' ? 'bg-green-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Masuk</span>
              </label>
            </div>
          </div>

          {/* Main Form Grid - Compact 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Wallet Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {formData.type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
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

              {/* Transfer Destination */}
              {formData.type === 'transfer' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Ke Dompet
                  </label>
                  <WalletSelector
                    selectedWallet={formData.toWalletId || ''}
                    onWalletChange={(walletId) => setFormData(prev => ({ ...prev, toWalletId: walletId }))}
                    showBalance={true}
                    excludeWallets={[formData.walletId]}
                  />
                  {errors.toWalletId && (
                    <p className="text-red-500 text-sm mt-1">{errors.toWalletId}</p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Jumlah
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
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Category */}
              {formData.type !== 'transfer' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Kategori
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
              )}

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
                  placeholder="Keterangan opsional"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Jam
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons - Compact */}
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
              {formData.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{transaction ? 'Perbarui' : formData.type === 'transfer' ? 'Transfer' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;