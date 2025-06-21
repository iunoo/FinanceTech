import React from 'react';
import { X } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useThemeStore } from '../store/themeStore';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  const { isDark } = useThemeStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            glass-card p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out
            ${toast.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            ${toast.type === 'success' ? 'border-l-4 border-green-500' : ''}
            ${toast.type === 'error' ? 'border-l-4 border-red-500' : ''}
            ${toast.type === 'info' ? 'border-l-4 border-blue-500' : ''}
            ${toast.type === 'warning' ? 'border-l-4 border-orange-500' : ''}
          `}
          style={{
            background: isDark 
              ? 'rgba(0, 0, 0, 0.95)' 
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: isDark 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm
                ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' : ''}
                ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : ''}
                ${toast.type === 'info' ? 'bg-blue-500/20 text-blue-500' : ''}
                ${toast.type === 'warning' ? 'bg-orange-500/20 text-orange-500' : ''}
              `}>
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'info' && 'i'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'loading' && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  {toast.message}
                </p>
                {toast.description && (
                  <p className={`text-xs mt-1 opacity-70 ${
                    isDark ? 'text-white' : 'text-gray-600'
                  }`}>
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`
                ml-2 p-1 rounded-lg transition-colors hover:bg-white/10
                ${isDark ? 'text-white' : 'text-gray-700'}
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress bar for auto-dismiss */}
          {toast.duration > 0 && (
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ease-linear ${
                  toast.type === 'success' ? 'bg-green-500' : 
                  toast.type === 'error' ? 'bg-red-500' : 
                  toast.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{
                  width: '100%',
                  animation: `shrink ${toast.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;