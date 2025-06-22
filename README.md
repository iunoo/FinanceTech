# FinanceTech - Personal Finance Management App

FinanceTech adalah aplikasi manajemen keuangan pribadi dengan desain glassmorphism yang modern, analisis AI, dan integrasi bot Telegram.

## Fitur Utama

### 🎨 UI/UX Modern
- **Desain Glassmorphism**: Elemen UI transparan dengan efek blur dan latar belakang aurora
- **Tema Gelap/Terang**: Beralih antar tema dengan transisi mulus
- **Ikon Dompet Kustom**: Unggah gambar atau gunakan emoji untuk ikon dompet
- **Warna Saldo Dinamis**: Kode warna berdasarkan rentang saldo yang dapat disesuaikan

### 💰 Manajemen Keuangan
- **Sistem Dompet Pintar**: Pembuatan dompet kustom dengan dukungan unggah gambar
- **Pelacakan Transaksi**: Tambah, edit, hapus transaksi pemasukan dan pengeluaran
- **Manajemen Kategori**: Kategori kustom dengan kode warna
- **Filter Tanggal**: Lihat transaksi berdasarkan hari, minggu, bulan, atau rentang kustom
- **Analisis Visual**: Grafik interaktif yang menunjukkan pola pengeluaran dan tren
- **Sistem Transfer**: Transfer uang antar dompet dengan mudah

### 🎭 Animasi & Performa
- **Efek Hover Instan**: Transisi 0.1s untuk kartu dompet dengan highlight border #00CCFF
- **Transisi Halaman Mulus**: Tanpa kedipan saat beralih antar tab
- **Performa Dioptimalkan**: `will-change: transform` untuk animasi mulus
- **Optimasi Mobile**: Animasi dikurangi pada perangkat mobile untuk performa lebih baik
- **Lazy Loading**: Rendering yang dioptimalkan untuk banyak dompet

### 🛠️ Fitur Dompet Kustom
- **Pengelola Dompet Kustom**: Buat, edit, dan hapus dompet kustom
- **Unggah Gambar**: Dukungan untuk ikon dompet JPG/PNG (maks 100x100px, batas 1MB)
- **Peringatan Saldo**: Efek border berdasarkan ambang batas saldo
- **Kode Warna**: Rentang warna kustom untuk level saldo berbeda
- **Validasi**: Mencegah penghapusan dompet dengan saldo atau transaksi yang ada

### 🤖 Analisis AI
- **Integrasi ChatGPT**: Wawasan dan rekomendasi keuangan berbasis AI
- **Laporan Pintar**: Analisis otomatis pola pengeluaran
- **Saran Anggaran**: Saran personal untuk perbaikan keuangan
- **Analisis Tren**: Identifikasi tren pengeluaran dan peluang penghematan

### 📱 Integrasi Bot Telegram
- **Laporan Otomatis**: Ringkasan keuangan harian, mingguan, dan bulanan
- **Pengingat Hutang**: Dapatkan notifikasi 3 hari sebelum tanggal jatuh tempo
- **Notifikasi Real-time**: Update instan status keuangan Anda
- **Perintah Bot**: Akses cepat ke ringkasan dan informasi hutang

### 💳 Manajemen Hutang & Piutang
- **Pelacakan Hutang**: Pantau hutang dan piutang dengan tanggal jatuh tempo
- **Pengingat Pembayaran**: Notifikasi otomatis untuk pembayaran mendatang
- **Manajemen Status**: Tandai hutang sebagai lunas dan lacak riwayat pembayaran
- **Penilaian Risiko**: Indikator visual untuk pembayaran yang terlambat dan mendesak

### 💾 Backup & Restore Database
- **Backup Manual**: Unduh backup database lengkap dengan sekali klik
- **Restore Database**: Pulihkan data dari file backup yang diunggah
- **Backup Otomatis**: Backup mingguan otomatis dengan retensi 30 hari
- **Riwayat Backup**: Lihat dan kelola riwayat backup

### 📊 Ekspor Data
- **Format CSV**: Ekspor transaksi ke format CSV untuk analisis di Excel
- **Format JSON**: Ekspor data lengkap dalam format JSON
- **Filter Ekspor**: Pilih rentang tanggal dan dompet untuk ekspor
- **Metadata**: Informasi lengkap tentang data yang diekspor

## Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Tailwind CSS** untuk styling dengan efek glassmorphism kustom
- **Chart.js** untuk visualisasi data
- **Zustand** untuk manajemen state
- **React Hook Form** untuk penanganan formulir
- **Sistem Toast Kustom** untuk notifikasi

### Backend
- **Supabase** untuk autentikasi dan database
- **PostgreSQL** untuk penyimpanan data
- **Row Level Security** untuk keamanan data per pengguna
- **JWT** untuk autentikasi

## Konfigurasi Supabase

### Langkah 1: Buat Akun Supabase
1. Kunjungi [Supabase](https://supabase.com/) dan buat akun baru
2. Buat project baru untuk FinanceTech

### Langkah 2: Konfigurasi Autentikasi
1. Di dashboard Supabase, buka tab **Authentication**
2. Aktifkan **Email & Password** sign-in method
3. Opsional: Nonaktifkan konfirmasi email untuk pengembangan

### Langkah 3: Setup Database
1. Buka tab **SQL Editor** di dashboard Supabase
2. Jalankan SQL dari file `supabase/migrations/create_tables.sql` untuk membuat tabel
3. Jalankan SQL dari file `supabase/migrations/seed_default_categories.sql` untuk menambahkan kategori default

### Langkah 4: Konfigurasi Aplikasi
1. Di dashboard Supabase, buka tab **Settings** > **API**
2. Salin **Project URL** dan **anon public** key
3. Buat file `.env` di root project berdasarkan `.env.example`
4. Isi nilai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan nilai yang disalin

### Langkah 5: Konfigurasi Row Level Security
1. Pastikan RLS sudah diaktifkan untuk semua tabel (sudah diatur dalam migrasi)
2. Verifikasi kebijakan akses sudah benar untuk setiap tabel

## Rekomendasi VPS

Untuk menjalankan FinanceTech dengan optimal untuk 1 pengguna, berikut rekomendasi spesifikasi VPS:

### Spesifikasi Minimum
- **RAM**: 1GB
- **CPU**: 1 vCPU
- **Storage**: 20GB SSD
- **Bandwidth**: 1TB/bulan

### Spesifikasi Rekomendasi
- **RAM**: 2GB
- **CPU**: 2 vCPU
- **Storage**: 40GB SSD
- **Bandwidth**: 2TB/bulan

### Penyedia VPS yang Direkomendasikan
- DigitalOcean ($5-$10/bulan)
- Linode ($5-$10/bulan)
- Vultr ($5-$10/bulan)
- Contabo ($4-$8/bulan)

Dengan spesifikasi minimum 1GB RAM, aplikasi FinanceTech dapat berjalan dengan baik untuk 1 pengguna dengan optimasi yang sudah dijelaskan di panduan deployment. Untuk performa yang lebih baik, terutama jika menggunakan fitur AI dan Telegram Bot, disarankan menggunakan VPS dengan 2GB RAM.

## Pengembangan Selanjutnya

- [ ] Aplikasi mobile (React Native)
- [ ] Integrasi rekening bank
- [ ] Pelacakan investasi
- [ ] Pelaporan lanjutan
- [ ] Dukungan multi-mata uang
- [ ] Ekspor ke Excel/PDF

## Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).

## Copyright

FinanceTech 2025, dibuat oleh iuno.in

## Repository

Kode sumber tersedia di: https://github.com/iunoo/FinanceTech