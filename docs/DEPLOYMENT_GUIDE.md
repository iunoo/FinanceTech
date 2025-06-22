# Panduan Lengkap Deployment FinanceTech

Dokumen ini berisi panduan lengkap untuk melakukan deployment aplikasi FinanceTech ke VPS dengan spesifikasi 1GB RAM.

## Daftar Isi

1. [Prasyarat](#prasyarat)
2. [Persiapan Server](#persiapan-server)
3. [Deployment Aplikasi](#deployment-aplikasi)
4. [Konfigurasi Nginx](#konfigurasi-nginx)
5. [Setup SSL/HTTPS](#setup-sslhttps)
6. [Konfigurasi MongoDB](#konfigurasi-mongodb)
7. [Setup Backup Otomatis](#setup-backup-otomatis)
8. [Monitoring dan Maintenance](#monitoring-dan-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prasyarat

- VPS dengan minimal 1GB RAM (direkomendasikan 1GB RAM, 1 vCPU)
- OS Ubuntu 20.04 LTS atau lebih baru
- Domain yang sudah diarahkan ke IP VPS Anda
- Akses SSH ke VPS

## Persiapan Server

### 1. Update Sistem

```bash
# Login ke server Anda
ssh root@your_server_ip

# Update package list dan upgrade sistem
apt-get update
apt-get upgrade -y
```

### 2. Buat User Non-Root

```bash
# Buat user baru
adduser financeapp

# Tambahkan ke grup sudo
usermod -aG sudo financeapp

# Switch ke user baru
su - financeapp
```

### 3. Setup Firewall

```bash
# Aktifkan UFW
sudo ufw enable

# Izinkan SSH, HTTP, dan HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Verifikasi status
sudo ufw status
```

### 4. Install Dependensi

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi instalasi
node -v  # Harus menampilkan v18.x.x
npm -v   # Harus menampilkan 8.x.x atau lebih tinggi

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB dan aktifkan pada boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Verifikasi MongoDB berjalan
sudo systemctl status mongod

# Install PM2 untuk mengelola aplikasi Node.js
sudo npm install -g pm2
```

## Deployment Aplikasi

### 1. Clone Repository

```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/financetech
sudo chown -R financeapp:financeapp /var/www/financetech

# Clone repository (ganti dengan URL repository Anda)
cd /var/www/financetech
git clone https://github.com/yourusername/financetech.git .
```

### 2. Setup Frontend

```bash
# Install dependensi frontend
npm install

# Build frontend
npm run build
```

### 3. Setup Backend

```bash
# Pindah ke direktori server
cd server

# Install dependensi backend
npm install

# Buat file .env
cat > .env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/financeapp

# JWT Secret (ganti dengan string acak yang aman)
JWT_SECRET=$(openssl rand -hex 32)

# Server Port
PORT=3001

# OpenAI API Key (opsional)
# OPENAI_API_KEY=your-openai-api-key-here

# Telegram Bot Token (opsional)
# TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
EOF

# Buat direktori logs
mkdir -p logs
```

### 4. Setup PM2

```bash
# Buat file konfigurasi PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'financetech-backend',
    script: 'index.js',
    instances: 1,
    max_memory_restart: '350MB',
    node_args: '--max-old-space-size=400',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start aplikasi dengan PM2
pm2 start ecosystem.config.js

# Setup PM2 untuk start pada boot
pm2 save
pm2 startup
# Jalankan perintah yang ditampilkan oleh perintah di atas
```

## Konfigurasi Nginx

### 1. Install Nginx

```bash
sudo apt-get install -y nginx
```

### 2. Buat Konfigurasi Nginx

```bash
# Buat file konfigurasi
sudo nano /etc/nginx/sites-available/financetech
```

Isi dengan konfigurasi berikut (ganti `yourdomain.com` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend static files
    location / {
        root /var/www/financetech/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Logs
    access_log /var/log/nginx/financetech.access.log;
    error_log /var/log/nginx/financetech.error.log;
}
```

### 3. Aktifkan Konfigurasi

```bash
# Aktifkan konfigurasi
sudo ln -s /etc/nginx/sites-available/financetech /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Setup SSL/HTTPS

### 1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Dapatkan Sertifikat SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Ikuti petunjuk yang muncul untuk menyelesaikan proses.

### 3. Verifikasi Auto-Renewal

```bash
sudo certbot renew --dry-run
```

## Konfigurasi MongoDB

### 1. Optimasi untuk VPS 1GB

```bash
# Edit konfigurasi MongoDB
sudo nano /etc/mongod.conf
```

Ganti dengan konfigurasi berikut:

```yaml
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25    # Limit cache to 256MB

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Memory optimization
setParameter:
  wiredTigerConcurrentReadTransactions: 64
  wiredTigerConcurrentWriteTransactions: 64
```

### 2. Restart MongoDB

```bash
sudo systemctl restart mongod
```

### 3. Setup Swap Space

```bash
# Buat 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tambahkan ke fstab untuk persistensi
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimasi penggunaan swap
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Setup Backup Otomatis

### 1. Buat Direktori Backup

```bash
sudo mkdir -p /home/backups/mongodb
sudo chown -R financeapp:financeapp /home/backups
```

### 2. Buat Script Backup

```bash
# Buat direktori scripts
mkdir -p ~/scripts

# Buat script backup
nano ~/scripts/mongodb-backup.sh
```

Isi dengan konten berikut:

```bash
#!/bin/bash
# MongoDB Backup Script for FinanceTech

# Exit on error
set -e

# Configuration
BACKUP_DIR="/home/backups/mongodb"
DB_NAME="financeapp"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Log file
LOG_FILE="${BACKUP_DIR}/backup_log.txt"

# Log function
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" >> $LOG_FILE
  echo "$1"
}

log "Starting MongoDB backup for ${DB_NAME}..."

# Create backup
mongodump --db $DB_NAME --gzip --archive=$BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
  log "✅ Backup created successfully: ${BACKUP_FILE}"
  
  # Get backup size
  BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
  log "📊 Backup size: ${BACKUP_SIZE}"
  
  # Delete old backups
  log "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
  find $BACKUP_DIR -name "${DB_NAME}_*.gz" -type f -mtime +$RETENTION_DAYS -delete
  
  # Count remaining backups
  BACKUP_COUNT=$(find $BACKUP_DIR -name "${DB_NAME}_*.gz" -type f | wc -l)
  log "📁 Total backups: ${BACKUP_COUNT}"
else
  log "❌ Backup failed!"
  exit 1
fi

log "✅ Backup process completed successfully!"
```

### 3. Buat Script Restore

```bash
nano ~/scripts/mongodb-restore.sh
```

Isi dengan konten berikut:

```bash
#!/bin/bash
# MongoDB Restore Script for FinanceTech

# Exit on error
set -e

# Configuration
BACKUP_DIR="/home/backups/mongodb"
DB_NAME="financeapp"
LOG_FILE="${BACKUP_DIR}/restore_log.txt"

# Log function
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" >> $LOG_FILE
  echo "$1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  echo "Available backups:"
  ls -lh $BACKUP_DIR | grep "${DB_NAME}_" | sort -r
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  log "❌ Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

log "Starting MongoDB restore from ${BACKUP_FILE}..."

# Create a temporary backup of current data
TEMP_BACKUP="${BACKUP_DIR}/${DB_NAME}_before_restore_$(date +%Y-%m-%d_%H-%M-%S).gz"
log "📦 Creating temporary backup of current data: ${TEMP_BACKUP}"
mongodump --db $DB_NAME --gzip --archive=$TEMP_BACKUP

# Restore from backup
log "🔄 Restoring database from backup..."
mongorestore --gzip --archive=$BACKUP_FILE --nsFrom="${DB_NAME}.*" --nsTo="${DB_NAME}.*" --drop

# Check if restore was successful
if [ $? -eq 0 ]; then
  log "✅ Database restored successfully from ${BACKUP_FILE}"
else
  log "❌ Restore failed! Attempting to rollback..."
  
  # Attempt rollback
  mongorestore --gzip --archive=$TEMP_BACKUP --nsFrom="${DB_NAME}.*" --nsTo="${DB_NAME}.*" --drop
  
  if [ $? -eq 0 ]; then
    log "✅ Rollback successful. Database restored to previous state."
  else
    log "❌ Rollback failed! Database may be in an inconsistent state."
    log "Please restore manually from ${TEMP_BACKUP}"
  fi
  
  exit 1
fi

log "✅ Restore process completed successfully!"
```

### 4. Buat Cron Job untuk Backup Otomatis

```bash
# Buat file executable
chmod +x ~/scripts/mongodb-backup.sh
chmod +x ~/scripts/mongodb-restore.sh

# Edit crontab
crontab -e
```

Tambahkan baris berikut:

```
# Weekly backup on Sunday at 2 AM
0 2 * * 0 /home/financeapp/scripts/mongodb-backup.sh
```

## Monitoring dan Maintenance

### 1. Setup Script Monitoring

```bash
# Buat script monitoring
nano ~/scripts/monitor-memory.sh
```

Isi dengan konten berikut:

```bash
#!/bin/bash
THRESHOLD=80
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')

if [ $MEMORY_USAGE -gt $THRESHOLD ]; then
    echo "$(date): High memory usage: ${MEMORY_USAGE}%" >> /var/log/memory-alert.log
    
    # Critical memory usage - restart services
    if [ $MEMORY_USAGE -gt 90 ]; then
        pm2 restart financetech-backend
        systemctl restart mongod
        echo "$(date): Services restarted due to high memory usage" >> /var/log/memory-alert.log
    fi
fi
```

### 2. Buat Cron Job untuk Monitoring

```bash
# Buat file executable
chmod +x ~/scripts/monitor-memory.sh

# Edit crontab
crontab -e
```

Tambahkan baris berikut:

```
# Check memory every 5 minutes
*/5 * * * * /home/financeapp/scripts/monitor-memory.sh

# Restart services daily at 3 AM to prevent memory leaks
0 3 * * * pm2 restart financetech-backend
```

### 3. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/financetech
```

Isi dengan konten berikut:

```
/var/www/financetech/server/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 financeapp financeapp
    sharedscripts
    postrotate
        pm2 reload financetech-backend
    endscript
}
```

## Troubleshooting

### 1. Jika Aplikasi Tidak Berjalan

```bash
# Cek status PM2
pm2 status
pm2 logs financetech-backend

# Cek status MongoDB
sudo systemctl status mongod
sudo cat /var/log/mongodb/mongod.log

# Cek status Nginx
sudo systemctl status nginx
sudo cat /var/log/nginx/error.log
```

### 2. Jika Memori Terlalu Tinggi

```bash
# Cek penggunaan memori
free -h
htop

# Restart layanan
pm2 restart financetech-backend
sudo systemctl restart mongod
```

### 3. Jika Disk Penuh

```bash
# Cek penggunaan disk
df -h

# Bersihkan log lama
sudo find /var/log -name "*.gz" -delete
sudo find /var/log -name "*.1" -delete

# Bersihkan cache npm
npm cache clean --force
```

### 4. Jika SSL Tidak Berfungsi

```bash
# Cek status sertifikat
sudo certbot certificates

# Perbarui sertifikat secara manual
sudo certbot renew
```

## Perintah Berguna

### Restart Semua Layanan

```bash
sudo systemctl restart mongod
pm2 restart financetech-backend
sudo systemctl restart nginx
```

### Melihat Log

```bash
# Log aplikasi
pm2 logs financetech-backend

# Log MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Log Nginx
sudo tail -f /var/log/nginx/financetech.error.log
```

### Backup Manual

```bash
# Jalankan script backup
~/scripts/mongodb-backup.sh
```

### Restore dari Backup

```bash
# Lihat backup yang tersedia
ls -lh /home/backups/mongodb

# Restore dari backup tertentu
~/scripts/mongodb-restore.sh /home/backups/mongodb/financeapp_2023-05-15_12-30-45.gz
```

### Update Aplikasi

```bash
# Pindah ke direktori aplikasi
cd /var/www/financetech

# Pull perubahan terbaru
git pull

# Install dependensi baru (jika ada)
npm install

# Build ulang frontend
npm run build

# Restart backend
pm2 restart financetech-backend
```

## Kesimpulan

Selamat! Anda telah berhasil men-deploy aplikasi FinanceTech ke VPS 1GB. Pastikan untuk:

1. Melakukan backup secara teratur
2. Memantau penggunaan memori dan disk
3. Menjaga keamanan server dengan update rutin
4. Memperbarui sertifikat SSL sebelum kedaluwarsa

Jika Anda mengalami masalah, lihat bagian [Troubleshooting](#troubleshooting) atau hubungi tim dukungan.