import React, { useState } from 'react';
import { MessageSquare, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

interface TelegramSettingsProps {
  apiKeyStatus: { telegram: boolean; openai: boolean };
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ apiKeyStatus }) => {
  const { user, updateUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const [telegramId, setTelegramId] = useState(user?.telegramId || '');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const handleTestTelegram = async () => {
    if (!telegramId) {
      toast.error('Silakan masukkan ID Telegram terlebih dahulu', undefined, 4000);
      return;
    }

    if (!apiKeyStatus.telegram) {
      toast.error('Bot Telegram tidak aktif. Pastikan token bot sudah diatur.', undefined, 6000);
      return;
    }
    
    setIsTestingTelegram(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Mengirim pesan uji coba...');

    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      toast.success('Pesan uji coba berhasil dikirim ke Telegram!', undefined, 6000);
      
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim pesan uji coba', undefined, 6000);
    } finally {
      toast.dismiss(loadingToastId);
      setIsTestingTelegram(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/10">
          <MessageSquare className="w-6 h-6 text-green-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Integrasi Telegram
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            ID Telegram
          </label>
          <input
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
            placeholder="Masukkan ID Telegram Anda"
            style={{ fontSize: '16px' }}
          />
          <p className={`text-sm mt-2 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Untuk mendapatkan ID Telegram, kirim pesan ke @userinfobot di Telegram
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleTestTelegram}
            disabled={isTestingTelegram || !apiKeyStatus.telegram}
            className={`flex-1 py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}
          >
            {isTestingTelegram ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Mengirim...</span>
              </div>
            ) : (
              'Uji Koneksi'
            )}
          </button>
          <button
            onClick={() => {
              updateUser({ telegramId });
              toast.success('ID Telegram berhasil disimpan!', undefined, 4000);
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramSettings;