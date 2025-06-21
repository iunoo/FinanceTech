import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useThemeStore } from '../../store/themeStore';

const ExpensePatternAnalysis: React.FC = () => {
  const { expensePatterns, analyzeExpensePatterns, getCategoryInsights } = useAnalyticsStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    analyzeExpensePatterns();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-500';
      case 'decreasing':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'Meningkat';
      case 'decreasing':
        return 'Menurun';
      default:
        return 'Stabil';
    }
  };

  const getInsightMessage = (pattern: any) => {
    if (pattern.trend === 'increasing') {
      return `Pengeluaran ${pattern.category} meningkat. Prediksi bulan depan: Rp ${pattern.prediction.toLocaleString('id-ID')}`;
    } else if (pattern.trend === 'decreasing') {
      return `Bagus! Pengeluaran ${pattern.category} menurun. Terus pertahankan!`;
    } else {
      return `Pengeluaran ${pattern.category} stabil dengan rata-rata Rp ${pattern.averageAmount.toLocaleString('id-ID')}`;
    }
  };

  if (expensePatterns.length === 0) {
    return (
      <div className="glass-card p-6 rounded-lg">
        <div className="text-center py-8">
          <Target className={`w-16 h-16 mx-auto mb-4 opacity-50 ${isDark ? 'text-white' : 'text-gray-600'}`} />
          <p className={`text-lg opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Belum ada data untuk analisis pola
          </p>
          <p className={`text-sm opacity-50 mt-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Tambahkan lebih banyak transaksi untuk melihat pola pengeluaran
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Target className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Analisis Pola Pengeluaran
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Insight otomatis berdasarkan riwayat transaksi Anda
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Kategori Dianalisis
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {expensePatterns.length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Tren Meningkat
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {expensePatterns.filter(p => p.trend === 'increasing').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Tren Menurun
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {expensePatterns.filter(p => p.trend === 'decreasing').length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 Detail Pola per Kategori
        </h3>

        <div className="space-y-4">
          {expensePatterns
            .sort((a, b) => b.averageAmount - a.averageAmount)
            .map((pattern, index) => (
            <div key={pattern.category} className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    pattern.trend === 'increasing' ? 'bg-red-500/20' :
                    pattern.trend === 'decreasing' ? 'bg-green-500/20' : 'bg-blue-500/20'
                  }`}>
                    {getTrendIcon(pattern.trend)}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {pattern.category}
                    </h4>
                    <p className={`text-sm ${getTrendColor(pattern.trend)}`}>
                      Tren: {getTrendText(pattern.trend)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Frekuensi
                  </p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {pattern.frequency}x
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Rata-rata
                  </p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Rp {pattern.averageAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Terakhir
                  </p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Rp {pattern.lastAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    Prediksi
                  </p>
                  <p className={`text-xl font-bold ${getTrendColor(pattern.trend)}`}>
                    Rp {pattern.prediction.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Insight Message */}
              <div className={`p-4 rounded-lg border-l-4 ${
                pattern.trend === 'increasing' ? 'border-red-500 bg-red-500/5' :
                pattern.trend === 'decreasing' ? 'border-green-500 bg-green-500/5' : 'border-blue-500 bg-blue-500/5'
              }`}>
                <div className="flex items-start space-x-3">
                  {pattern.trend === 'increasing' && <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    💡 <strong>Insight:</strong> {getInsightMessage(pattern)}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {pattern.trend === 'increasing' && (
                <div className="mt-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className={`text-sm font-medium text-orange-500 mb-2`}>
                    🎯 Rekomendasi:
                  </p>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <li>• Tinjau pengeluaran {pattern.category} secara detail</li>
                    <li>• Cari alternatif yang lebih hemat</li>
                    <li>• Buat anggaran khusus untuk kategori ini</li>
                    <li>• Monitor perkembangan bulan depan</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensePatternAnalysis;