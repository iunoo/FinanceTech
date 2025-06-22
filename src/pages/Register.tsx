import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus, Mail, Lock, User, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from '../store/toastStore';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuthStore();
  const { initializeDefaultWallets } = useWalletStore();
  const { isDark } = useThemeStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const success = await registerUser(data.name, data.email, data.password);
      if (success) {
        // Initialize default wallets for new user
        initializeDefaultWallets();
        
        toast.success('Akun berhasil dibuat!');
        navigate('/'); // Redirect to dashboard
      } else {
        toast.error('Email sudah terdaftar');
      }
    } catch (error) {
      toast.error('Pendaftaran gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-lg w-full max-w-md float-animation">
        <div className="text-center mb-8">
          <div className="glass-card p-4 rounded-lg inline-block mb-4">
            <Wallet className={`w-12 h-12 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Buat Akun Baru
          </h1>
          <p className={`opacity-70 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Mulai kelola keuangan Anda hari ini
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Nama Lengkap
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-white opacity-50' : 'text-gray-500'
              }`} />
              <input
                type="text"
                {...register('name', { 
                  required: 'Nama wajib diisi',
                  minLength: {
                    value: 2,
                    message: 'Nama minimal 2 karakter'
                  }
                })}
                className={`w-full pl-10 pr-4 py-3 glass-input ${
                  isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-white opacity-50' : 'text-gray-500'
              }`} />
              <input
                type="email"
                {...register('email', { 
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Format email tidak valid'
                  }
                })}
                className={`w-full pl-10 pr-4 py-3 glass-input ${
                  isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Masukkan email Anda"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-white opacity-50' : 'text-gray-500'
              }`} />
              <input
                type="password"
                {...register('password', { 
                  required: 'Password wajib diisi',
                  minLength: {
                    value: 6,
                    message: 'Password minimal 6 karakter'
                  }
                })}
                className={`w-full pl-10 pr-4 py-3 glass-input ${
                  isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Masukkan password Anda"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-white opacity-50' : 'text-gray-500'
              }`} />
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Konfirmasi password wajib diisi',
                  validate: value => value === password || 'Password tidak cocok'
                })}
                className={`w-full pl-10 pr-4 py-3 glass-input ${
                  isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Konfirmasi password Anda"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Buat Akun</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Sudah punya akun?{' '}
            <Link 
              to="/login" 
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;