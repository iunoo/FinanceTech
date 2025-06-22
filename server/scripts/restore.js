import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const DB_NAME = process.env.DB_NAME || 'financeapp';
const LOG_FILE = path.join(BACKUP_DIR, 'restore_log.txt');

// Log function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Main restore function
const runRestore = async (backupFile) => {
  try {
    // Validate backup file
    if (!backupFile) {
      log('❌ Error: No backup file specified');
      return { success: false, error: 'No backup file specified' };
    }
    
    // Check if backup file exists
    const backupPath = path.isAbsolute(backupFile) 
      ? backupFile 
      : path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      log(`❌ Error: Backup file not found: ${backupPath}`);
      return { success: false, error: 'Backup file not found' };
    }
    
    log(`Starting database restore from ${backupPath}...`);
    
    // Create temporary backup of current database
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempBackupPath = path.join(BACKUP_DIR, `pre_restore_${DB_NAME}_${timestamp}.gz`);
    
    log(`Creating temporary backup of current database: ${tempBackupPath}`);
    await execAsync(`mongodump --db ${DB_NAME} --gzip --archive=${tempBackupPath}`);
    
    // Restore from backup
    log('Restoring database from backup...');
    await execAsync(`mongorestore --gzip --archive=${backupPath} --nsFrom="${DB_NAME}.*" --nsTo="${DB_NAME}.*" --drop`);
    
    // Create restore info file
    const infoFile = path.join(BACKUP_DIR, `restore_${DB_NAME}_${timestamp}.info`);
    const infoContent = `
Restore Date: ${new Date().toISOString()}
Restored From: ${backupPath}
Temporary Backup: ${tempBackupPath}
    `.trim();
    
    fs.writeFileSync(infoFile, infoContent);
    
    log('✅ Database restored successfully!');
    return {
      success: true,
      tempBackup: tempBackupPath
    };
  } catch (error) {
    log(`❌ Restore failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run restore if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error('Usage: node restore.js <backup_file>');
    process.exit(1);
  }
  
  runRestore(backupFile)
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default runRestore;