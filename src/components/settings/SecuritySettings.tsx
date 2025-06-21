import React from 'react';
import { Shield } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const SecuritySettings: React.FC = () => {
  const { isDark } = useThemeStore();

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Shield className="w-6 h-6 text-red-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Pengaturan Keamanan
        </h2>
      </div>

      <div className="space-y-4">
        <button className={`w-full py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 text-left ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          Ubah Password
        </button>
        
        <button className={`w-full py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 text-left ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          Ekspor Data
        </button>
        
        <button className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 text-left">
          Hapus Akun
        </button>
      </div>
    </div>
  );
};

export default SecuritySettings;