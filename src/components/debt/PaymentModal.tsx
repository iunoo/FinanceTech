import React, { useState } from 'react';
import { X, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { useDebtStore } from '../../store/debtStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useThemeStore } from '../../store/themeStore';
import WalletSelector from '../WalletSelector';
import CurrencyInput from '../CurrencyInput';
import { toast } from '../../store/toastStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, debt }) => {
  const { makePayment } = useDebtStore();
  const { addTransaction } = useTransactionStore();
  const { wallets, updateWallet, getWalletById } = useWalletStore();
  const { isDark } = useThemeStore();

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    walletId: wallets[0]?.id || '',
    method: 'cash',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!debt) return;

    // VALIDASI UTAMA: Cek apakah pembayaran melebihi sisa kewajiban
    if (paymentData.amount > debt.remainingAmount) {
      toast.error(`❌ Pembayaran tidak boleh melebihi sisa kewajiban!\n\nSisa kewajiban: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\nJumlah yang dimasukkan: Rp ${paymentData.amount.toLocaleString('id-ID')}`);
      return;
    }

    if (paymentData.amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    const wallet = getWalletById(paymentData.walletId);
    if (!wallet) {
      toast.error('Dompet tidak ditemukan!');
      return;
    }

    let transactionId = '';

    if (debt.type === 'debt') {
      // UTANG: Saat bayar utang, saldo DIKURANGI (pengeluaran)
      if (wallet.balance < paymentData.amount) {
        toast.error(`❌ Saldo ${wallet.name} tidak mencukupi!\n\nSaldo saat ini: Rp ${wallet.balance.toLocaleString('id-ID')}\nDibutuhkan: Rp ${paymentData.amount.toLocaleString('id-ID')}`);
        return;
      }

      // Update saldo dompet
      updateWallet(paymentData.walletId, { 
        balance: wallet.balance - paymentData.amount 
      });

      // Buat transaksi pengeluaran dan link ke debt
      transactionId = addTransaction({
        type: 'expense',
        amount: paymentData.amount,
        category: 'Pembayaran Utang',
        description: `Bayar utang ke ${debt.name}${paymentData.notes ? ` (${paymentData.notes})` : ''}`,
        date: new Date().toISOString().split('T')[0],
        walletId: paymentData.walletId,
        createdAt: new Date().toISOString(),
        isDebtTransaction: true,
        linkedDebtId: debt.id,
        debtTransactionType: 'payment',
      });

    } else {
      // PIUTANG: Saat diterima kembali, saldo BERTAMBAH (pemasukan)
      updateWallet(paymentData.walletId, { 
        balance: wallet.balance + paymentData.amount 
      });

      // Buat transaksi pemasukan dan link ke debt
      transactionId = addTransaction({
        type: 'income',
        amount: paymentData.amount,
        category: 'Penerimaan Piutang',
        description: `Terima piutang dari ${debt.name}${paymentData.notes ? ` (${paymentData.notes})` : ''}`,
        date: new Date().toISOString().split('T')[0],
        walletId: paymentData.walletId,
        createdAt: new Date().toISOString(),
        isDebtTransaction: true,
        linkedDebtId: debt.id,
        debtTransactionType: 'payment',
      });
    }

    // Update debt record dengan validasi di store dan link transaction
    const result = makePayment(debt.id, paymentData.amount, paymentData.walletId, paymentData.method, paymentData.notes, transactionId);
    
    if (result.success) {
      toast.success(result.message);
      onClose();
      // Reset form
      setPaymentData({
        amount: 0,
        walletId: wallets[0]?.id || '',
        method: 'cash',
        notes: '',
      });
    } else {
      toast.error(result.message);
    }
  };

  const selectedWallet = getWalletById(paymentData.walletId);
  const isAmountExceeding = paymentData.amount > debt?.remainingAmount;
  const isBalanceInsufficient = debt?.type === 'debt' && selectedWallet && selectedWallet.balance < paymentData.amount;

  if (!isOpen || !debt) return null;

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
        className="p-6 rounded-lg w-full max-w-md"
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
            {debt.type === 'debt' ? 'Bayar Utang' : 'Terima Piutang'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        {/* Debt Information */}
        <div className="mb-6 p-4 glass-button rounded-lg">
          <div className="space-y-2">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {debt.type === 'debt' ? 'Utang ke' : 'Piutang dari'}: {debt.name}
            </p>
            {debt.description && (
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {debt.description}
              </p>
            )}
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-600'}`}>Jumlah Awal:</span>
              <span className={`font-bold ${debt.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                Rp {debt.amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-600'}`}>Sisa Kewajiban:</span>
              <span className={`text-xl font-bold ${debt.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                Rp {debt.remainingAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Jumlah Pembayaran
            </label>
            <CurrencyInput
              value={paymentData.amount}
              onChange={(amount) => setPaymentData(prev => ({ ...prev, amount }))}
              placeholder="0"
              className="p-3"
            />
            
            {/* Validasi Error - Melebihi Sisa Kewajiban */}
            {isAmountExceeding && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                    <p className="font-medium">❌ Pembayaran Melebihi Sisa Kewajiban!</p>
                    <p>Maksimal yang bisa dibayar: Rp {debt.remainingAmount.toLocaleString('id-ID')}</p>
                    <p>Jumlah yang dimasukkan: Rp {paymentData.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: Math.floor(debt.remainingAmount / 2) }))}
                className="glass-button px-3 py-1 rounded text-xs hover:transform hover:scale-105 transition-all duration-200"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: debt.remainingAmount }))}
                className="glass-button px-3 py-1 rounded text-xs hover:transform hover:scale-105 transition-all duration-200"
              >
                Lunas
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {debt.type === 'debt' ? '💸 Bayar dari Dompet' : '💰 Terima ke Dompet'}
            </label>
            <WalletSelector
              selectedWallet={paymentData.walletId}
              onWalletChange={(walletId) => setPaymentData(prev => ({ ...prev, walletId }))}
              showBalance={true}
            />
            
            {/* Balance Check Warning */}
            {isBalanceInsufficient && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                    <p className="font-medium">❌ Saldo Tidak Mencukupi!</p>
                    <p>Saldo dompet: Rp {selectedWallet.balance.toLocaleString('id-ID')}</p>
                    <p>Dibutuhkan: Rp {paymentData.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-3 p-3 glass-button rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {debt.type === 'debt' ? (
                    <>
                      <p className="font-medium text-blue-500 mb-1">🔄 Dampak Pembayaran Utang:</p>
                      <p>• Saldo akan <span className="font-bold text-red-500">DIKURANGI</span></p>
                      <p>• Sisa utang akan berkurang</p>
                      <p>• Transaksi "Pembayaran Utang" akan tercatat</p>
                      <p className="text-orange-500 font-medium mt-1">⚠️ Jika transaksi dihapus dari riwayat, pembayaran akan dibatalkan</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-blue-500 mb-1">🔄 Dampak Penerimaan Piutang:</p>
                      <p>• Saldo akan <span className="font-bold text-green-500">BERTAMBAH</span></p>
                      <p>• Sisa piutang akan berkurang</p>
                      <p>• Transaksi "Penerimaan Piutang" akan tercatat</p>
                      <p className="text-orange-500 font-medium mt-1">⚠️ Jika transaksi dihapus dari riwayat, penerimaan akan dibatalkan</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Metode Pembayaran
            </label>
            <div className="dropdown-container">
              <select
                value={paymentData.method}
                onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                style={{ fontSize: '16px' }}
              >
                <option value="cash" className={isDark ? 'bg-black' : 'bg-white'}>Tunai</option>
                <option value="transfer" className={isDark ? 'bg-black' : 'bg-white'}>Transfer Bank</option>
                <option value="ewallet" className={isDark ? 'bg-black' : 'bg-white'}>E-Wallet</option>
                <option value="other" className={isDark ? 'bg-black' : 'bg-white'}>Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Catatan
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
              placeholder="Catatan pembayaran (opsional)"
              style={{ fontSize: '16px' }}
            />
          </div>

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
              disabled={isAmountExceeding || isBalanceInsufficient || paymentData.amount <= 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>{debt.type === 'debt' ? 'Bayar' : 'Terima'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;