import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Database, Clock, Check, AlertTriangle } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';

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
      // Ambil riwayat backup dari Supabase
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setBackups(data || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
      toast.error('Gagal mengambil riwayat backup');
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
    const loadingToastId = toast.loading('Membuat backup data Supabase...');
    
    try {
      // Panggil Supabase Edge Function untuk membuat backup
      const { data, error } = await supabase.functions.invoke('create-backup', {
        body: { userId: supabase.auth.getUser() }
      });
      
      if (error) {
        throw error;
      }
      
      // Download file
      const { fileUrl, filename } = data;
      
      // Create download link
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Backup data Supabase berhasil diunduh!', undefined, 6000);
      fetchBackupHistory();
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Gagal mengunduh backup data Supabase', undefined, 6000);
    } finally {
      toast.dismiss(loadingToastId);
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.json')) {
        toast.error('File harus berformat .json (Supabase backup)');
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
    const loadingToastId = toast.loading('Memulihkan data dari backup...');
    
    try {
      // Baca file sebagai text
      const fileContent = await selectedFile.text();
      
      // Panggil Supabase Edge Function untuk restore
      const { data, error } = await supabase.functions.invoke('restore-backup', {
        body: { 
          backupData: JSON.parse(fileContent),
          userId: supabase.auth.getUser()
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Data berhasil dipulihkan dari backup!', undefined, 6000);
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
            Unduh atau pulihkan data aplikasi Anda dari Supabase
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
            Unduh backup data Supabase untuk menyimpan data Anda secara lokal. Backup mencakup semua transaksi, dompet, kategori, dan pengaturan.
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
                <span>Download Backup Data Supabase</span>
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
              Pilih File Backup (.json)
            </label>
            <input
              type="file"
              id="backup-file"
              accept=".json"
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
                      {new Date(backup.created_at).toLocaleString('id-ID')} • {backup.size}
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
                <li>• Backup mencakup semua data dari Supabase: transaksi, dompet, kategori, dan pengaturan</li>
                <li>• Backup otomatis dibuat setiap minggu dan disimpan selama 30 hari</li>
                <li>• Disarankan untuk mengunduh backup manual secara berkala</li>
                <li>• File backup disimpan dalam format JSON</li>
                <li>• Pemulihan database akan mengganti semua data saat ini di Supabase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackupRestore;