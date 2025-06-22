import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Weekly backup scheduler
export const setupBackupScheduler = () => {
  // Every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupPath = `/home/backups/financetech-${timestamp}`;
      
      // Create MongoDB dump
      await execAsync(`mongodump --db financeapp --out ${backupPath}`);
      
      // Compress backup
      await execAsync(`tar -czf ${backupPath}.tar.gz ${backupPath}`);
      
      // Remove uncompressed backup
      await execAsync(`rm -rf ${backupPath}`);
      
      // Keep only last 12 backups (3 months)
      await execAsync(`find /home/backups -name "financetech-*.tar.gz" -mtime +84 -delete`);
      
      console.log(`✅ Backup created: ${backupPath}.tar.gz`);
    } catch (error) {
      console.error('❌ Backup failed:', error);
    }
  });
  
  console.log('📅 Weekly backup scheduler initialized');
};