import React, { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

interface NotificationSettingsProps {
  apiKeyStatus: { telegram: boolean; openai: boolean };
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ apiKeyStatus }) => {
  const { isDark } = useThemeStore();
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: true,
    monthly: true,
    debtReminders: true,
  });

  const handleSaveNotifications = () => {
    toast.success('Pengaturan notifikasi berhasil disimpan!', undefined, 4000);
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full peer transition-all duration-300 ${
        checked 
          ? 'bg-green-500' 
          : isDark ? 'bg-gray-600' : 'bg-gray-300'
      } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
    </label>
  );

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Bell className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Pengaturan Notifikasi
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Laporan Harian
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Terima ringkasan keuangan harian
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.daily}
            onChange={(checked) => setNotifications(prev => ({ ...prev, daily: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Laporan Mingguan
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Terima ringkasan keuangan mingguan
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.weekly}
            onChange={(checked) => setNotifications(prev => ({ ...prev, weekly: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Laporan Bulanan
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Terima ringkasan keuangan bulanan
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.monthly}
            onChange={(checked) => setNotifications(prev => ({ ...prev, monthly: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pengingat Hutang
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Dapatkan notifikasi 3 hari sebelum jatuh tempo
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.debtReminders}
            onChange={(checked) => setNotifications(prev => ({ ...prev, debtReminders: checked }))}
            disabled={!apiKeyStatus.telegram}
          />
        </div>

        {!apiKeyStatus.telegram && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
              ⚠️ Pengingat hutang memerlukan Bot Telegram aktif
            </p>
          </div>
        )}

        <button
          onClick={handleSaveNotifications}
          className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Notifikasi</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;