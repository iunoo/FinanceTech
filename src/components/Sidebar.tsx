import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { logout, user } = useAuthStore();
  const { isDark } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);
  const [autoExpandTimeout, setAutoExpandTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoCollapseTimeout, setAutoCollapseTimeout] = useState<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', icon: Home, label: 'Beranda' },
    { to: '/transactions', icon: CreditCard, label: 'Transaksi' },
    { to: '/analysis', icon: TrendingUp, label: 'Analisis' },
    { to: '/debts', icon: Users, label: 'Hutang & Piutang' },
    { to: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  // Clear all timeouts
  const clearAllTimeouts = () => {
    if (autoExpandTimeout) {
      clearTimeout(autoExpandTimeout);
      setAutoExpandTimeout(null);
    }
    if (autoCollapseTimeout) {
      clearTimeout(autoCollapseTimeout);
      setAutoCollapseTimeout(null);
    }
  };

  // Auto expand when collapsed and hovered
  const handleMouseEnter = () => {
    setIsHovered(true);
    clearAllTimeouts();
    
    if (isCollapsed && onToggleCollapse) {
      const timeout = setTimeout(() => {
        if (isHovered) {
          onToggleCollapse();
        }
      }, 300); // 300ms delay for expansion
      setAutoExpandTimeout(timeout);
    }
  };

  // Auto collapse when expanded and not hovered
  const handleMouseLeave = () => {
    setIsHovered(false);
    clearAllTimeouts();
    
    if (!isCollapsed && onToggleCollapse) {
      const timeout = setTimeout(() => {
        if (!isHovered && onToggleCollapse) {
          onToggleCollapse();
        }
      }, 2000); // 2 second delay for collapse
      setAutoCollapseTimeout(timeout);
    }
  };

  // Manual toggle - ONLY triggered by chevron button click
  const handleManualToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    clearAllTimeouts();
    
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

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
        ref={sidebarRef}
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
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="glass-card p-2 rounded-lg">
                <Wallet className={`w-8 h-8 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    FinanceTech
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
          </div>
        </div>

        {/* Navigation */}
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

        {/* Bottom Section */}
        <div className="p-4 space-y-3">
          {/* Desktop Collapse Toggle - Moved above logout */}
          <button
            onClick={handleManualToggle}
            className="hidden md:flex w-full items-center justify-center glass-button p-3 rounded-lg hover:transform hover:scale-105 transition-all duration-200 hover:bg-blue-500/20"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            ) : (
              <div className="flex items-center space-x-2">
                <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Collapse
                </span>
              </div>
            )}
          </button>

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
    </>
  );
};

export default Sidebar;