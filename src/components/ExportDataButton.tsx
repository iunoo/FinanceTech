import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from '../store/toastStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ExportDataButtonProps {
  startDate?: string;
  endDate?: string;
  walletId?: string;
  className?: string;
}

const ExportDataButton: React.FC<ExportDataButtonProps> = ({ 
  startDate, 
  endDate, 
  walletId,
  className = ''
}) => {
  const { transactions, getTransactionsByDateRange } = useTransactionStore();
  const { wallets, getWalletById } = useWalletStore();
  const { isDark } = useThemeStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const getFilteredTransactions = () => {
    let filteredTransactions = transactions;
    
    if (startDate && endDate) {
      filteredTransactions = getTransactionsByDateRange(startDate, endDate);
    }
    
    if (walletId) {
      filteredTransactions = filteredTransactions.filter(t => t.walletId === walletId);
    }
    
    return filteredTransactions;
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const filteredTransactions = getFilteredTransactions();
      
      // Create CSV header
      const headers = [
        'ID Transaksi',
        'Tanggal',
        'Jenis',
        'Kategori',
        'Dompet',
        'Jumlah',
        'Keterangan'
      ];
      
      // Create CSV rows
      const rows = filteredTransactions.map(transaction => {
        const wallet = getWalletById(transaction.walletId);
        return [
          transaction.transactionId,
          format(new Date(transaction.date), 'dd/MM/yyyy', { locale: id }),
          transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          transaction.category,
          wallet?.name || 'Unknown',
          transaction.amount.toString(),
          transaction.description || ''
        ];
      });
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FinanceTech_Transaksi_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data berhasil diekspor ke CSV!');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    
    try {
      const filteredTransactions = getFilteredTransactions();
      
      // Create JSON with metadata
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalTransactions: filteredTransactions.length,
          dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
          wallet: walletId ? getWalletById(walletId)?.name : 'All wallets',
          copyright: 'FinanceTech 2025, dibuat oleh iuno.in'
        },
        transactions: filteredTransactions
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FinanceTech_Transaksi_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data berhasil diekspor ke JSON!');
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className={`glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 ${className}`}
      >
        {isExporting ? (
          <>
            <Loader className={`w-4 h-4 animate-spin ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Mengekspor...</span>
          </>
        ) : (
          <>
            <Download className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Ekspor Data</span>
          </>
        )}
      </button>
      
      {showOptions && (
        <div 
          className={`absolute right-0 top-full mt-2 p-2 rounded-lg z-10 min-w-[200px] ${
            isDark 
              ? 'bg-gray-900 border border-gray-700 shadow-2xl' 
              : 'bg-white border border-gray-200 shadow-lg'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <button
            onClick={exportToCSV}
            className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Ekspor ke CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <FileText className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Ekspor ke JSON</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDataButton;