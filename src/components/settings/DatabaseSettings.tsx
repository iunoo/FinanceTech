import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Download, Upload, Trash2, Settings, BarChart3, Clock } from 'lucide-react';
import { useDatabaseStore } from '../../store/databaseStore';
import { useCacheStore } from '../../store/cacheStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const DatabaseSettings: React.FC = () => {
  const { 
    stats, 
    isOptimizing, 
    lastBackup, 
    optimizeDatabase, 
    createBackup, 
    cleanupOldData, 
    rebuildIndexes,
    getStats 
  } = useDatabaseStore();
  const { 
    cache, 
    stats: cacheStats, 
    clear: clearCache, 
    cleanup: cleanupCache, 
    getStats: getCacheStats 
  } = useCacheStore();
  const { isDark } = useThemeStore();
  const [cleanupDays, setCleanupDays] = useState(90);

  useEffect(() => {
    // Update stats on component mount
    getStats();
    getCacheStats();
  }, []);

  const handleOptimizeDatabase = async () => {
    const result = await optimizeDatabase();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleCreateBackup = async () => {
    const result = await createBackup();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleCleanupOldData = async () => {
    if (window.confirm(`Hapus data yang lebih lama dari ${cleanupDays} hari?`)) {
      const result = await cleanupOldData(cleanupDays);
      if (result.success) {
        toast.success(`${result.message}. ${result.deletedCount} item dihapus.`);
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleRebuildIndexes = async () => {
    const result = await rebuildIndexes();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Hapus semua cache? Ini akan memperlambat aplikasi sementara.')) {
      clearCache();
      toast.success('Cache berhasil dibersihkan');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Database Statistics */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Statistik Database
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Informasi dan optimasi database lokal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Total Transaksi
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {stats.totalTransactions.toLocaleString('id-ID')}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Total Utang/Piutang
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {stats.totalDebts.toLocaleString('id-ID')}
                </p>
              </div>
              <Database className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Total Dompet
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {stats.totalWallets.toLocaleString('id-ID')}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Ukuran Data
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {formatBytes(stats.dataSize)}
                </p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Terakhir Dioptimasi
              </p>
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {formatDate(stats.lastOptimized)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.indexedFields.map((field) => (
                <span 
                  key={field}
                  className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-medium"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-green-500/10">
            <RefreshCw className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Statistik Cache
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Performa dan penggunaan cache aplikasi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Cache Entries
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {cacheStats.totalEntries}
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Hit Rate
                </p>
                <p className={`text-2xl font-bold text-green-500`}>
                  {cacheStats.hitRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Total Hits
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {cacheStats.totalHits.toLocaleString('id-ID')}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  Memory Usage
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {formatBytes(cacheStats.memoryUsage)}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Database Operations */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Operasi Database
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Optimization */}
          <div className="space-y-4">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Optimasi & Maintenance
            </h4>
            
            <button
              onClick={handleOptimizeDatabase}
              disabled={isOptimizing}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Mengoptimasi...</span>
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5" />
                  <span>Optimasi Database</span>
                </>
              )}
            </button>

            <button
              onClick={handleRebuildIndexes}
              className="w-full py-3 px-4 glass-button rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Database className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Rebuild Index</span>
            </button>

            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Number(e.target.value))}
                min="1"
                max="365"
                className={`flex-1 p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="Hari"
              />
              <button
                onClick={handleCleanupOldData}
                className="px-4 py-3 glass-button rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className={isDark ? 'text-white' : 'text-gray-800'}>Cleanup</span>
              </button>
            </div>
          </div>

          {/* Backup & Cache */}
          <div className="space-y-4">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Backup & Cache
            </h4>
            
            <button
              onClick={handleCreateBackup}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Buat Backup</span>
            </button>

            <button
              onClick={handleClearCache}
              className="w-full py-3 px-4 glass-button rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Clear Cache</span>
            </button>

            <button
              onClick={cleanupCache}
              className="w-full py-3 px-4 glass-button rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Trash2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Cleanup Cache</span>
            </button>

            {lastBackup && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <strong>Backup Terakhir:</strong><br />
                  {formatDate(lastBackup)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          💡 Tips Performa
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium">Optimasi Rutin</p>
              <p className="opacity-70">Jalankan optimasi database setiap bulan untuk performa terbaik</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <RefreshCw className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium">Cache Management</p>
              <p className="opacity-70">Cache otomatis dibersihkan setiap 10 menit untuk menghemat memori</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Download className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium">Backup Berkala</p>
              <p className="opacity-70">Buat backup data secara berkala untuk mencegah kehilangan data</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Trash2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium">Cleanup Data Lama</p>
              <p className="opacity-70">Hapus data lama yang tidak diperlukan untuk menghemat ruang penyimpanan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSettings;