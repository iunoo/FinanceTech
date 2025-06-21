import express from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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

export default router;