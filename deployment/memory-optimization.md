# Memory Optimization Guide for 1GB VPS

## 🧠 Memory Usage Analysis

### Typical Memory Footprint

| Component | Base Memory | Peak Memory | Notes |
|-----------|-------------|-------------|-------|
| Node.js   | ~50-80MB    | ~150-200MB  | Depends on load |
| MongoDB   | ~150-200MB  | ~300MB      | With WiredTiger cache limited |
| Nginx     | ~10-20MB    | ~30-50MB    | Depends on connections |
| System    | ~100-150MB  | ~200MB      | OS + background services |
| **Total** | **~310-450MB** | **~680-750MB** | **Within 1GB limit** |

## 🔧 Node.js Optimization

### Memory Flags

```bash
# Add to PM2 config or startup command
--max-old-space-size=400    # Limit heap to 400MB
--optimize-for-size         # Optimize for memory over speed
--max-semi-space-size=2     # Reduce semi-space size (2MB)
--max-executable-size=64    # Limit executable memory (64MB)
```

### Code Optimizations

1. **Avoid Memory Leaks**
   ```javascript
   // BAD: Potential memory leak
   const cache = {};
   
   // GOOD: Set limits and TTL
   const cache = new NodeCache({ 
     maxKeys: 1000,
     stdTTL: 3600
   });
   ```

2. **Stream Large Data**
   ```javascript
   // BAD: Load entire file into memory
   const data = fs.readFileSync('large-file.json');
   
   // GOOD: Stream data
   const stream = fs.createReadStream('large-file.json');
   stream.pipe(res);
   ```

3. **Pagination for Large Datasets**
   ```javascript
   // BAD: Return all records
   app.get('/api/transactions', (req, res) => {
     Transaction.find({}).then(data => res.json(data));
   });
   
   // GOOD: Use pagination
   app.get('/api/transactions', (req, res) => {
     const { page = 1, limit = 50 } = req.query;
     Transaction.find({})
       .skip((page - 1) * limit)
       .limit(Number(limit))
       .then(data => res.json(data));
   });
   ```

## 🗄️ MongoDB Optimization

### Configuration

```yaml
# /etc/mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25    # 256MB cache
      
setParameter:
  wiredTigerConcurrentReadTransactions: 64
  wiredTigerConcurrentWriteTransactions: 64
```

### Indexing Strategy

```javascript
// Create proper indexes
db.transactions.createIndex({ userId: 1, date: -1 });
db.transactions.createIndex({ userId: 1, category: 1 });
db.transactions.createIndex({ walletId: 1 });
```

### Query Optimization

```javascript
// BAD: Return all fields
db.transactions.find({ userId: userId });

// GOOD: Project only needed fields
db.transactions.find(
  { userId: userId },
  { date: 1, amount: 1, category: 1, type: 1 }
);
```

## 🌐 Nginx Optimization

### Worker Configuration

```nginx
# /etc/nginx/nginx.conf
worker_processes 1;          # Use 1 worker for 1GB VPS
worker_connections 512;      # Reduce from default 768
worker_rlimit_nofile 1024;   # Reduce open file limit
```

### Buffer Sizes

```nginx
# Reduce buffer sizes
client_body_buffer_size 8k;
client_header_buffer_size 1k;
client_max_body_size 1m;
large_client_header_buffers 2 1k;
```

## 🔄 Swap Configuration

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Optimize swap usage
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
sysctl -p
```

## 🚨 Memory Monitoring

```bash
#!/bin/bash
# /usr/local/bin/memory-alert.sh

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

## 📊 Memory Usage Tracking

```javascript
// Add to server/index.js
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const messages = [];
  
  for (let key in used) {
    messages.push(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  
  console.log(`Memory usage: ${messages.join(', ')}`);
};

// Log every hour
setInterval(logMemoryUsage, 60 * 60 * 1000);
```

## 🔍 Memory Leak Detection

```javascript
// Add to package.json scripts
"scripts": {
  "memwatch": "node --require=@airbnb/node-memwatch index.js"
}

// In your code
import memwatch from '@airbnb/node-memwatch';

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
});

memwatch.on('stats', (stats) => {
  console.log('GC stats:', stats);
});
```

## 🚀 Conclusion

With these optimizations, FinanceTech can run efficiently on a 1GB VPS while maintaining good performance and reliability. The key is to:

1. Limit Node.js memory usage
2. Optimize MongoDB configuration
3. Configure proper swap space
4. Implement monitoring and alerts
5. Use efficient coding practices