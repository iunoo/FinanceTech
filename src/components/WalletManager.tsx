import React, { useState } from 'react';
import { Plus, Trash2, Edit, Upload, X, Wallet, Settings } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useTransactionStore } from '../store/transactionStore';
import { useThemeStore } from '../store/themeStore';
import CurrencyInput from './CurrencyInput';
import { toast } from '../store/toastStore';

const WalletManager: React.FC = () => {
  const { wallets, addWallet, updateWallet, deleteWallet } = useWalletStore();
  const { getTransactionsByWallet, addTransaction } = useTransactionStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [adjustingWallet, setAdjustingWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'ewallet' | 'custom',
    balance: 0,
    color: '#0066CC',
    icon: ''
  });
  const [adjustmentData, setAdjustmentData] = useState({
    newBalance: 0,
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama dompet wajib diisi');
      return;
    }

    if (editingWallet) {
      updateWallet(editingWallet.id, formData);
      toast.success('Dompet berhasil diperbarui!');
    } else {
      addWallet(formData);
      toast.success('Dompet berhasil ditambahkan!');
    }

    resetForm();
  };

  const handleDelete = (wallet: any) => {
    if (wallet.balance !== 0) {
      toast.error('Tidak dapat menghapus dompet yang masih memiliki saldo');
      return;
    }

    const transactions = getTransactionsByWallet(wallet.id);
    if (transactions.length > 0) {
      toast.error('Tidak dapat menghapus dompet yang memiliki riwayat transaksi');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus dompet "${wallet.name}"?`)) {
      deleteWallet(wallet.id);
      toast.success('Dompet berhasil dihapus!');
    }
  };

  const handleAdjustBalance = (wallet: any) => {
    setAdjustingWallet(wallet);
    setAdjustmentData({
      newBalance: wallet.balance,
      reason: ''
    });
    setIsAdjustmentOpen(true);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustingWallet) return;

    const currentBalance = adjustingWallet.balance;
    const newBalance = adjustmentData.newBalance;
    const difference = newBalance - currentBalance;

    if (difference === 0) {
      toast.info('Saldo tidak berubah');
      return;
    }

    if (!adjustmentData.reason.trim()) {
      toast.error('Alasan penyesuaian wajib diisi');
      return;
    }

    // Update saldo dompet
    updateWallet(adjustingWallet.id, { balance: newBalance });
    
    // Buat transaksi penyesuaian (ditandai khusus agar tidak masuk analisis)
    const adjustmentDescription = `${adjustmentData.reason} (dari Rp ${currentBalance.toLocaleString('id-ID')} ke Rp ${newBalance.toLocaleString('id-ID')})`;
    
    if (difference > 0) {
      // Saldo bertambah - buat transaksi pemasukan
      addTransaction({
        type: 'income',
        amount: difference,
        category: 'Penyesuaian Saldo',
        description: adjustmentDescription,
        date: new Date().toISOString().split('T')[0],
        walletId: adjustingWallet.id,
        createdAt: new Date().toISOString(),
        isBalanceAdjustment: true, // Flag khusus untuk exclude dari analisis
      });
    } else {
      // Saldo berkurang - buat transaksi pengeluaran
      addTransaction({
        type: 'expense',
        amount: Math.abs(difference),
        category: 'Penyesuaian Saldo',
        description: adjustmentDescription,
        date: new Date().toISOString().split('T')[0],
        walletId: adjustingWallet.id,
        createdAt: new Date().toISOString(),
        isBalanceAdjustment: true, // Flag khusus untuk exclude dari analisis
      });
    }
    
    // Get the generated transaction ID for display
    import('../store/transactionStore').then(({ useTransactionStore }) => {
      const store = useTransactionStore.getState();
      const transactions = store.getTransactionsByWallet(adjustingWallet.id);
      const latestTransaction = transactions[0]; // Transactions are sorted newest first
      
      if (latestTransaction) {
        toast.success(`✅ Saldo dompet ${adjustingWallet.name} berhasil disesuaikan!\n\n💰 Saldo sebelumnya: Rp ${currentBalance.toLocaleString('id-ID')}\n🔄 Saldo sekarang: Rp ${newBalance.toLocaleString('id-ID')}\n📝 Transaksi ${latestTransaction.transactionId} tercatat`);
      } else {
        toast.success(`✅ Saldo dompet ${adjustingWallet.name} berhasil disesuaikan!`);
      }
    });
    
    setIsAdjustmentOpen(false);
    setAdjustingWallet(null);
    setAdjustmentData({ newBalance: 0, reason: '' });
  };

  const handleEdit = (wallet: any) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color,
      icon: wallet.icon
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      balance: 0,
      color: '#0066CC',
      icon: ''
    });
    setEditingWallet(null);
    setIsFormOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('Ukuran file maksimal 1MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, icon: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Kelola Dompet
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Tambah Dompet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* Use Lucide React Icon Instead of Emoji */}
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  {wallet.icon && wallet.icon.startsWith('data:') ? (
                    <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Wallet className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                  )}
                </div>
                <div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {wallet.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {wallet.type}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleAdjustBalance(wallet)}
                  className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-blue-500/20"
                  title="Sesuaikan Saldo"
                >
                  <Settings className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={() => handleEdit(wallet)}
                  className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                >
                  <Edit className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </button>
                <button
                  onClick={() => handleDelete(wallet)}
                  className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <p className={`text-lg font-bold ${
              wallet.balance >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              Rp {wallet.balance.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>

      {/* Balance Adjustment Modal */}
      {isAdjustmentOpen && (
        <div className="fixed inset-0 glass-modal flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Penyesuaian Saldo
              </h3>
              <button
                onClick={() => setIsAdjustmentOpen(false)}
                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
              >
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Dompet: {adjustingWallet?.name}
                </label>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Saldo saat ini: Rp {adjustingWallet?.balance.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Saldo Baru
                </label>
                <CurrencyInput
                  value={adjustmentData.newBalance}
                  onChange={(amount) => setAdjustmentData(prev => ({ ...prev, newBalance: amount }))}
                  placeholder="0"
                  className="p-3"
                />
                {adjustmentData.newBalance !== adjustingWallet?.balance && (
                  <p className={`text-sm mt-2 ${
                    adjustmentData.newBalance > adjustingWallet?.balance ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {adjustmentData.newBalance > adjustingWallet?.balance ? '+' : ''}
                    Rp {(adjustmentData.newBalance - adjustingWallet?.balance).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Alasan Penyesuaian *
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Contoh: Koreksi saldo bank, cash yang hilang, dll"
                  required
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  💡 <strong>Catatan:</strong> Transaksi penyesuaian (BA-YYMMXXXX) tidak akan mempengaruhi laporan analisis keuangan.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentOpen(false)}
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
                  Sesuaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 glass-modal flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}
              </h3>
              <button
                onClick={resetForm}
                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
              >
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Nama Dompet
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Masukkan nama dompet"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Jenis Dompet
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Icon Dompet (Opsional)
                </label>
                <div className="flex items-center space-x-3">
                  {formData.icon && formData.icon.startsWith('data:') && (
                    <img src={formData.icon} alt="Preview" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="icon-upload"
                    />
                    <label
                      htmlFor="icon-upload"
                      className="glass-button px-4 py-2 rounded-lg cursor-pointer hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Upload className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isDark ? 'text-white' : 'text-gray-800'}>Upload Gambar</span>
                    </label>
                  </div>
                </div>
                <p className={`text-xs mt-2 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Gambar maksimal 100x100px, 1MB. Jika tidak diisi, akan menggunakan ikon dompet default.
                </p>
              </div>

              {!editingWallet && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Saldo Awal
                  </label>
                  <input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: Number(e.target.value) }))}
                    className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
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
                  {editingWallet ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;