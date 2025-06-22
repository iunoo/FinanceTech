# VPS 1GB Deployment Optimization Guide

## 1. Backend Optimizations

### Memory Management
```javascript
// server/config/memory.js
export const memoryConfig = {
  // Limit Node.js memory usage
  maxOldSpaceSize: 400, // 400MB max for Node.js
  
  // MongoDB connection optimization
  mongodb: {
    maxPoolSize: 5,        // Reduce connection pool
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
  
  // Express optimization
  express: {
    limit: '10mb',         // Request size limit
    parameterLimit: 1000,
    arrayLimit: 100
  }
};
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'financetech-backend',
    script: 'index.js',
    cwd: './server',
    instances: 1,           // Single instance for 1GB VPS
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
```

## 2. Database Optimizations

### MongoDB Configuration
```yaml
# /etc/mongod.conf
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

### Database Indexes
```javascript
// server/scripts/setup-indexes.js
import mongoose from 'mongoose';

export const setupIndexes = async () => {
  const db = mongoose.connection.db;
  
  // Transaction indexes
  await db.collection('transactions').createIndex({ userId: 1, date: -1 });
  await db.collection('transactions').createIndex({ userId: 1, category: 1 });
  await db.collection('transactions').createIndex({ walletId: 1 });
  
  // Debt indexes
  await db.collection('debts').createIndex({ userId: 1, dueDate: 1 });
  await db.collection('debts').createIndex({ userId: 1, isPaid: 1 });
  
  // User indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  
  console.log('✅ Database indexes created');
};
```

## 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/financetech
server {
    listen 80;
    server_name your-domain.com;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend static files
    location / {
        root /var/www/financetech/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

## 4. System Monitoring

### Memory Monitoring Script
```bash
#!/bin/bash
# monitor-memory.sh

THRESHOLD=80
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')

if [ $MEMORY_USAGE -gt $THRESHOLD ]; then
    echo "$(date): High memory usage: ${MEMORY_USAGE}%" >> /var/log/memory-alert.log
    
    # Restart services if memory is critically high
    if [ $MEMORY_USAGE -gt 90 ]; then
        pm2 restart financetech-backend
        systemctl restart mongod
        echo "$(date): Services restarted due to high memory usage" >> /var/log/memory-alert.log
    fi
fi
```

### Crontab Setup
```bash
# Add to crontab (crontab -e)
# Check memory every 5 minutes
*/5 * * * * /home/user/scripts/monitor-memory.sh

# Restart services daily at 3 AM to prevent memory leaks
0 3 * * * pm2 restart financetech-backend

# Clean logs weekly
0 0 * * 0 find /var/log -name "*.log" -mtime +7 -delete
```

## 5. Performance Optimizations

### Frontend Build Optimization
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
```

### Backend Caching
```javascript
// server/middleware/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300,      // 5 minutes default
  maxKeys: 1000,    // Limit cache size
  useClones: false  // Save memory
});

export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};
```

## 6. Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting FinanceTech deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Configure MongoDB for low memory
sudo cp /etc/mongod.conf /etc/mongod.conf.backup
sudo tee /etc/mongod.conf > /dev/null <<EOF
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
EOF

# Start MongoDB
sudo systemctl enable mongod
sudo systemctl start mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Clone and setup project
cd /var/www
sudo git clone https://github.com/your-repo/FinanceTech.git financetech
cd financetech
sudo chown -R $USER:$USER .

# Install dependencies and build
npm install
npm run build

# Setup backend
cd server
npm install

# Create PM2 ecosystem
cat > ecosystem.config.js <<EOF
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
    }
  }]
};
EOF

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo tee /etc/nginx/sites-available/financetech > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        root /var/www/financetech/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/financetech /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup monitoring
mkdir -p /home/$USER/scripts
cat > /home/$USER/scripts/monitor-memory.sh <<EOF
#!/bin/bash
THRESHOLD=80
MEMORY_USAGE=\$(free | grep Mem | awk '{printf("%.0f", \$3/\$2 * 100.0)}')

if [ \$MEMORY_USAGE -gt \$THRESHOLD ]; then
    echo "\$(date): High memory usage: \${MEMORY_USAGE}%" >> /var/log/memory-alert.log
    
    if [ \$MEMORY_USAGE -gt 90 ]; then
        pm2 restart financetech-backend
        sudo systemctl restart mongod
        echo "\$(date): Services restarted due to high memory usage" >> /var/log/memory-alert.log
    fi
fi
EOF

chmod +x /home/$USER/scripts/monitor-memory.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/scripts/monitor-memory.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * pm2 restart financetech-backend") | crontab -

echo "✅ FinanceTech deployed successfully!"
echo "🌐 Access your app at: http://your-server-ip"
echo "📊 Monitor with: pm2 monit"
echo "📝 Logs: pm2 logs financetech-backend"
```

## 7. Monitoring Commands

```bash
# Check memory usage
free -h

# Monitor PM2 processes
pm2 monit

# Check MongoDB status
sudo systemctl status mongod

# View application logs
pm2 logs financetech-backend

# Check Nginx status
sudo systemctl status nginx

# Monitor disk usage
df -h

# Check running processes
htop
```

## 8. Troubleshooting

### Common Issues and Solutions

1. **High Memory Usage**
   ```bash
   # Restart services
   pm2 restart financetech-backend
   sudo systemctl restart mongod
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

3. **Application Crashes**
   ```bash
   # Check PM2 logs
   pm2 logs financetech-backend --lines 100
   
   # Restart with increased memory
   pm2 restart financetech-backend --max-memory-restart 400MB
   ```

4. **Nginx Issues**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Reload configuration
   sudo systemctl reload nginx
   ```