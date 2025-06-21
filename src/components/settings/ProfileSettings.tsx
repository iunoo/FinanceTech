import React from 'react';
import { Save, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { isDark } = useThemeStore();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    updateUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
    
    toast.success('Profil berhasil diperbarui!', undefined, 4000);
  };

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <User className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Pengaturan Profil
        </h2>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            Nama Lengkap
          </label>
          <input
            type="text"
            name="name"
            defaultValue={user?.name || ''}
            className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
            placeholder="Masukkan nama lengkap Anda"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            Email
          </label>
          <input
            type="email"
            name="email"
            defaultValue={user?.email || ''}
            className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
            placeholder="Masukkan email Anda"
            style={{ fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Profil</span>
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;