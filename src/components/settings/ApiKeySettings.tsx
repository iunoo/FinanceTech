import React, { useState } from 'react';
import { Key, Database, Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const ApiKeySettings: React.FC = () => {
  const { isDark } = useThemeStore();
  const [apiKeys, setApiKeys] = useState({
    openaiKey: '',
    telegramToken: ''
  });
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    telegram: false
  });
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const validateApiKeys = () => {
    const errors = [];
    
    if (apiKeys.openaiKey && !apiKeys.openaiKey.startsWith('sk-')) {
      errors.push('OpenAI API key harus dimulai dengan "sk-"');
    }
    
    if (apiKeys.telegramToken && !/^\d+:[A-Za-z0-9_-]+$/.test(apiKeys.telegramToken)) {
      errors.push('Format Telegram Bot Token tidak valid');
    }
    
    return errors;
  };

  const handleSaveApiKeys = async () => {
    const validationErrors = validateApiKeys();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error, index) => 
        toast.error(error, undefined, 6000)
      );
      return;
    }

    if (!apiKeys.openaiKey && !apiKeys.telegramToken) {
      toast.error('Minimal satu API key harus diisi', undefined, 4000);
      return;
    }

    setIsSavingKeys(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Menyimpan API Keys...');

    try {
      // Simulate API call for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      toast.success('API Keys berhasil disimpan! Layanan akan aktif dalam beberapa detik.', undefined, 6000);
      
      // Clear the input fields
      setApiKeys({ openaiKey: '', telegramToken: '' });
      
      // Refresh status setelah 3 detik
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan API Keys', undefined, 6000);
    } finally {
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      setIsSavingKeys(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Key className="w-6 h-6 text-purple-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Konfigurasi API Keys
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            OpenAI API Key (GPT-4o Mini)
          </label>
          <div className="relative">
            <input
              type={showApiKeys.openai ? "text" : "password"}
              value={apiKeys.openaiKey}
              onChange={(e) => setApiKeys(prev => ({ ...prev, openaiKey: e.target.value }))}
              className={`w-full p-3 pr-12 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
              placeholder="sk-..."
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowApiKeys(prev => ({ ...prev, openai: !prev.openai }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 glass-button p-1 rounded"
            >
              {showApiKeys.openai ? (
                <EyeOff className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              ) : (
                <Eye className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              )}
            </button>
          </div>
          <p className={`text-sm mt-2 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Dapatkan API key dari <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI Platform</a>
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            Telegram Bot Token
          </label>
          <div className="relative">
            <input
              type={showApiKeys.telegram ? "text" : "password"}
              value={apiKeys.telegramToken}
              onChange={(e) => setApiKeys(prev => ({ ...prev, telegramToken: e.target.value }))}
              className={`w-full p-3 pr-12 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
              placeholder="1234567890:ABC..."
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowApiKeys(prev => ({ ...prev, telegram: !prev.telegram }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 glass-button p-1 rounded"
            >
              {showApiKeys.telegram ? (
                <EyeOff className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              ) : (
                <Eye className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              )}
            </button>
          </div>
          <p className={`text-sm mt-2 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Dapatkan token dari <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@BotFather</a> di Telegram
          </p>
        </div>

        <button
          onClick={handleSaveApiKeys}
          disabled={isSavingKeys || (!apiKeys.openaiKey && !apiKeys.telegramToken)}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSavingKeys ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              <span>Simpan API Keys</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ApiKeySettings;