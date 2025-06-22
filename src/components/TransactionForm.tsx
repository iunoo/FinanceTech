import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowRightLeft, AlertTriangle, Lightbulb } from 'lucide-react';
import { useTransactionStore, Transaction } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useCategoryStore } from '../store/categoryStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useThemeStore } from '../store/themeStore';
import { transactionIdHelpers } from '../store/transactionIdStore';
import { sanitizationUtils } from '../utils/security';
import WalletSelector from './WalletSelector';
import CurrencyInput from './CurrencyInput';
import DateTimePicker from './DateTimePicker';
import TimePicker from './TimePicker';
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
  const { wallets, updateWallet, getWalletById } = useWalletStore();
  const { getCategoriesByType } = useCategoryStore();
  const { getSuggestedCategory } = useAnalyticsStore();
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
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [previewTransactionId, setPreviewTransactionId] = useState<string>('');

  // Smart categorization effect
  useEffect(() => {
    if (formData.description && formData.type !== 'transfer' && !formData.category) {
      const suggestion = getSuggestedCategory(formData.description, formData.amount);
      setSuggestedCategory(suggestion);
    } else {
      setSuggestedCategory(null);
    }
  }, [formData.description, formData.amount, formData.type, formData.category, getSuggestedCategory]);

  // Preview transaction ID
  useEffect(() => {
    if (formData.type && !transaction) {
      const prefix = transactionIdHelpers.getPrefix(
        formData.type,
        formData.type === 'transfer',
        false,
        false
      );
      
      // Generate preview ID (this won't actually increment the counter)
      const now = new Date();
      const yearStr = now.getFullYear().toString().slice(-2);
      const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Get next sequence number for preview
      import('../store/transactionIdStore').then(({ useTransactionIdStore }) => {
        const currentCounter = useTransactionIdStore.getState().getCurrentCounter(prefix);
        const nextSequence = (currentCounter + 1).toString().padStart(4, '0');
        setPreviewTransactionId(`${prefix}-${yearStr}${monthStr}${nextSequence}`);
      });
    }
  }, [formData.type, transaction]);

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

    // VALIDASI SALDO WAJIB
    const wallet = getWalletById(formData.walletId);
    if (wallet) {
      if (formData.type === 'expense' && wallet.balance < formData.amount) {
        newErrors.amount = `Saldo tidak mencukupi! Saldo tersedia: Rp ${wallet.balance.toLocaleString('id-ID')}`;
      }
      
      if (formData.type === 'transfer') {
        if (wallet.balance < formData.amount) {
          newErrors.amount = `Saldo tidak mencukupi untuk transfer! Saldo tersedia: Rp ${wallet.balance.toLocaleString('id-ID')}`;
        }
      }
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

    // Sanitize user input
    const sanitizedDescription = sanitizationUtils.sanitizeString(formData.description);

    if (formData.type === 'transfer') {
      const toWallet = wallets.find(w => w.id === formData.toWalletId);
      if (!toWallet) {
        toast.error('Dompet tujuan tidak ditemukan!');
        return;
      }

      // VALIDASI SALDO UNTUK TRANSFER
      if (wallet.balance < formData.amount) {
        toast.error(`❌ Saldo tidak mencukupi untuk transfer!\n\nSaldo ${wallet.name}: Rp ${wallet.balance.toLocaleString('id-ID')}\nJumlah transfer: Rp ${formData.amount.toLocaleString('id-ID')}\nKekurangan: Rp ${(formData.amount - wallet.balance).toLocaleString('id-ID')}`);
        return;
      }

      // Update saldo dompet
      updateWallet(formData.walletId, { 
        balance: wallet.balance - formData.amount 
      });

      // Create transfer transactions (not included in analysis)
      const transferOut = {
        ...formData,
        type: 'expense' as const,
        category: 'Transfer Keluar',
        description: sanitizationUtils.sanitizeString(`Transfer ke ${toWallet.name}${formData.description ? ` - ${formData.description}` : ''}`),
        date: formData.date,
        createdAt: dateTime.toISOString(),
        isTransfer: true // Mark as transfer to exclude from analysis
      };

      const transferIn = {
        ...formData,
        type: 'income' as const,
        category: 'Transfer Masuk',
        description: sanitizationUtils.sanitizeString(`Transfer dari ${wallet.name}${formData.description ? ` - ${formData.description}` : ''}`),
        walletId: formData.toWalletId!,
        date: formData.date,
        createdAt: dateTime.toISOString(),
        isTransfer: true // Mark as transfer to exclude from analysis
      };

      updateWallet(formData.toWalletId!, { balance: toWallet.balance + formData.amount });

      const outId = addTransaction(transferOut);
      const inId = addTransaction(transferIn);

      // Get the generated transaction IDs for display
      import('../store/transactionStore').then(({ useTransactionStore }) => {
        const store = useTransactionStore.getState();
        const outTransaction = store.getTransactionById(outId);
        const inTransaction = store.getTransactionById(inId);
        
        toast.success(`✅ Transfer berhasil!\n\n💸 ${outTransaction?.transactionId}: -Rp ${formData.amount.toLocaleString('id-ID')}\n💰 ${inTransaction?.transactionId}: +Rp ${formData.amount.toLocaleString('id-ID')}`);
      });
    } else {
      // Regular transaction with balance validation
      if (formData.type === 'expense') {
        // VALIDASI SALDO UNTUK PENGELUARAN
        if (wallet.balance < formData.amount) {
          toast.error(`❌ Saldo tidak mencukupi!\n\nSaldo ${wallet.name}: Rp ${wallet.balance.toLocaleString('id-ID')}\nJumlah pengeluaran: Rp ${formData.amount.toLocaleString('id-ID')}\nKekurangan: Rp ${(formData.amount - wallet.balance).toLocaleString('id-ID')}`);
          return;
        }
      }

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
          description: sanitizedDescription,
          createdAt: dateTime.toISOString()
        });
        toast.success(`✅ Transaksi ${transaction.transactionId} berhasil diperbarui!`);
      } else {
        updateWallet(formData.walletId, { 
          balance: wallet.balance + balanceChange 
        });
        
        const newTransactionId = addTransaction({
          ...formData,
          description: sanitizedDescription,
          createdAt: dateTime.toISOString()
        });

        // Get the generated transaction ID for display
        import('../store/transactionStore').then(({ useTransactionStore }) => {
          const store = useTransactionStore.getState();
          const newTransaction = store.getTransactionById(newTransactionId);
          
          toast.success(`✅ Transaksi ${newTransaction?.transactionId} berhasil ditambahkan!\n\n💰 ${formData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${formData.type === 'income' ? '+' : '-'}Rp ${formData.amount.toLocaleString('id-ID')}`);
        });
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
    setSuggestedCategory(null);
    setPreviewTransactionId('');
    onClose();
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      setFormData(prev => ({ ...prev, category: suggestedCategory }));
      setSuggestedCategory(null);
      toast.success(`Kategori "${suggestedCategory}" diterapkan!`);
    }
  };

  // Real-time balance check
  const selectedWallet = getWalletById(formData.walletId);
  const isBalanceInsufficient = selectedWallet && 
    ((formData.type === 'expense' && selectedWallet.balance < formData.amount) ||
     (formData.type === 'transfer' && selectedWallet.balance < formData.amount));

  if (!isOpen) return null;

  return (
    <div className="glass-modal flex items-center justify-center p-4">
      <div className="modal-content p-6 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h2>
            {!transaction && previewTransactionId && (
              <p className={`text-sm opacity-70 mt-1 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                ID Transaksi: <span className="font-mono font-bold text-blue-500">{previewTransactionId}</span>
              </p>
            )}
            {transaction && (
              <p className={`text-sm opacity-70 mt-1 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                ID Transaksi: <span className="font-mono font-bold text-blue-500">{transaction.transactionId}</span>
              </p>
            )}
          </div>
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
                
                {/* Real-time Balance Warning */}
                {isBalanceInsufficient && formData.amount > 0 && (
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                        <p className="font-medium">❌ Saldo Tidak Mencukupi!</p>
                        <p>Saldo tersedia: Rp {selectedWallet?.balance.toLocaleString('id-ID')}</p>
                        <p>Dibutuhkan: Rp {formData.amount.toLocaleString('id-ID')}</p>
                        <p>Kekurangan: Rp {(formData.amount - (selectedWallet?.balance || 0)).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
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

                  {/* Smart Category Suggestion */}
                  {suggestedCategory && !formData.category && (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-4 h-4 text-green-500" />
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Saran: {suggestedCategory}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={applySuggestedCategory}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Gunakan
                        </button>
                      </div>
                    </div>
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

              {/* Date and Time with Custom Components */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Tanggal
                  </label>
                  <DateTimePicker
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    placeholder="Pilih tanggal"
                    allowFuture={false} // Prevent future dates for transactions
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Jam
                  </label>
                  <TimePicker
                    value={formData.time}
                    onChange={(time) => setFormData(prev => ({ ...prev, time }))}
                    placeholder="Pilih waktu"
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
              disabled={isBalanceInsufficient}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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