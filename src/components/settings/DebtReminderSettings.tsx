import React, { useState } from 'react';
import { Bell, Clock, AlertTriangle, Save, MessageSquare } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { debtReminderService, DebtReminderSettings as IDebtReminderSettings } from '../../services/debtReminderService';
import { toast } from '../../store/toastStore';
import TimePicker from '../TimePicker';

const DebtReminderSettings: React.FC = () => {
  const { isDark } = useThemeStore();
  const [settings, setSettings] = useState<IDebtReminderSettings>({
    enabled: true,
    dailyTime: '09:00',
    urgentHours: 24,
    overdueEnabled: true,
    customMessages: {}
  });

  const handleSaveSettings = () => {
    try {
      // Setup reminders for current user
      debtReminderService.setupCustomReminders('current-user', settings);
      
      // Save to localStorage for persistence
      localStorage.setItem('debt-reminder-settings', JSON.stringify(settings));
      
      toast.success('Pengaturan pengingat utang berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan pengingat');
    }
  };

  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ checked, onChange, disabled = false }) => (
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
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Pengaturan Pengingat Utang
          </h2>
          <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Kustomisasi pengingat utang dan piutang via Telegram
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 glass-button rounded-lg">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Aktifkan Pengingat Utang
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Master switch untuk semua jenis pengingat
            </p>
          </div>
          <ToggleSwitch
            checked={settings.enabled}
            onChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {/* Daily Reminder Settings */}
        <div className="p-4 glass-button rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pengingat Harian
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Waktu Pengingat Harian
              </label>
              <TimePicker
                value={settings.dailyTime}
                onChange={(time) => setSettings(prev => ({ ...prev, dailyTime: time }))}
                disabled={!settings.enabled}
                placeholder="Pilih waktu pengingat"
              />
              <p className={`text-xs mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Pengingat akan dikirim setiap hari pada waktu ini untuk utang yang akan jatuh tempo dalam 3 hari
              </p>
            </div>
          </div>
        </div>

        {/* Urgent Reminder Settings */}
        <div className="p-4 glass-button rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pengingat Mendesak
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Jam Sebelum Jatuh Tempo
              </label>
              <select
                value={settings.urgentHours}
                onChange={(e) => setSettings(prev => ({ ...prev, urgentHours: Number(e.target.value) }))}
                disabled={!settings.enabled}
                className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
              >
                <option value={6}>6 Jam</option>
                <option value={12}>12 Jam</option>
                <option value={24}>24 Jam</option>
                <option value={48}>48 Jam</option>
              </select>
              <p className={`text-xs mt-1 opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Pengingat khusus akan dikirim ketika utang akan jatuh tempo dalam waktu yang ditentukan
              </p>
            </div>
          </div>
        </div>

        {/* Overdue Reminder Settings */}
        <div className="p-4 glass-button rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-red-500" />
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Pengingat Terlambat
              </h3>
            </div>
            <ToggleSwitch
              checked={settings.overdueEnabled}
              onChange={(checked) => setSettings(prev => ({ ...prev, overdueEnabled: checked }))}
              disabled={!settings.enabled}
            />
          </div>
          
          <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Kirim pengingat untuk utang yang sudah melewati tanggal jatuh tempo (diperiksa setiap 6 jam)
          </p>
        </div>

        {/* Custom Messages */}
        <div className="p-4 glass-button rounded-lg">
          <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Pesan Kustom (Opsional)
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Pesan Pengingat Harian
              </label>
              <textarea
                value={settings.customMessages.daily || ''}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customMessages: { ...prev.customMessages, daily: e.target.value }
                }))}
                disabled={!settings.enabled}
                rows={3}
                className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                placeholder="Kosongkan untuk menggunakan pesan default"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Pesan Pengingat Mendesak
              </label>
              <textarea
                value={settings.customMessages.urgent || ''}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customMessages: { ...prev.customMessages, urgent: e.target.value }
                }))}
                disabled={!settings.enabled}
                rows={3}
                className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                placeholder="Kosongkan untuk menggunakan pesan default"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Pesan Pengingat Terlambat
              </label>
              <textarea
                value={settings.customMessages.overdue || ''}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customMessages: { ...prev.customMessages, overdue: e.target.value }
                }))}
                disabled={!settings.enabled || !settings.overdueEnabled}
                rows={3}
                className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                placeholder="Kosongkan untuk menggunakan pesan default"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Pengaturan Pengingat</span>
        </button>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium text-blue-500 mb-2">💡 Tips Pengingat Utang:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Pengingat harian cocok untuk review rutin kewajiban</li>
                <li>• Pengingat mendesak membantu mencegah keterlambatan</li>
                <li>• Pengingat terlambat membantu mengatasi utang overdue</li>
                <li>• Pastikan bot Telegram sudah aktif untuk menerima notifikasi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtReminderSettings;