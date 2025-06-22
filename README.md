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
- **Simulasi ChatGPT**: Wawasan dan rekomendasi keuangan berbasis analisis data
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

## Panduan Instalasi Lengkap

### 1. Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- **Node.js** versi 18 atau lebih baru
  - [Download Node.js](https://nodejs.org/en/download/)
  - Untuk memverifikasi instalasi, buka terminal dan ketik: `node -v` dan `npm -v`

- **Git** (opsional, jika Anda ingin mengkloning repositori)
  - [Download Git](https://git-scm.com/downloads)
  - Untuk memverifikasi instalasi: `git --version`

### 2. Setup Supabase

#### 2.1 Buat Akun Supabase
1. Kunjungi [Supabase](https://supabase.com/) dan klik "Start for Free"
2. Daftar menggunakan email atau GitHub
3. Verifikasi email Anda jika diperlukan

#### 2.2 Buat Project Baru
1. Setelah masuk ke dashboard, klik "New Project"
2. Pilih organisasi (atau buat yang baru)
3. Masukkan nama project (misalnya "FinanceTech")
4. Masukkan password database (simpan dengan aman!)
5. Pilih region terdekat dengan Anda
6. Klik "Create new project" dan tunggu hingga project dibuat (sekitar 1-2 menit)

#### 2.3 Setup Database Schema
1. Di dashboard Supabase, buka tab "SQL Editor"
2. Klik "New Query"
3. Salin dan tempel SQL dari file `supabase/migrations/20250622045534_yellow_lagoon.sql`
4. Klik "Run" untuk membuat tabel dan kebijakan keamanan
5. Buat query baru, salin dan tempel SQL dari file `supabase/migrations/20250622045556_damp_dawn.sql`
6. Klik "Run" untuk membuat trigger untuk kategori default

#### 2.4 Dapatkan Kredensial API
1. Di dashboard Supabase, buka tab "Project Settings" (ikon roda gigi)
2. Klik "API" di sidebar
3. Di bagian "Project API keys", salin:
   - URL: `https://[project-ref].supabase.co`
   - `anon` public key

### 3. Setup Aplikasi

#### 3.1 Unduh Kode Sumber
Ada dua cara untuk mendapatkan kode sumber:

**Opsi 1: Menggunakan Git**
```bash
git clone https://github.com/iunoo/FinanceTech.git
cd FinanceTech
```

**Opsi 2: Unduh ZIP**
1. Kunjungi [repositori GitHub](https://github.com/iunoo/FinanceTech)
2. Klik tombol "Code" dan pilih "Download ZIP"
3. Ekstrak file ZIP ke folder pilihan Anda
4. Buka terminal dan navigasikan ke folder tersebut:
```bash
cd path/to/FinanceTech
```

#### 3.2 Instal Dependensi
Di terminal, jalankan:
```bash
npm install
```
Perintah ini akan menginstal semua paket yang diperlukan. Proses ini mungkin memakan waktu beberapa menit.

#### 3.3 Konfigurasi Environment Variables
1. Buat file `.env` di root project:
```bash
cp .env.example .env
```

2. Edit file `.env` dan isi dengan kredensial Supabase Anda:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Menjalankan Aplikasi

#### 4.1 Mode Development
Untuk menjalankan aplikasi dalam mode pengembangan:
```bash
npm run dev
```

Setelah perintah ini dijalankan:
1. Terminal akan menampilkan URL lokal (biasanya `http://localhost:5173`)
2. Buka URL tersebut di browser Anda
3. Aplikasi akan dimuat dan Anda dapat mendaftar akun baru

#### 4.2 Build untuk Produksi
Untuk membuat versi produksi:
```bash
npm run build
```

Ini akan menghasilkan folder `dist` yang berisi file statis yang dapat di-deploy ke hosting apa pun.

### 5. Penggunaan Pertama Kali

#### 5.1 Mendaftar Akun
1. Buka aplikasi di browser
2. Klik "Daftar sekarang" di halaman login
3. Isi formulir pendaftaran dengan:
   - Nama lengkap
   - Email
   - Password (minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka)
4. Klik "Buat Akun"

#### 5.2 Menggunakan Aplikasi
Setelah mendaftar, Anda akan diarahkan ke dashboard. Berikut beberapa langkah awal:

1. **Sesuaikan Dompet Default**
   - Buka tab "Pengaturan" > "Dompet"
   - Edit dompet yang sudah ada atau tambahkan yang baru
   - Sesuaikan saldo awal untuk mencerminkan keuangan Anda saat ini

2. **Tambahkan Transaksi**
   - Di dashboard, klik "Tambah Transaksi"
   - Pilih jenis transaksi (Pemasukan/Pengeluaran)
   - Isi detail dan klik "Tambah"

3. **Lihat Analisis**
   - Buka tab "Analisis" untuk melihat grafik dan wawasan keuangan Anda

### 6. Troubleshooting

#### 6.1 Masalah Koneksi Supabase
Jika Anda mengalami masalah koneksi ke Supabase:
1. Pastikan URL dan kunci API sudah benar di file `.env`
2. Periksa apakah project Supabase Anda aktif di dashboard
3. Pastikan Anda memiliki koneksi internet yang stabil

#### 6.2 Masalah Instalasi Dependensi
Jika `npm install` gagal:
1. Hapus folder `node_modules` dan file `package-lock.json`
2. Jalankan `npm cache clean --force`
3. Coba lagi dengan `npm install`

#### 6.3 Masalah Saat Menjalankan Aplikasi
Jika aplikasi tidak berjalan dengan benar:
1. Pastikan Node.js versi 18 atau lebih baru
2. Periksa log error di terminal
3. Pastikan port 5173 tidak digunakan oleh aplikasi lain

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
2. Jalankan SQL dari file `supabase/migrations/20250622045534_yellow_lagoon.sql` untuk membuat tabel
3. Jalankan SQL dari file `supabase/migrations/20250622045556_damp_dawn.sql` untuk menambahkan trigger untuk kategori default

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

## Deployment ke Hosting Statis

Jika Anda ingin men-deploy FinanceTech ke hosting statis (seperti Netlify, Vercel, atau GitHub Pages):

### 1. Build Aplikasi
```bash
npm run build
```

### 2. Deploy ke Netlify
1. Buat akun di [Netlify](https://www.netlify.com/)
2. Drag and drop folder `dist` ke area upload di dashboard Netlify
3. Atau gunakan Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 3. Deploy ke Vercel
1. Buat akun di [Vercel](https://vercel.com/)
2. Install Vercel CLI:
```bash
npm install -g vercel
```
3. Deploy:
```bash
vercel --prod
```

### 4. Konfigurasi Environment Variables
Setelah deploy, jangan lupa untuk mengatur environment variables di dashboard hosting Anda:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

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