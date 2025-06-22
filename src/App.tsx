import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useWalletStore } from './store/walletStore';
import { useTransactionStore } from './store/transactionStore';
import { useDebtStore } from './store/debtStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analysis from './pages/Analysis';
import Debts from './pages/Debts';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import './styles/glassmorphism.css';

function App() {
  const { isAuthenticated, checkSession, updateActivity, user } = useAuthStore();
  const { fetchWallets } = useWalletStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchDebts } = useDebtStore();
  const { isDark } = useThemeStore();

  // Check session on app load
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallets();
      fetchTransactions();
      fetchDebts();
    }
  }, [isAuthenticated, user, fetchWallets, fetchTransactions, fetchDebts]);

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity();
      }
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Set up interval to check session periodically
    const interval = setInterval(() => {
      checkSession();
    }, 60000); // Check every minute

    return () => {
      // Clean up event listeners and interval
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, updateActivity, checkSession]);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-black dark-mode' 
        : 'bg-gray-100 light-mode'
    }`}>
      <div className="aurora-bg"></div>
      <Router>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="debts" element={<Debts />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </Router>
      <ToastContainer />
    </div>
  );
}

export default App;