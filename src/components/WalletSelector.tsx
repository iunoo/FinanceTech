import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useWalletColorStore } from '../store/walletColorStore';
import { useThemeStore } from '../store/themeStore';

interface WalletSelectorProps {
  selectedWallet: string;
  onWalletChange: (walletId: string) => void;
  showBalance?: boolean;
  excludeWallets?: string[];
  filterByBalance?: boolean; // For piutang - only show wallets with balance > 0
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ 
  selectedWallet, 
  onWalletChange, 
  showBalance = false,
  excludeWallets = [],
  filterByBalance = false
}) => {
  const { wallets, getWalletById } = useWalletStore();
  const { getColorForBalance } = useWalletColorStore();
  const { isDark } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  let availableWallets = wallets.filter(w => !excludeWallets.includes(w.id));
  
  // Filter by balance for piutang
  if (filterByBalance) {
    availableWallets = availableWallets.filter(w => w.balance > 0);
  }

  const selectedWalletData = getWalletById(selectedWallet);

  const handleWalletSelect = (walletId: string) => {
    onWalletChange(walletId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 glass-input ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}
        style={{ fontSize: '16px' }}
      >
        <div className="flex items-center space-x-3">
          <div className="text-left">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {selectedWalletData?.name || 'Pilih Dompet'}
            </p>
            {showBalance && selectedWalletData && (
              <p 
                className="text-sm font-bold"
                style={{ color: getColorForBalance(selectedWalletData.balance) }}
              >
                Rp {selectedWalletData.balance.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${
          isOpen ? 'rotate-180' : ''
        } ${isDark ? 'text-white' : 'text-gray-700'}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute top-full left-0 right-0 mt-1 rounded-lg border z-50 max-h-60 overflow-y-auto ${
            isDark 
              ? 'bg-gray-900 border-gray-700 shadow-2xl' 
              : 'bg-white border-gray-200 shadow-lg'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {availableWallets.length === 0 ? (
            <div className="p-4 text-center">
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {filterByBalance ? 'Tidak ada dompet dengan saldo mencukupi' : 'Tidak ada dompet tersedia'}
              </p>
            </div>
          ) : (
            availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => handleWalletSelect(wallet.id)}
                className={`w-full flex items-center space-x-3 p-3 transition-colors text-left ${
                  wallet.id === selectedWallet 
                    ? (isDark ? 'bg-blue-600/30 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                    : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                }`}
                style={{ fontSize: '16px' }}
              >
                <div className="text-left flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {wallet.name}
                  </p>
                  <p 
                    className="text-sm font-bold"
                    style={{ color: getColorForBalance(wallet.balance) }}
                  >
                    Rp {wallet.balance.toLocaleString('id-ID')}
                  </p>
                </div>
                {wallet.id === selectedWallet && (
                  <div className={`w-2 h-2 rounded-full ${
                    isDark ? 'bg-blue-400' : 'bg-blue-500'
                  }`} />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WalletSelector;