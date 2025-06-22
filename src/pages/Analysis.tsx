import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { Brain, Calendar, TrendingUp, DollarSign, RefreshCw, Download } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useThemeStore } from '../store/themeStore';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from '../store/toastStore';
import ExportDataButton from '../components/ExportDataButton';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Analysis: React.FC = () => {
  const { transactions, getTransactionsByCategory, getTotalIncome, getTotalExpenses } = useTransactionStore();
  const { isDark } = useThemeStore();
  const [timeRange, setTimeRange] = useState('month');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        const quarterStart = new Date(now);
        quarterStart.setMonth(now.getMonth() - 3);
        return { start: quarterStart, end: now };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();
  const categoryData = getTransactionsByCategory();
  const totalIncome = getTotalIncome(start.toISOString(), end.toISOString());
  const totalExpenses = getTotalExpenses(start.toISOString(), end.toISOString());

  // Pie Chart Data
  const pieData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  // Line Chart Data (Last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      months.push(format(date, 'MMM yyyy', { locale: id }));
      incomeData.push(getTotalIncome(monthStart.toISOString(), monthEnd.toISOString()));
      expenseData.push(getTotalExpenses(monthStart.toISOString(), monthEnd.toISOString()));
    }

    return { months, incomeData, expenseData };
  };

  const { months, incomeData, expenseData } = getMonthlyData();

  const lineData = {
    labels: months,
    datasets: [
      {
        label: 'Pemasukan',
        data: incomeData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Pengeluaran',
        data: expenseData,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#ffffff' : '#374151',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#ffffff' : '#374151',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        ticks: {
          color: isDark ? '#ffffff' : '#374151',
          callback: function(value) {
            return 'Rp ' + value.toLocaleString('id-ID');
          }
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const generateAIAnalysis = async () => {
    setIsLoadingAnalysis(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Menganalisis data keuangan dengan AI...');

    try {
      // Since we don't have a real backend, we'll simulate an AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a simple analysis based on the data
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0';
      
      // Get top categories
      const topCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      
      let analysis = `📊 **Analisis Keuangan ${timeRange === 'week' ? 'Mingguan' : 
                                             timeRange === 'month' ? 'Bulanan' : 
                                             timeRange === 'quarter' ? '3 Bulan Terakhir' : 'Tahunan'}**\n\n`;
      
      analysis += `💰 **Ringkasan:**\n`;
      analysis += `- Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}\n`;
      analysis += `- Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}\n`;
      analysis += `- Saldo Bersih: Rp ${(totalIncome - totalExpenses).toLocaleString('id-ID')}\n`;
      analysis += `- Tingkat Tabungan: ${savingsRate}%\n\n`;
      
      analysis += `🎯 **Wawasan Utama:**\n`;
      if (topCategories.length > 0) {
        analysis += `- Kategori pengeluaran terbesar adalah ${topCategories[0][0]} (Rp ${topCategories[0][1].toLocaleString('id-ID')})\n`;
      } else {
        analysis += `- Tidak ada data pengeluaran tersedia\n`;
      }
      
      if (totalIncome - totalExpenses >= 0) {
        analysis += `- ✅ Anda berhasil mempertahankan saldo positif periode ini\n`;
      } else {
        analysis += `- ⚠️ Pengeluaran Anda melebihi pemasukan\n`;
      }
      
      analysis += `- ${Object.keys(categoryData).length} kategori pengeluaran berbeda tercatat\n\n`;
      
      analysis += `💡 **Rekomendasi:**\n`;
      if (totalIncome - totalExpenses < 0) {
        analysis += `- 🚨 Fokus pada pengurangan pengeluaran untuk menghindari defisit\n`;
      } else {
        analysis += `- 🎉 Pertahankan arus kas positif yang baik!\n`;
      }
      
      if (topCategories.length > 0 && topCategories[0][1] > totalExpenses * 0.3) {
        analysis += `- Pertimbangkan untuk mengurangi pengeluaran di kategori ${topCategories[0][0]}\n`;
      } else {
        analysis += `- Distribusi pengeluaran Anda terlihat seimbang\n`;
      }
      
      analysis += `- Siapkan transfer tabungan otomatis\n`;
      analysis += `- Lacak pengeluaran harian lebih ketat\n`;
      analysis += `- Tinjau dan optimalkan langganan berulang\n\n`;
      
      analysis += `📈 **Langkah Selanjutnya:**\n`;
      analysis += `- Buat anggaran berdasarkan kategori\n`;
      analysis += `- Siapkan dana darurat jika belum ada\n`;
      analysis += `- Pertimbangkan peluang investasi untuk dana surplus\n`;
      
      setAiAnalysis(analysis);
      toast.success('Analisis AI berhasil diperbarui!');
      toast.dismiss(loadingToastId);
    } catch (error) {
      setAiAnalysis('Terjadi kesalahan saat menghasilkan analisis. Silakan coba lagi nanti.');
      toast.error('Terjadi kesalahan saat menghasilkan analisis');
      toast.dismiss(loadingToastId);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      generateAIAnalysis();
    }
  }, [timeRange, transactions.length]);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Analisis Keuangan
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-500'} opacity-50`} />
            <div className="dropdown-container">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`px-4 py-2 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                style={{ fontSize: '16px' }}
              >
                <option value="week" className={isDark ? 'bg-black' : 'bg-white'}>Minggu Terakhir</option>
                <option value="month" className={isDark ? 'bg-black' : 'bg-white'}>Bulan Ini</option>
                <option value="quarter" className={isDark ? 'bg-black' : 'bg-white'}>3 Bulan Terakhir</option>
                <option value="year" className={isDark ? 'bg-black' : 'bg-white'}>Tahun Ini</option>
              </select>
            </div>
          </div>
          
          <ExportDataButton 
            startDate={start.toISOString()}
            endDate={end.toISOString()}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Total Pemasukan
              </p>
              <p className={`text-2xl font-bold text-green-500 mt-1`}>
                Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Total Pengeluaran
              </p>
              <p className={`text-2xl font-bold text-red-500 mt-1`}>
                Rp {totalExpenses.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <TrendingUp className="w-6 h-6 text-red-500 transform rotate-180" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Saldo Bersih
              </p>
              <p className={`text-2xl font-bold mt-1 ${
                totalIncome - totalExpenses >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                Rp {(totalIncome - totalExpenses).toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              totalIncome - totalExpenses >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                totalIncome - totalExpenses >= 0 ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <div className="glass-card p-6 rounded-lg">
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Kategori Pengeluaran
          </h2>
          {Object.keys(categoryData).length > 0 ? (
            <div className="h-64">
              <Pie data={pieData} options={{ ...chartOptions, maintainAspectRatio: false }} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Tidak ada data pengeluaran tersedia
              </p>
            </div>
          )}
        </div>

        {/* Income vs Expenses Trend */}
        <div className="glass-card p-6 rounded-lg">
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Tren 6 Bulan Terakhir
          </h2>
          <div className="h-64">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Analisis Keuangan AI (GPT-4o Mini)
            </h2>
          </div>
          <button
            onClick={generateAIAnalysis}
            disabled={isLoadingAnalysis}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
            <span className={isDark ? 'text-white' : 'text-gray-800'}>
              {isLoadingAnalysis ? 'Menganalisis...' : 'Perbarui Analisis'}
            </span>
          </button>
        </div>
        
        <div className={`prose max-w-none ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {isLoadingAnalysis ? (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p>Menganalisis data keuangan Anda dengan AI...</p>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-sans leading-relaxed">
              {aiAnalysis || 'Tidak ada analisis tersedia. Tambahkan beberapa transaksi untuk memulai!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;