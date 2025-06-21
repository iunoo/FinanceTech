import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Settings,
  LogOut,
  Wallet,
  X,
  Bell,
  Bot,
  BrainCircuit,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationCenter from './NotificationCenter';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { logout, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { getUnreadCount } = useNotificationStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [botStatus, setBotStatus] = useState(false);
  const [aiStatus, setAiStatus] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [autoShowTimeout, setAutoShowTimeout] = useState<NodeJS.Timeout | null>(null);

  const unreadCount = getUnreadCount();

  const navItems = [
    { to: '/', icon: Home, label: 'Beranda' },
    { to: '/transactions', icon: CreditCard, label: 'Transaksi' },
    { to: '/analysis', icon: TrendingUp, label: 'Analisis' },
    { to: '/debts', icon: Users, label: 'Hutang & Piutang' },
    { to: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  // Check API status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const botResponse = await fetch('/api/telegram/status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const botData = await botResponse.json();
        setBotStatus(botData.status === 'online');
        
        const aiResponse = await fetch('/api/analysis/status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const aiData = await aiResponse.json();
        setAiStatus(aiData.status === 'online');
      } catch (error) {
        setBotStatus(false);
        setAiStatus(false);
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto show/hide logic
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isCollapsed && !isOpen) {
      const timeout = setTimeout(() => {
        if (onToggleCollapse) {
          onToggleCollapse();
        }
      }, 300); // 300ms delay
      setAutoShowTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (autoShowTimeout) {
      clearTimeout(autoShowTimeout);
      setAutoShowTimeout(null);
    }
    
    // Auto hide after 2 seconds
    setTimeout(() => {
      if (!isHovered && !isCollapsed && onToggleCollapse) {
        onToggleCollapse();
      }
    }, 2000);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed md:relative
          ${isCollapsed ? 'w-20' : 'w-72'} h-full 
          glass-sidebar 
          flex flex-col 
          z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="glass-card p-2 rounded-lg">
                <Wallet className={`w-8 h-8 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    KeuanganKu
                  </h1>
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Manajemen Keuangan
                  </p>
                </div>
              )}
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="md:hidden glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>

            {/* Desktop Collapse Toggle - Clean Arrow */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:block glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              ) : (
                <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'active nav-active'
                        : ''
                    } ${isDark ? 'text-white hover:text-white' : 'text-gray-700 hover:text-gray-800'}`
                  }
                  style={{ minHeight: '44px' }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Status Indicators & Controls */}
        <div className="p-4 space-y-3">
          {/* API Status - Clean & Minimal */}
          {!isCollapsed && (
            <div className="flex items-center justify-center space-x-3">
              <div className={`status-indicator ${
                botStatus ? 'status-online' : 'status-offline'
              }`}>
                <Bot className="w-3 h-3" />
                <span className="text-xs">Bot</span>
              </div>
              <div className={`status-indicator ${
                aiStatus ? 'status-online' : 'status-offline'
              }`}>
                <BrainCircuit className="w-3 h-3" />
                <span className="text-xs">AI</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`w-full nav-item flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg glass-button transition-all duration-300 ${
              isDark ? 'text-white hover:text-white' : 'text-gray-700 hover:text-gray-800'
            }`}
            style={{ minHeight: '44px' }}
            title={isCollapsed ? 'Keluar' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </div>

      <NotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};

export default Sidebar;