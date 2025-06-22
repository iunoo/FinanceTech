import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useWalletColorStore } from '../store/walletColorStore';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { getTotalBalance } = useWalletStore();
  const { getColorForBalance } = useWalletColorStore();
  const { getUnreadCount } = useNotificationStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const totalBalance = getTotalBalance();
  const unreadCount = getUnreadCount();

  return (
    <>
      <header 
        className="m-4 mb-0 p-4 rounded-lg"
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
        <div className="flex items-center justify-between">
          {/* Left side - Quick Summary */}
          <div className="flex items-center space-x-4">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <Menu className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>

            {/* Quick Balance Summary */}
            <div className="hidden sm:block">
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Total Saldo
              </p>
              <p 
                className="text-lg font-bold"
                style={{ color: getColorForBalance(totalBalance) }}
              >
                Rp {totalBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Notification Button with Red Dot */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
                title="Notifikasi"
              >
                <Bell className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile */}
            <div className="glass-button p-2 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 ${
                isDark ? 'bg-white text-black' : 'bg-gray-800 text-white'
              }`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};

export default Header;