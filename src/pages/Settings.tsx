import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import StatusIndicator from '../components/settings/StatusIndicator';
import ApiKeySettings from '../components/settings/ApiKeySettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import TelegramSettings from '../components/settings/TelegramSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import CategorySettings from '../components/settings/CategorySettings';
import WalletColorSettings from '../components/settings/WalletColorSettings';
import WalletManager from '../components/WalletManager';

const Settings: React.FC = () => {
  const { isDark } = useThemeStore();
  const [apiKeyStatus, setApiKeyStatus] = useState({ telegram: false, openai: false });
  const [activeTab, setActiveTab] = useState('general');

  // Pengecekan status API yang benar-benar real
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Cek status Telegram Bot
        const botResponse = await fetch('/api/telegram/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const botData = await botResponse.json();
        
        // Cek status ChatGPT API
        const aiResponse = await fetch('/api/analysis/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const aiData = await aiResponse.json();
        
        setApiKeyStatus({
          telegram: botData.status === 'online',
          openai: aiData.status === 'online'
        });
      } catch (error) {
        setApiKeyStatus({ telegram: false, openai: false });
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'general', label: 'Umum' },
    { id: 'wallets', label: 'Dompet' },
    { id: 'categories', label: 'Kategori' },
    { id: 'colors', label: 'Warna Saldo' },
    { id: 'integration', label: 'Integrasi' },
    { id: 'security', label: 'Keamanan' },
  ];

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Pengaturan
      </h1>

      {/* Status Layanan */}
      <StatusIndicator apiKeyStatus={apiKeyStatus} />

      {/* Vertical Sidebar Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-4 rounded-lg">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : `glass-button ${isDark ? 'text-white' : 'text-gray-800'}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="animate-fade-in">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileSettings />
                <NotificationSettings apiKeyStatus={apiKeyStatus} />
              </div>
            )}

            {activeTab === 'wallets' && <WalletManager />}
            {activeTab === 'categories' && <CategorySettings />}
            {activeTab === 'colors' && <WalletColorSettings />}
            {activeTab === 'integration' && (
              <div className="space-y-6">
                <ApiKeySettings />
                <TelegramSettings apiKeyStatus={apiKeyStatus} />
                
                {/* Petunjuk Setup Bot Telegram - Hanya di tab Integrasi */}
                <div className="glass-card p-6 rounded-lg">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Petunjuk Setup Bot Telegram
                  </h2>
                  <div className={`space-y-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <p>Cari <code className="bg-gray-500/20 px-2 py-1 rounded">@BotFather</code> di Telegram dan buat bot baru</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <p>Salin token bot dan masukkan di pengaturan API Keys di atas</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <p>Mulai percakapan dengan bot Anda dengan mengirim <code className="bg-gray-500/20 px-2 py-1 rounded">/start</code></p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <p>Dapatkan ID Telegram Anda dengan mengirim pesan ke <code className="bg-gray-500/20 px-2 py-1 rounded">@userinfobot</code></p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                      <p>Masukkan ID Telegram Anda di pengaturan di atas dan uji koneksi</p>
                    </div>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <button className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200">
                        Konfigurasi Bot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;