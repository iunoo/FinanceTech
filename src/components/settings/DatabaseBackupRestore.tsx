import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Database, Clock, Check, AlertTriangle } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const DatabaseBackupRestore: React.FC = () => {
  const { isDark } = useThemeStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Fetch backup history
  const fetchBackupHistory = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await fetch('/api/settings/database/backups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      } else {
        console.error('Failed to fetch backup history');
      }
    } catch (error) {
      console.error('Error fetching backup history:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Membuat backup database...');
    
    try {
      const response = await fetch('/api/settings/database/backup', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal membuat backup database');
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'financeapp-backup.gz';
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Backup database berhasil diunduh!', undefined, 6000);
      fetchBackupHistory();
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Gagal mengunduh backup database', undefined, 6000);
    } finally {
      toast.dismiss(loadingToastId);
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.gz')) {
        toast.error('File harus berformat .gz (MongoDB backup)');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar (maksimal 50MB)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadBackup = async () => {
    if (!selectedFile) {
      toast.error('Pilih file backup terlebih dahulu');
      return;
    }
    
    // Confirm restore
    if (!window.confirm(
      '⚠️ PERINGATAN: Memulihkan database akan mengganti SEMUA data saat ini dengan data dari backup!\n\n' +
      'Pastikan Anda memiliki backup data saat ini sebelum melanjutkan.\n\n' +
      'Lanjutkan pemulihan database?'
    )) {
      return;
    }
    
    setIsUploading(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Memulihkan database dari backup...');
    
    try {
      const formData = new FormData();
      formData.append('backupFile', selectedFile);
      
      const response = await fetch('/api/settings/database/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memulihkan database');
      }
      
      toast.success('Database berhasil dipulihkan dari backup!', undefined, 6000);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('backup-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      fetchBackupHistory();
      
      // Reload application after short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(`Gagal memulihkan database: ${error.message}`, undefined, 6000);
    } finally {
      toast.dismiss(loadingToastId);
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Database className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Backup & Restore Database
          </h2>
          <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Unduh atau pulihkan data aplikasi Anda
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Download Backup */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Download Backup
            </h3>
          </div>
          
          <p className={`mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Unduh backup database untuk menyimpan data Anda secara lokal. Backup mencakup semua transaksi, dompet, kategori, dan pengaturan.
          </p>
          
          <button
            onClick={handleDownloadBackup}
            disabled={isDownloading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Membuat Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Backup Database</span>
              </>
            )}
          </button>
        </div>

        {/* Upload & Restore */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Upload className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Restore dari Backup
            </h3>
          </div>
          
          <div className="p-4 mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <p className="font-bold text-orange-500 mb-1">⚠️ Peringatan:</p>
                <p>Memulihkan database akan <span className="font-bold">mengganti semua data saat ini</span> dengan data dari backup.</p>
                <p className="mt-1">Pastikan Anda memiliki backup data saat ini sebelum melanjutkan.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Pilih File Backup (.gz)
            </label>
            <input
              type="file"
              id="backup-file"
              accept=".gz"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center space-x-3">
              <label
                htmlFor="backup-file"
                className={`flex-1 py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 cursor-pointer flex items-center justify-center space-x-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span>Pilih File Backup</span>
              </label>
              
              <button
                onClick={handleUploadBackup}
                disabled={!selectedFile || isUploading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    <span>Pulihkan Database</span>
                  </>
                )}
              </button>
            </div>
            
            {selectedFile && (
              <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    File dipilih: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backup History */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Riwayat Backup
              </h3>
            </div>
            <button
              onClick={fetchBackupHistory}
              disabled={isLoadingBackups}
              className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''} ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>
          </div>
          
          {isLoadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
              <span className={`ml-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Memuat riwayat backup...
              </span>
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 glass-button rounded-lg">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {backup.filename}
                    </p>
                    <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      {new Date(backup.createdAt).toLocaleString('id-ID')} • {backup.size}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    backup.type === 'automatic' 
                      ? 'bg-blue-500/20 text-blue-500' 
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {backup.type === 'automatic' ? 'Otomatis' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Belum ada riwayat backup
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Database className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <p className="font-medium text-blue-500 mb-2">💡 Informasi Backup Database:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Backup mencakup semua data keuangan, dompet, kategori, dan pengaturan</li>
                <li>• Backup otomatis dibuat setiap minggu dan disimpan selama 30 hari</li>
                <li>• Disarankan untuk mengunduh backup manual secara berkala</li>
                <li>• File backup dikompresi dalam format .gz</li>
                <li>• Pemulihan database akan mengganti semua data saat ini</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackupRestore;