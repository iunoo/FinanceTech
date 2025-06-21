import React from 'react';
import { Wallet } from 'lucide-react';
import { useWalletColorStore } from '../store/walletColorStore';
import { useThemeStore } from '../store/themeStore';

interface WalletCardProps {
  wallet: any;
  isActive: boolean;
  onClick: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, isActive, onClick }) => {
  const { getColorForBalance, getGlowSettings } = useWalletColorStore();
  const { isDark } = useThemeStore();
  
  const balanceColor = getColorForBalance(wallet.balance, wallet.id);
  const glowSettings = getGlowSettings(wallet.balance, wallet.id);
  
  const isLowBalance = wallet.balance === 0;

  // Dynamic glow styles based on settings
  const getGlowStyle = () => {
    if (!glowSettings.enabled) return {};
    
    if (isLowBalance) {
      return {
        boxShadow: `0 0 15px ${glowSettings.color}`,
        animation: 'pulse-glow-red 1s ease-in-out infinite'
      };
    }
    
    return {
      boxShadow: `0 0 10px ${glowSettings.color}`,
    };
  };

  return (
    <div
      onClick={onClick}
      className={`
        wallet-card
        glass-button p-4 rounded-lg cursor-pointer 
        transition-all duration-200 ease-in-out
        hover:border-[#00CCFF] hover:shadow-lg hover:transform hover:scale-105
        ${isActive ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500' : ''}
        ${isLowBalance && glowSettings.enabled ? 'animate-pulse-border-red' : ''}
      `}
      style={{ 
        background: isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isActive 
          ? '1px solid #00CCFF' 
          : isDark 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.1)',
        ...getGlowStyle()
      }}
    >
      <div className="text-center">
        {/* Wallet Icon - Using Lucide React */}
        <div className="flex justify-center mb-3">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <Wallet className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </div>
        </div>
        
        {/* Wallet Name */}
        <div className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {wallet.name}
        </div>
        
        {/* Balance with Dynamic Color */}
        <p 
          className="text-sm font-bold transition-colors duration-300"
          style={{ color: balanceColor }}
        >
          Rp {wallet.balance.toLocaleString('id-ID')}
        </p>
        
        {/* Balance Status Indicator */}
        {isLowBalance && (
          <div className="mt-2 text-xs text-red-500 font-bold">
            ⚠️ Saldo Habis
          </div>
        )}
        {wallet.balance > 0 && wallet.balance < 50000 && (
          <div className="mt-2 text-xs text-orange-500 font-bold">
            ⚠️ Saldo Rendah
          </div>
        )}
        {wallet.balance > 100000 && (
          <div className="mt-2 text-xs text-green-500 font-bold">
            ✅ Saldo Baik
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletCard;