import React, { useState } from 'react';
import { X, CreditCard, AlertTriangle, Info, Calculator, CheckCircle } from 'lucide-react';
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
    notes: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsProcessing(true);

    try {
      let transactionId = '';

      if (debt.type === 'debt') {
        // UTANG: Saat bayar utang, saldo DIKURANGI (pengeluaran)
        if (wallet.balance < paymentData.amount) {
          toast.error(`❌ Saldo ${wallet.name} tidak mencukupi!\n\nSaldo saat ini: Rp ${wallet.balance.toLocaleString('id-ID')}\nDibutuhkan: Rp ${paymentData.amount.toLocaleString('id-ID')}`);
          setIsProcessing(false);
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
          description: `Bayar utang ke ${debt.name}${paymentData.notes ? ` - ${paymentData.notes}` : ''}`,
          date: new Date().toISOString().split('T')[0],
          walletId: paymentData.walletId,
          createdAt: new Date().toISOString(),
          isDebtTransaction: true,
          linkedDebtId: debt.id,
          debtTransactionType: 'payment',
          debtType: 'debt',
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
          description: `Terima piutang dari ${debt.name}${paymentData.notes ? ` - ${paymentData.notes}` : ''}`,
          date: new Date().toISOString().split('T')[0],
          walletId: paymentData.walletId,
          createdAt: new Date().toISOString(),
          isDebtTransaction: true,
          linkedDebtId: debt.id,
          debtTransactionType: 'payment',
          debtType: 'credit',
        });
      }

      // Update debt record dengan validasi di store dan link transaction
      const result = makePayment(debt.id, paymentData.amount, paymentData.walletId, 'transfer', paymentData.notes, transactionId);
      
      if (result.success) {
        // Get the generated transaction ID for display
        import('../../store/transactionStore').then(({ useTransactionStore }) => {
          const store = useTransactionStore.getState();
          const newTransaction = store.getTransactionById(transactionId);
          
          toast.success(`${result.message}\n\n📝 Transaksi ${newTransaction?.transactionId} tercatat di riwayat`);
        });
        
        onClose();
        // Reset form
        setPaymentData({
          amount: 0,
          walletId: wallets[0]?.id || '',
          notes: '',
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedWallet = getWalletById(paymentData.walletId);
  const isAmountExceeding = paymentData.amount > debt?.remainingAmount;
  const isBalanceInsufficient = debt?.type === 'debt' && selectedWallet && selectedWallet.balance < paymentData.amount;
  const isFullPayment = paymentData.amount === debt?.remainingAmount;

  if (!isOpen || !debt) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: isDark 
          ? 'rgba(0, 0, 0, 0.95)' 
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
      }}
    >
      <div 
        className="p-8 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          background: isDark 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isDark 
            ? '1px solid rgba(255, 255, 255, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 25px 50px 0 rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl ${
              debt.type === 'debt' ? 'bg-red-500/10' : 'bg-green-500/10'
            }`}>
              <CreditCard className={`w-8 h-8 ${
                debt.type === 'debt' ? 'text-red-500' : 'text-green-500'
              }`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {debt.type === 'debt' ? 'Bayar Utang' : 'Terima Piutang'}
              </h2>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Proses pembayaran {debt.type === 'debt' ? 'kepada' : 'dari'} {debt.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass-button p-3 rounded-xl hover:transform hover:scale-110 transition-all duration-200"
          >
            <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Debt Summary */}
          <div className="space-y-6">
            {/* Debt Summary Card */}
            <div className="p-6 rounded-2xl border-l-4 border-blue-500" style={{
              background: isDark 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(59, 130, 246, 0.05)',
            }}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                📋 Detail {debt.type === 'debt' ? 'Utang' : 'Piutang'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {debt.type === 'debt' ? 'Utang kepada' : 'Piutang dari'}:
                  </span>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {debt.name}
                  </span>
                </div>
                
                {debt.description && (
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                      Keterangan:
                    </span>
                    <span className={`text-sm text-right max-w-xs ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      {debt.description}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center p-4 rounded-xl" style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }}>
                    <p className={`text-xs opacity-70 mb-1 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      Jumlah Awal
                    </p>
                    <p className={`text-xl font-bold ${debt.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                      Rp {debt.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }}>
                    <p className={`text-xs opacity-70 mb-1 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      Sisa Kewajiban
                    </p>
                    <p className={`text-2xl font-bold ${debt.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                      Rp {debt.remainingAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Impact Info */}
            <div className="p-6 rounded-2xl border-l-4 border-purple-500" style={{
              background: isDark 
                ? 'rgba(147, 51, 234, 0.1)' 
                : 'rgba(147, 51, 234, 0.05)',
            }}>
              <div className="flex items-start space-x-3">
                <Info className="w-6 h-6 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className={`${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <p className="font-bold text-purple-500 mb-3 text-lg">💡 Dampak Transaksi</p>
                  {debt.type === 'debt' ? (
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Saldo akan <span className="font-bold text-red-500">DIKURANGI</span> Rp {paymentData.amount.toLocaleString('id-ID')}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Sisa utang menjadi Rp {Math.max(0, debt.remainingAmount - paymentData.amount).toLocaleString('id-ID')}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Transaksi "Pembayaran Utang" (CO-YYMMXXXX) akan tercatat</span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Saldo akan <span className="font-bold text-green-500">BERTAMBAH</span> Rp {paymentData.amount.toLocaleString('id-ID')}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Sisa piutang menjadi Rp {Math.max(0, debt.remainingAmount - paymentData.amount).toLocaleString('id-ID')}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Transaksi "Penerimaan Piutang" (CI-YYMMXXXX) akan tercatat</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    💰 Jumlah Pembayaran
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calculator className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-500'} opacity-50`} />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-500'}`}>
                      Kalkulator otomatis
                    </span>
                  </div>
                </div>
                
                <CurrencyInput
                  value={paymentData.amount}
                  onChange={(amount) => setPaymentData(prev => ({ ...prev, amount }))}
                  placeholder="0"
                  className="p-4 text-xl font-bold"
                />
                
                {/* Quick Amount Buttons */}
                <div className="mt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setPaymentData(prev => ({ ...prev, amount: Math.floor(debt.remainingAmount / 2) }))}
                    className="glass-button px-6 py-3 rounded-xl text-sm font-medium hover:transform hover:scale-105 transition-all duration-200"
                  >
                    50% (Rp {Math.floor(debt.remainingAmount / 2).toLocaleString('id-ID')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData(prev => ({ ...prev, amount: debt.remainingAmount }))}
                    className="glass-button px-6 py-3 rounded-xl text-sm font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Lunas</span>
                  </button>
                </div>

                {/* Amount Validation */}
                {isAmountExceeding && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className={`${isDark ? 'text-red-200' : 'text-red-800'}`}>
                        <p className="font-bold text-lg">❌ Pembayaran Melebihi Sisa Kewajiban!</p>
                        <p className="mt-1">Maksimal yang dapat dibayar: <span className="font-bold">Rp {debt.remainingAmount.toLocaleString('id-ID')}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {isFullPayment && !isAmountExceeding && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className={`${isDark ? 'text-green-200' : 'text-green-800'}`}>
                        <p className="font-bold text-lg">🎉 Pembayaran Penuh - Akan Lunas!</p>
                        <p className="mt-1">{debt.type === 'debt' ? 'Utang' : 'Piutang'} akan ditandai sebagai lunas setelah pembayaran ini.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Selection */}
              <div>
                <label className={`block text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {debt.type === 'debt' ? '💸 Bayar dari Dompet' : '💰 Terima ke Dompet'}
                </label>
                <WalletSelector
                  selectedWallet={paymentData.walletId}
                  onWalletChange={(walletId) => setPaymentData(prev => ({ ...prev, walletId }))}
                  showBalance={true}
                />
                
                {/* Balance Check Warning */}
                {isBalanceInsufficient && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className={`${isDark ? 'text-red-200' : 'text-red-800'}`}>
                        <p className="font-bold text-lg">❌ Saldo Tidak Mencukupi!</p>
                        <div className="mt-2 space-y-1">
                          <p>Saldo tersedia: <span className="font-bold">Rp {selectedWallet?.balance.toLocaleString('id-ID')}</span></p>
                          <p>Dibutuhkan: <span className="font-bold">Rp {paymentData.amount.toLocaleString('id-ID')}</span></p>
                          <p>Kekurangan: <span className="font-bold text-red-600">Rp {(paymentData.amount - (selectedWallet?.balance || 0)).toLocaleString('id-ID')}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  📝 Catatan Pembayaran (Opsional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className={`w-full p-4 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Tambahkan catatan untuk pembayaran ini..."
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className={`flex-1 py-4 px-6 glass-button rounded-xl font-bold text-lg transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAmountExceeding || isBalanceInsufficient || paymentData.amount <= 0 || isProcessing}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      <span>{debt.type === 'debt' ? 'Bayar Utang' : 'Terima Piutang'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;