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
  const { getColorForBalance, getGlowSettings, getRangeInfo } = useWalletColorStore();
  const { isDark } = useThemeStore();
  
  const balanceColor = getColorForBalance(wallet.balance, wallet.id);
  const glowSettings = getGlowSettings(wallet.balance, wallet.id);
  const rangeInfo = getRangeInfo(wallet.balance, wallet.id);
  
  const isLowBalance = wallet.balance <= 50000;
  const isZeroBalance = wallet.balance === 0;

  // Dynamic glow styles for WALLET CARD (not text)
  const getCardGlowStyle = () => {
    if (!glowSettings.enabled) return {};
    
    if (isZeroBalance) {
      return {
        boxShadow: `0 0 20px ${glowSettings.color}, 0 0 40px ${glowSettings.color}30`,
        animation: 'pulse-glow-red 2s ease-in-out infinite'
      };
    }
    
    if (isLowBalance) {
      return {
        boxShadow: `0 0 15px ${glowSettings.color}, 0 0 30px ${glowSettings.color}20`,
        animation: 'pulse-glow-orange 3s ease-in-out infinite'
      };
    }
    
    // High balance glow
    if (wallet.balance > 500000) {
      return {
        boxShadow: `0 0 12px ${glowSettings.color}, 0 0 25px ${glowSettings.color}15`,
        animation: wallet.balance > 1000000 ? 'pulse-glow-blue 4s ease-in-out infinite' : 'pulse-glow-green 4s ease-in-out infinite'
      };
    }
    
    return {};
  };

  // Dynamic border animation for critical states
  const getBorderAnimation = () => {
    if (!glowSettings.enabled) return '';
    
    if (isZeroBalance) {
      return 'animate-pulse-border-red';
    }
    if (isLowBalance) {
      return 'animate-pulse-border-orange';
    }
    if (wallet.balance > 500000 && wallet.balance <= 1000000) {
      return 'animate-pulse-border-green';
    }
    if (wallet.balance > 1000000) {
      return 'animate-pulse-border-blue';
    }
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`
        wallet-card
        glass-button p-4 rounded-lg cursor-pointer 
        transition-all duration-200 ease-in-out
        hover:border-[#00CCFF] hover:shadow-lg hover:transform hover:scale-105
        ${getBorderAnimation()}
      `}
      style={{ 
        background: isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isActive 
          ? '1px solid #00CCFF' 
          : `1px solid ${glowSettings.enabled ? glowSettings.color : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
        ...getCardGlowStyle()
      }}
    >
      <div className="text-center">
        {/* Wallet Icon */}
        <div className="flex justify-center mb-3">
          <div className={`p-2 rounded-lg transition-all duration-300 ${
            isDark ? 'bg-white/10' : 'bg-gray-100'
          } ${isZeroBalance && glowSettings.enabled ? 'animate-bounce-subtle' : ''}`}>
            <Wallet className={`w-6 h-6 transition-colors duration-300 ${
              isZeroBalance ? 'text-red-500' : 
              isLowBalance ? 'text-orange-500' : 
              isDark ? 'text-white' : 'text-gray-700'
            }`} />
          </div>
        </div>
        
        {/* Wallet Name */}
        <div className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          {wallet.name}
        </div>
        
        {/* Balance with Dynamic Color - Fixed to use balanceColor */}
        <p 
          className={`text-sm font-bold transition-all duration-300 ${
            isZeroBalance && glowSettings.enabled ? 'animate-pulse' : ''
          }`}
          style={{ color: balanceColor }}
        >
          Rp {wallet.balance.toLocaleString('id-ID')}
        </p>
        
        {/* Balance Status Indicator - Fixed to use rangeInfo.label */}
        {rangeInfo && (
          <div className="mt-2 text-xs font-bold" style={{ color: balanceColor }}>
            {rangeInfo.icon === 'warning' && '⚠️'}
            {rangeInfo.icon === 'check' && '✅'}
            {rangeInfo.icon === 'x' && '🚨'}
            {rangeInfo.icon === 'fire' && '🔥'}
            {rangeInfo.icon === 'star' && '⭐'}
            {' '}{rangeInfo.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletCard;