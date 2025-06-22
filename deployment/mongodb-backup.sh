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

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
  log "❌ Error: mongodump command not found. Please install MongoDB tools."
  exit 1
fi

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

# Create backup info file
cat > "${BACKUP_DIR}/${DB_NAME}_${DATE}.info" <<EOF
Database: ${DB_NAME}
Date: $(date)
Size: ${BACKUP_SIZE}
Hostname: $(hostname)
MongoDB Version: $(mongod --version | head -n 1)
EOF

log "✅ Backup process completed successfully!"