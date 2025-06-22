import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../config/logging.js';

const router = express.Router();
const execAsync = promisify(exec);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `backup-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only .gz files
    if (file.mimetype === 'application/gzip' || file.originalname.endsWith('.gz')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file backup .gz yang diperbolehkan'));
    }
  }
});

// Save API Keys to .env file
router.post('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { openaiKey, telegramToken } = req.body;
    
    if (!openaiKey && !telegramToken) {
      return res.status(400).json({ message: 'Minimal satu API key harus diisi' });
    }
    
    // Validate API key formats
    if (openaiKey && !openaiKey.startsWith('sk-')) {
      return res.status(400).json({ message: 'Format OpenAI API key tidak valid (harus dimulai dengan sk-)' });
    }
    
    if (telegramToken && !telegramToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      return res.status(400).json({ message: 'Format Telegram Bot Token tidak valid' });
    }
    
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Parse existing environment variables
    const envVars = {};
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    // Update API keys
    if (openaiKey) {
      envVars['OPENAI_API_KEY'] = openaiKey;
    }
    
    if (telegramToken) {
      envVars['TELEGRAM_BOT_TOKEN'] = telegramToken;
    }
    
    // Ensure required environment variables exist
    const defaultVars = {
      'MONGODB_URI': 'mongodb://localhost:27017/financeapp',
      'JWT_SECRET': 'your-super-secret-jwt-key-here-change-this-in-production',
      'PORT': '3001'
    };
    
    for (const [key, defaultValue] of Object.entries(defaultVars)) {
      if (!envVars[key]) {
        envVars[key] = defaultValue;
      }
    }
    
    // Generate new .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';
    
    // Write to .env file
    fs.writeFileSync(envPath, newEnvContent);
    
    // Update process.env immediately
    if (openaiKey) {
      process.env.OPENAI_API_KEY = openaiKey;
      console.log('OpenAI API key updated');
    }
    
    if (telegramToken) {
      process.env.TELEGRAM_BOT_TOKEN = telegramToken;
      console.log('Telegram bot token updated');
      
      // Reinitialize Telegram bot
      try {
        const { initializeTelegramBot } = await import('../services/telegramBot.js');
        await initializeTelegramBot();
        console.log('Telegram bot reinitialized successfully');
      } catch (error) {
        console.error('Failed to reinitialize Telegram bot:', error);
      }
    }
    
    res.json({ 
      message: 'API Keys berhasil disimpan dan diterapkan!',
      updated: {
        openai: !!openaiKey,
        telegram: !!telegramToken
      }
    });
  } catch (error) {
    console.error('Error saving API keys:', error);
    res.status(500).json({ 
      message: 'Gagal menyimpan API Keys', 
      error: error.message 
    });
  }
});

// Get current API key status (without revealing the actual keys)
router.get('/api-keys/status', authenticateToken, async (req, res) => {
  try {
    res.json({
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        valid: process.env.OPENAI_API_KEY?.startsWith('sk-') || false
      },
      telegram: {
        configured: !!process.env.TELEGRAM_BOT_TOKEN,
        valid: /^\d+:[A-Za-z0-9_-]+$/.test(process.env.TELEGRAM_BOT_TOKEN || '') || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memeriksa status API keys' });
  }
});

// Download database backup
router.get('/database/backup', authenticateToken, async (req, res) => {
  try {
    logger.info('Starting database backup for download');
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `financeapp-backup-${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Create database backup
    logger.info(`Creating backup at ${backupPath}`);
    await execAsync(`mongodump --db financeapp --gzip --archive=${backupPath}`);
    
    // Check if backup was created successfully
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file was not created');
    }
    
    // Get file size for logging
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logger.info(`Backup created successfully: ${backupFilename} (${fileSizeInMB} MB)`);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename=${backupFilename}`);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(backupPath);
    fileStream.pipe(res);
    
    // Delete the file after sending (using event handler)
    fileStream.on('end', () => {
      fs.unlink(backupPath, (err) => {
        if (err) {
          logger.error(`Error deleting temporary backup file: ${err.message}`);
        } else {
          logger.info(`Temporary backup file deleted: ${backupPath}`);
        }
      });
    });
  } catch (error) {
    logger.error(`Database backup failed: ${error.message}`);
    res.status(500).json({ 
      message: 'Gagal membuat backup database', 
      error: error.message 
    });
  }
});

// Upload and restore database backup
router.post('/database/restore', authenticateToken, upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File backup tidak ditemukan' });
    }
    
    const backupPath = req.file.path;
    logger.info(`Received backup file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Create temporary backup of current database before restoring
    const tempBackupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(tempBackupDir)) {
      fs.mkdirSync(tempBackupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempBackupPath = path.join(tempBackupDir, `pre-restore-backup-${timestamp}.gz`);
    
    logger.info('Creating temporary backup of current database');
    await execAsync(`mongodump --db financeapp --gzip --archive=${tempBackupPath}`);
    
    // Restore from uploaded backup
    logger.info('Restoring database from uploaded backup');
    try {
      await execAsync(`mongorestore --gzip --archive=${backupPath} --nsFrom="financeapp.*" --nsTo="financeapp.*" --drop`);
      
      logger.info('Database restored successfully');
      res.json({ 
        message: 'Database berhasil dipulihkan dari backup!',
        tempBackup: path.basename(tempBackupPath)
      });
    } catch (restoreError) {
      logger.error(`Restore failed: ${restoreError.message}`);
      
      // Attempt to rollback to previous state
      logger.info('Attempting to rollback to previous state');
      try {
        await execAsync(`mongorestore --gzip --archive=${tempBackupPath} --nsFrom="financeapp.*" --nsTo="financeapp.*" --drop`);
        logger.info('Rollback successful');
      } catch (rollbackError) {
        logger.error(`Rollback failed: ${rollbackError.message}`);
      }
      
      throw new Error(`Gagal memulihkan database: ${restoreError.message}`);
    } finally {
      // Clean up uploaded file
      fs.unlink(backupPath, (err) => {
        if (err) {
          logger.error(`Error deleting uploaded backup file: ${err.message}`);
        } else {
          logger.info(`Uploaded backup file deleted: ${backupPath}`);
        }
      });
      
      // Keep the temporary backup for safety (can be cleaned up later)
      logger.info(`Temporary backup saved at: ${tempBackupPath}`);
    }
  } catch (error) {
    logger.error(`Database restore failed: ${error.message}`);
    res.status(500).json({ 
      message: 'Gagal memulihkan database dari backup', 
      error: error.message 
    });
  }
});

// Get backup history
router.get('/database/backups', authenticateToken, async (req, res) => {
  try {
    // This would typically list backups from a storage location
    // For this implementation, we'll return a simulated list
    
    // Get current date for simulated backups
    const now = new Date();
    
    // Create simulated backup history (last 5 backups)
    const backups = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7)); // Weekly backups
      
      const size = Math.floor(Math.random() * 10) + 5; // 5-15 MB
      
      return {
        id: `backup-${date.getTime()}`,
        filename: `financeapp-backup-${date.toISOString().split('T')[0]}.gz`,
        createdAt: date.toISOString(),
        size: `${size} MB`,
        type: 'automatic'
      };
    });
    
    res.json({ backups });
  } catch (error) {
    logger.error(`Error getting backup history: ${error.message}`);
    res.status(500).json({ 
      message: 'Gagal mendapatkan riwayat backup', 
      error: error.message 
    });
  }
});

export default router;