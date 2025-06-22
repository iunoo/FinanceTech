import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const DB_NAME = process.env.DB_NAME || 'financeapp';
const RETENTION_DAYS = process.env.BACKUP_RETENTION_DAYS || 30;
const DATE = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = path.join(BACKUP_DIR, `${DB_NAME}_${DATE}.gz`);

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Log file
const LOG_FILE = path.join(BACKUP_DIR, 'backup_log.txt');

// Log function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Main backup function
const runBackup = async () => {
  try {
    log('Starting MongoDB backup...');
    
    // Create backup
    log(`Creating backup: ${BACKUP_FILE}`);
    await execAsync(`mongodump --db ${DB_NAME} --gzip --archive=${BACKUP_FILE}`);
    
    // Get backup size
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`Backup created successfully: ${BACKUP_FILE} (${fileSizeInMB} MB)`);
    
    // Delete old backups
    log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);
    const files = fs.readdirSync(BACKUP_DIR);
    
    let deletedCount = 0;
    for (const file of files) {
      if (file.startsWith(`${DB_NAME}_`) && file.endsWith('.gz')) {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStat = fs.statSync(filePath);
        const fileAge = (Date.now() - fileStat.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (fileAge > RETENTION_DAYS) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }
    
    log(`Deleted ${deletedCount} old backup files`);
    
    // Create backup info file
    const infoFile = path.join(BACKUP_DIR, `${DB_NAME}_${DATE}.info`);
    const infoContent = `
Database: ${DB_NAME}
Date: ${new Date().toISOString()}
Size: ${fileSizeInMB} MB
Hostname: ${process.env.HOSTNAME || 'unknown'}
    `.trim();
    
    fs.writeFileSync(infoFile, infoContent);
    
    log('✅ Backup process completed successfully!');
    return {
      success: true,
      file: BACKUP_FILE,
      size: `${fileSizeInMB} MB`
    };
  } catch (error) {
    log(`❌ Backup failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run backup if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup()
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

export default runBackup;