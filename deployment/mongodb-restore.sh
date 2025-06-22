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

# Check if mongorestore is available
if ! command -v mongorestore &> /dev/null; then
  log "❌ Error: mongorestore command not found. Please install MongoDB tools."
  exit 1
fi

# Confirm restore
echo "⚠️  WARNING: This will replace the current database with the backup."
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
read -p "Are you sure you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "Restore cancelled by user."
  exit 1
fi

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
  
  # Log restore info
  RESTORE_INFO="${BACKUP_DIR}/restore_${DB_NAME}_$(date +%Y-%m-%d_%H-%M-%S).info"
  cat > $RESTORE_INFO <<EOF
Restore Date: $(date)
Restored From: ${BACKUP_FILE}
Temporary Backup: ${TEMP_BACKUP}
Restored By: $(whoami)
Hostname: $(hostname)
EOF
  
  log "📝 Restore information saved to ${RESTORE_INFO}"
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