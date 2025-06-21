import express from 'express';
import { sendTelegramMessage } from '../services/telegramBot.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test Telegram connection
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'ID Telegram diperlukan' });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(503).json({ 
        message: 'Bot Telegram tidak tersedia. Token bot belum dikonfigurasi.',
        error: 'TELEGRAM_TOKEN_MISSING'
      });
    }

    const message = `🎉 Pesan uji coba dari KeuanganKu!

Integrasi Telegram Anda berhasil! Anda akan menerima laporan keuangan dan pengingat hutang di sini.

📊 Fitur yang tersedia:
• Laporan harian/mingguan/bulanan
• Pengingat hutang 3 hari sebelum jatuh tempo
• Analisis keuangan AI
• Notifikasi transaksi penting

Selamat mengelola keuangan dengan lebih mudah! 💰

Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramMessage(telegramId, message);
    
    res.json({ message: 'Pesan uji coba berhasil dikirim ke Telegram!' });
  } catch (error) {
    console.error('Telegram test error:', error);
    
    if (error.message.includes('chat not found') || error.message.includes('user not found')) {
      return res.status(400).json({ 
        message: 'ID Telegram tidak valid atau bot belum diaktifkan. Pastikan Anda sudah mengirim /start ke bot.',
        error: 'INVALID_TELEGRAM_ID'
      });
    }
    
    if (error.message.includes('bot was blocked')) {
      return res.status(400).json({ 
        message: 'Bot diblokir oleh pengguna. Silakan unblock bot dan coba lagi.',
        error: 'BOT_BLOCKED'
      });
    }
    
    res.status(500).json({ 
      message: 'Gagal mengirim pesan uji coba. Periksa ID Telegram dan pastikan bot sudah diaktifkan.', 
      error: error.message 
    });
  }
});

// Check Telegram bot status
router.get('/status', async (req, res) => {
  try {
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    
    if (!hasToken) {
      return res.json({ 
        status: 'offline',
        message: 'Bot Telegram tidak aktif - TELEGRAM_BOT_TOKEN belum diatur'
      });
    }

    // Test bot token validity
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        res.json({ 
          status: 'online',
          message: `Bot Telegram aktif (@${data.result.username})`
        });
      } else {
        res.json({ 
          status: 'offline',
          message: 'Bot Telegram tidak aktif - Token tidak valid'
        });
      }
    } catch (error) {
      res.json({ 
        status: 'offline',
        message: 'Bot Telegram tidak aktif - Gagal menghubungi API Telegram'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'offline',
      message: 'Gagal memeriksa status bot'
    });
  }
});

export default router;