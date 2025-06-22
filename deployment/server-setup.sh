#!/bin/bash
# Server Setup Script for FinanceTech on VPS 1GB

# Exit on error
set -e

echo "🚀 Starting FinanceTech server setup..."

# Update system
apt-get update
apt-get upgrade -y

# Install essential packages
apt-get install -y curl wget git build-essential ufw fail2ban htop

# Set up firewall
echo "🔒 Setting up firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Set up fail2ban
echo "🔒 Setting up fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install MongoDB
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

# Configure MongoDB for low memory
echo "⚙️ Configuring MongoDB for low memory..."
cat > /etc/mongod.conf <<EOF
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25

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

setParameter:
  wiredTigerConcurrentReadTransactions: 64
  wiredTigerConcurrentWriteTransactions: 64
EOF

# Start MongoDB
systemctl enable mongod
systemctl start mongod

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Create application user
echo "👤 Creating application user..."
useradd -m -s /bin/bash financeapp
usermod -aG sudo financeapp

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /var/www/financetech
mkdir -p /home/backups/mongodb
mkdir -p /var/log/financetech
mkdir -p /var/www/letsencrypt

# Set permissions
chown -R financeapp:financeapp /var/www/financetech
chown -R financeapp:financeapp /home/backups
chown -R financeapp:financeapp /var/log/financetech

# Create swap file (important for 1GB VPS)
echo "💾 Creating swap file..."
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Configure swap settings for low memory
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
sysctl -p

# Set up monitoring script
echo "📊 Setting up monitoring script..."
cat > /usr/local/bin/monitor-memory.sh <<EOF
#!/bin/bash
THRESHOLD=80
MEMORY_USAGE=\$(free | grep Mem | awk '{printf("%.0f", \$3/\$2 * 100.0)}')

if [ \$MEMORY_USAGE -gt \$THRESHOLD ]; then
    echo "\$(date): High memory usage: \${MEMORY_USAGE}%" >> /var/log/memory-alert.log
    
    if [ \$MEMORY_USAGE -gt 90 ]; then
        pm2 restart all
        systemctl restart mongod
        echo "\$(date): Services restarted due to high memory usage" >> /var/log/memory-alert.log
    fi
fi
EOF

chmod +x /usr/local/bin/monitor-memory.sh

# Add to crontab
echo "*/5 * * * * root /usr/local/bin/monitor-memory.sh" > /etc/cron.d/memory-monitor
echo "0 3 * * * root pm2 restart all" >> /etc/cron.d/memory-monitor
echo "0 2 * * 0 root /home/financeapp/scripts/mongodb-backup.sh" >> /etc/cron.d/memory-monitor

# Set up log rotation
cat > /etc/logrotate.d/financetech <<EOF
/var/log/financetech/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 financeapp financeapp
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF

echo "✅ Server setup completed successfully!"
echo "🔧 Next steps:"
echo "1. Deploy your application code"
echo "2. Configure Nginx for your domain"
echo "3. Set up SSL with Let's Encrypt"
echo "4. Start the application with PM2"