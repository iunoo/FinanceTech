import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, Mail, Lock, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from '../store/toastStore';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { isDark } = useThemeStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast.success('Selamat datang kembali!');
      } else {
        toast.error('Email atau password salah');
      }
    } catch (error) {
      toast.error('Login gagal');
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
            Selamat Datang Kembali
          </h1>
          <p className={`opacity-70 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Masuk ke akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Belum punya akun?{' '}
            <Link 
              to="/register" 
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;