import React, { useEffect, useState } from 'react';
import { X, Bell, Check, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useThemeStore } from '../store/themeStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();
  const { isDark } = useThemeStore();
  const [isVisible, setIsVisible] = useState(false);

  // Smooth animation on open/close
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-0 right-0 z-[9999] mt-16 mr-4">
      <div 
        className={`rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-out transform ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95'
        }`}
        style={{
          width: '320px',
          maxHeight: '450px',
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
        {/* Header - Fixed */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-800'}`} />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200"
            >
              <X className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>
          </div>

          {/* Action Buttons - Always Visible */}
          {notifications.length > 0 && (
            <div className="flex space-x-2 mt-3">
              <button
                onClick={markAllAsRead}
                className="glass-button px-3 py-1 rounded text-xs hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span className={isDark ? 'text-white' : 'text-gray-800'}>Tandai Semua</span>
              </button>
              <button
                onClick={clearAll}
                className="glass-button px-3 py-1 rounded text-xs hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-1 hover:bg-red-500/20"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
                <span className="text-red-500">Hapus Semua</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification List - Scrollable */}
        <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className={`w-8 h-8 mx-auto mb-2 opacity-50 ${isDark ? 'text-white' : 'text-gray-600'}`} />
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Tidak ada notifikasi
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`glass-button p-3 rounded-lg transition-all duration-300 hover:transform hover:scale-105 ${
                    !notification.read ? 'ring-1 ring-blue-500/30' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: isVisible ? 'slideInNotification 0.3s ease-out forwards' : 'none'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium ${
                          notification.type === 'success' ? 'text-green-500' :
                          notification.type === 'warning' ? 'text-orange-500' :
                          notification.type === 'error' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {notification.type === 'success' ? '✅' :
                           notification.type === 'warning' ? '⚠️' :
                           notification.type === 'error' ? '❌' : 'ℹ️'}
                        </span>
                        <span className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className={`text-xs opacity-80 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className={`text-xs opacity-60 mt-1 ${isDark ? 'text-white' : 'text-gray-500'}`}>
                        {format(new Date(notification.createdAt), 'dd/MM HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200"
                          title="Tandai sudah dibaca"
                        >
                          <Check className={`w-3 h-3 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                        title="Hapus notifikasi"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;