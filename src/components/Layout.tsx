import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SessionTimeoutModal from './SessionTimeoutModal';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useTransactionStore } from '../store/transactionStore';
import { useDebtStore } from '../store/debtStore';
import { useCategoryStore } from '../store/categoryStore';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuthStore();
  const { fetchWallets } = useWalletStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchDebts } = useDebtStore();
  const { fetchCategories } = useCategoryStore();

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchTransactions();
      fetchDebts();
      fetchCategories();
    }
  }, [user, fetchWallets, fetchTransactions, fetchDebts, fetchCategories]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <SessionTimeoutModal warningTime={5 * 60 * 1000} />
    </div>
  );
};

export default Layout;