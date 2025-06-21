import React from 'react';
import { useThemeStore } from '../../../store/themeStore';

interface WalletSelectionGridProps {
  wallets: any[];
  selectedWallets: string[];
  onSelectionChange: (wallets: string[]) => void;
}

const WalletSelectionGrid: React.FC<WalletSelectionGridProps> = ({
  wallets,
  selectedWallets,
  onSelectionChange
}) => {
  const { isDark } = useThemeStore();

  const toggleWalletSelection = (walletId: string) => {
    const newSelection = selectedWallets.includes(walletId) 
      ? selectedWallets.filter(id => id !== walletId)
      : [...selectedWallets, walletId];
    onSelectionChange(newSelection);
  };

  const selectAllWallets = () => {
    onSelectionChange(wallets.map(w => w.id));
  };

  const clearWalletSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="mb-8">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Pilih Dompet yang Akan Diterapkan
      </h3>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={selectAllWallets}
          className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-sm"
        >
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Pilih Semua</span>
        </button>
        <button
          onClick={clearWalletSelection}
          className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-sm"
        >
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Hapus Pilihan</span>
        </button>
        <span className={`text-sm px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500`}>
          {selectedWallets.length} dompet dipilih
        </span>
      </div>

      {/* Responsive Wallet Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {wallets.map((wallet) => (
          <label 
            key={wallet.id} 
            className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
              selectedWallets.includes(wallet.id) 
                ? 'bg-blue-500/20 border-2 border-blue-500' 
                : 'glass-button border-2 border-transparent'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedWallets.includes(wallet.id)}
              onChange={() => toggleWalletSelection(wallet.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {wallet.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default WalletSelectionGrid;