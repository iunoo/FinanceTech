import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
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
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();

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