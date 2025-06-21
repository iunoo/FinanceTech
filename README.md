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

## Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Tailwind CSS** untuk styling dengan efek glassmorphism kustom
- **Chart.js** untuk visualisasi data
- **Zustand** untuk manajemen state
- **React Hook Form** untuk penanganan formulir
- **Sistem Toast Kustom** untuk notifikasi

### Backend
- **Node.js** dengan Express.js
- **MongoDB** dengan Mongoose ODM
- **JWT** untuk autentikasi
- **bcryptjs** untuk hashing password
- **OpenAI API** untuk integrasi ChatGPT
- **Telegram Bot API** untuk notifikasi

## Fitur Baru & Perbaikan

### ✨ Fitur Terbaru
- **Pemilih Tanggal & Waktu yang Ditingkatkan**: Komponen pemilih tanggal dan waktu yang lebih compact dan profesional
- **Validasi Tanggal Transaksi**: Mencegah transaksi dengan tanggal di masa depan
- **Efek Glowing yang Ditingkatkan**: Efek visual yang lebih baik untuk status saldo berbeda
- **Pengingat Hutang Kustom**: Pengaturan pengingat hutang yang dapat disesuaikan
- **Kategorisasi Pintar**: Saran kategori otomatis berdasarkan deskripsi transaksi

### 🐛 Perbaikan Bug
- **Perbaikan Parsing ID Transaksi**: Menangani format ID transaksi dengan benar
- **Perbaikan Efek Glowing**: Memastikan efek glowing berfungsi untuk semua rentang warna
- **Perbaikan Tampilan Dompet**: Warna teks saldo sekarang sesuai dengan pengaturan
- **Perbaikan Pemilihan Dompet**: Menghilangkan highlight biru saat memilih dompet
- **Optimasi Performa**: Mengurangi animasi yang berat untuk performa lebih baik

## Instalasi di VPS

### Prasyarat
- Node.js 18+ dan npm
- MongoDB (lokal atau cloud)
- Nginx atau Apache sebagai web server
- PM2 untuk menjalankan aplikasi sebagai service

### 1. Persiapan Server

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js dan npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 secara global
sudo npm install -g pm2

# Install MongoDB (opsional, jika ingin menggunakan MongoDB lokal)
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Clone dan Setup Proyek

```bash
# Clone repositori
git clone https://github.com/iunoo/FinanceTech.git
cd FinanceTech

# Install dependensi frontend
npm install

# Build frontend
npm run build

# Pindah ke direktori server dan install dependensi
cd server
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` di direktori `server`:

```
# Database
MONGODB_URI=mongodb://localhost:27017/financeapp

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# OpenAI API Key (opsional)
OPENAI_API_KEY=your-openai-api-key-here

# Telegram Bot Token (opsional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Server Port
PORT=3001
```

### 4. Setup PM2 untuk Backend

```bash
# Di direktori server
pm2 start index.js --name financetech-backend
pm2 save
pm2 startup
```

### 5. Konfigurasi Nginx

Buat file konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/financetech
```

Tambahkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name financetech.yourdomain.com; # Ganti dengan domain Anda

    # Frontend (static files)
    location / {
        root /path/to/financetech/dist; # Ganti dengan path ke direktori build
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi:

```bash
sudo ln -s /etc/nginx/sites-available/financetech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL dengan Certbot (Opsional tapi Direkomendasikan)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d financetech.yourdomain.com
```

### 7. Monitoring dan Maintenance

```bash
# Melihat log backend
pm2 logs financetech-backend

# Restart backend jika diperlukan
pm2 restart financetech-backend

# Update aplikasi
cd /path/to/financetech
git pull
npm install
npm run build
cd server
npm install
pm2 restart financetech-backend
```

## Pengembangan Selanjutnya

- [ ] Aplikasi mobile (React Native)
- [ ] Integrasi rekening bank
- [ ] Pelacakan investasi
- [ ] Pelaporan lanjutan
- [ ] Dukungan multi-mata uang
- [ ] Ekspor ke Excel/PDF

## Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).

## Repository

Kode sumber tersedia di: https://github.com/iunoo/FinanceTech