import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { useDebtStore } from '../../store/debtStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useThemeStore } from '../../store/themeStore';
import { sanitizationUtils } from '../../utils/security';
import WalletSelector from '../WalletSelector';
import CurrencyInput from '../CurrencyInput';
import DateTimePicker from '../DateTimePicker';
import { toast } from '../../store/toastStore';

interface DebtFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingDebt?: any;
}

const DebtForm: React.FC<DebtFormProps> = ({ isOpen, onClose, editingDebt }) => {
  const { addDebt, updateDebt } = useDebtStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { wallets, updateWallet, getWalletById } = useWalletStore();
  const { isDark } = useThemeStore();

  const [formData, setFormData] = useState({
    type: editingDebt?.type || 'debt',
    name: editingDebt?.name || '',
    amount: editingDebt?.amount || 0,
    dueDate: editingDebt?.dueDate ? editingDebt.dueDate.split('T')[0] : '', // Remove time part
    description: editingDebt?.description || '',
  });

  const [walletId, setWalletId] = useState(wallets[0]?.id || '');

  const resetForm = () => {
    setFormData({
      type: 'debt',
      name: '',
      amount: 0,
      dueDate: '',
      description: '',
    });
    setWalletId(wallets[0]?.id || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (!formData.dueDate) {
      toast.error('Tanggal jatuh tempo wajib diisi');
      return;
    }

    // Sanitize user input
    const sanitizedName = sanitizationUtils.sanitizeString(formData.name);
    const sanitizedDescription = sanitizationUtils.sanitizeString(formData.description);

    // Convert date to ISO string with time set to end of day
    const dueDateWithTime = new Date(formData.dueDate + 'T23:59:59').toISOString();

    const debtData = {
      ...formData,
      name: sanitizedName,
      description: sanitizedDescription,
      dueDate: dueDateWithTime,
      originalWalletId: walletId,
    };

    if (editingDebt) {
      updateDebt(editingDebt.id, debtData);
      toast.success('Utang/Piutang berhasil diperbarui!');
    } else {
      const selectedWallet = getWalletById(walletId);
      if (!selectedWallet) {
        toast.error('Pilih dompet terlebih dahulu');
        return;
      }

      // Create debt record first
      const newDebtId = addDebt(debtData);

      if (formData.type === 'debt') {
        // UTANG: Saat berhutang, SALDO BERTAMBAH (karena dapat uang)
        updateWallet(walletId, { 
          balance: selectedWallet.balance + formData.amount 
        });

        // Buat transaksi pemasukan untuk utang dengan linking
        const transactionId = addTransaction({
          type: 'income',
          amount: formData.amount,
          category: 'Utang Diterima',
          description: sanitizationUtils.sanitizeString(`Utang dari ${formData.name}${formData.description ? ` - ${formData.description}` : ''}`),
          date: new Date().toISOString().split('T')[0],
          walletId: walletId,
          createdAt: new Date().toISOString(),
          isDebtTransaction: true,
          linkedDebtId: newDebtId,
          debtTransactionType: 'create',
          debtType: 'debt',
        });

        // Update debt with transaction ID
        updateDebt(newDebtId, { originalTransactionId: transactionId });

        // Get the generated transaction ID for display
        import('../../store/transactionStore').then(({ useTransactionStore }) => {
          const store = useTransactionStore.getState();
          const newTransaction = store.getTransactionById(transactionId);
          
          toast.success(`✅ Utang dari ${sanitizedName} berhasil ditambahkan!\n\n💰 Saldo ${selectedWallet.name} bertambah Rp ${formData.amount.toLocaleString('id-ID')}\n📝 Transaksi ${newTransaction?.transactionId} tercatat di riwayat`);
        });
      } else {
        // PIUTANG: Saat memberikan piutang, SALDO BERKURANG (REMOVED balance check)
        updateWallet(walletId, { 
          balance: selectedWallet.balance - formData.amount 
        });

        // Buat transaksi pengeluaran untuk piutang dengan linking
        const transactionId = addTransaction({
          type: 'expense',
          amount: formData.amount,
          category: 'Piutang Diberikan',
          description: sanitizationUtils.sanitizeString(`Memberikan pinjaman ke ${formData.name}${formData.description ? ` - ${formData.description}` : ''}`),
          date: new Date().toISOString().split('T')[0],
          walletId: walletId,
          createdAt: new Date().toISOString(),
          isDebtTransaction: true,
          linkedDebtId: newDebtId,
          debtTransactionType: 'create',
          debtType: 'credit',
        });

        // Update debt with transaction ID
        updateDebt(newDebtId, { originalTransactionId: transactionId });

        // Get the generated transaction ID for display
        import('../../store/transactionStore').then(({ useTransactionStore }) => {
          const store = useTransactionStore.getState();
          const newTransaction = store.getTransactionById(transactionId);
          
          toast.success(`✅ Piutang ke ${sanitizedName} berhasil ditambahkan!\n\n💸 Saldo ${selectedWallet.name} dikurangi Rp ${formData.amount.toLocaleString('id-ID')}\n📝 Transaksi ${newTransaction?.transactionId} tercatat di riwayat`);
        });
      }
    }

    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="glass-modal flex items-center justify-center p-4">
      <div className="modal-content p-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {editingDebt ? 'Edit Utang/Piutang' : 'Tambah Utang/Piutang'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Jenis
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center justify-center space-x-3 glass-button p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'debt' ? 'ring-2 ring-red-500 bg-red-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="debt"
                  checked={formData.type === 'debt'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full transition-all ${
                  formData.type === 'debt' ? 'bg-red-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Utang</span>
              </label>
              
              <label className={`flex items-center justify-center space-x-3 glass-button p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                formData.type === 'credit' ? 'ring-2 ring-green-500 bg-green-500/10' : ''
              }`}>
                <input
                  type="radio"
                  value="credit"
                  checked={formData.type === 'credit'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full transition-all ${
                  formData.type === 'credit' ? 'bg-green-500 scale-110' : 'border-2 border-gray-400'
                }`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Piutang</span>
              </label>
            </div>
          </div>

          {/* Main Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Wallet Selection */}
              {!editingDebt && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    💰 {formData.type === 'debt' ? 'Dompet Penerima Uang' : 'Sumber Dana'}
                  </label>
                  
                  <WalletSelector
                    selectedWallet={walletId}
                    onWalletChange={setWalletId}
                    showBalance={true}
                  />
                  
                  {/* Info Box */}
                  <div className="mt-3 p-3 glass-button rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {formData.type === 'debt' ? (
                          <>
                            <p className="font-medium text-blue-500 mb-1">🔄 Dampak Transaksi Utang:</p>
                            <p>• Saldo akan <span className="font-bold text-green-500">BERTAMBAH</span> (karena Anda menerima uang)</p>
                            <p>• Transaksi "Utang Diterima" (AP-YYMMXXXX) akan tercatat di riwayat</p>
                            <p>• Saat bayar utang nanti, saldo akan <span className="font-bold text-red-500">DIKURANGI</span></p>
                            <p className="text-orange-500 font-medium mt-1">⚠️ Jika transaksi dihapus dari riwayat, utang akan ikut terhapus</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-blue-500 mb-1">🔄 Dampak Transaksi Piutang:</p>
                            <p>• Saldo akan <span className="font-bold text-red-500">DIKURANGI</span> (karena Anda memberikan uang)</p>
                            <p>• Transaksi "Piutang Diberikan" (AR-YYMMXXXX) akan tercatat di riwayat</p>
                            <p>• Saat diterima kembali nanti, saldo akan <span className="font-bold text-green-500">BERTAMBAH</span></p>
                            <p className="text-orange-500 font-medium mt-1">⚠️ Jika transaksi dihapus dari riwayat, piutang akan ikut terhapus</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Nama *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder={`Nama orang yang ${formData.type === 'debt' ? 'memberikan pinjaman' : 'meminjam uang'}`}
                  style={{ fontSize: '16px' }}
                />
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
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Due Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Tanggal Jatuh Tempo *
                </label>
                <DateTimePicker
                  value={formData.dueDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  placeholder="Pilih tanggal jatuh tempo"
                  allowFuture={true} // Allow future dates for debt due dates
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Keterangan
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Keterangan atau catatan opsional"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
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
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200"
            >
              {editingDebt ? 'Perbarui' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtForm;