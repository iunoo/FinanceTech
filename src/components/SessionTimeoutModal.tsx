import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { sessionUtils } from '../utils/security';

interface SessionTimeoutModalProps {
  warningTime?: number; // Time in ms before session expires to show warning
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ 
  warningTime = 5 * 60 * 1000 // 5 minutes by default
}) => {
  const { logout, isAuthenticated, lastActivity, updateActivity } = useAuthStore();
  const { isDark } = useThemeStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionTimeout = () => {
      const timeElapsed = Date.now() - lastActivity;
      const timeRemaining = sessionUtils.SESSION_TIMEOUT - timeElapsed;
      
      if (timeRemaining <= warningTime) {
        setShowWarning(true);
        setTimeLeft(Math.max(0, timeRemaining));
      } else {
        setShowWarning(false);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkSessionTimeout, 10000);
    
    // Also check immediately
    checkSessionTimeout();

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, warningTime]);

  // Update countdown timer
  useEffect(() => {
    if (!showWarning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timer);
          logout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning, logout]);

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    updateActivity();
    setShowWarning(false);
  };

  if (!showWarning || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-6 rounded-lg w-full max-w-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-orange-500/10">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Sesi Akan Berakhir
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Anda akan keluar dalam {formatTimeLeft()}
            </p>
          </div>
        </div>
        
        <p className={`mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Untuk alasan keamanan, sesi Anda akan berakhir karena tidak ada aktivitas. Apakah Anda ingin tetap masuk?
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={logout}
            className="flex-1 py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <LogOut className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Keluar</span>
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200"
          >
            Lanjutkan Sesi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;