import React from 'react';
import { CheckCircle, AlertCircle, MessageSquare, Shield } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface StatusIndicatorProps {
  apiKeyStatus: { telegram: boolean; openai: boolean };
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ apiKeyStatus }) => {
  const { isDark } = useThemeStore();

  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Status Layanan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 glass-button rounded-lg">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Bot Telegram</span>
          </div>
          <div className={`flex items-center space-x-2 ${apiKeyStatus.telegram ? 'text-green-500' : 'text-red-500'}`}>
            {apiKeyStatus.telegram ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">
              {apiKeyStatus.telegram ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 glass-button rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>AI ChatGPT</span>
          </div>
          <div className={`flex items-center space-x-2 ${apiKeyStatus.openai ? 'text-green-500' : 'text-red-500'}`}>
            {apiKeyStatus.openai ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">
              {apiKeyStatus.openai ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </div>
      </div>
      {(!apiKeyStatus.telegram || !apiKeyStatus.openai) && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
            ⚠️ Beberapa layanan tidak aktif. Atur API Keys di bawah untuk mengaktifkan fitur.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;