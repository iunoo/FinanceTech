import TelegramBot from 'node-telegram-bot-api';

let bot;

export const initializeTelegramBot = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('Token bot Telegram tidak tersedia');
    return;
  }

  try {
    // Stop existing bot if any
    if (bot) {
      bot.stopPolling();
      bot = null;
    }

    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🎉 Selamat datang di Bot KeuanganKu!

Saya akan membantu Anda mengelola keuangan dengan mengirimkan:
📊 Laporan harian, mingguan, dan bulanan
💳 Pengingat hutang dan kredit
📈 Wawasan dan tips keuangan

Untuk memulai:
1. Salin ID Telegram Anda: \`${chatId}\`
2. Buka aplikasi KeuanganKu
3. Masukkan ID Telegram di pengaturan
4. Simpan dan uji koneksi

Perintah yang tersedia:
/start - Tampilkan pesan selamat datang
/ringkasan - Dapatkan ringkasan keuangan terkini
/hutang - Lihat hutang yang akan jatuh tempo
/bantuan - Tampilkan informasi bantuan
      `;
      
      bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /ringkasan command
    bot.onText(/\/ringkasan/, async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, '📊 Fitur ringkasan keuangan akan segera tersedia! Silakan gunakan aplikasi web untuk analisis detail.');
    });

    // Handle /hutang command
    bot.onText(/\/hutang/, async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, '💳 Fitur ringkasan hutang akan segera tersedia! Silakan gunakan aplikasi web untuk mengelola hutang Anda.');
    });

    // Handle /bantuan command
    bot.onText(/\/bantuan/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🤖 Bantuan Bot KeuanganKu

Perintah yang tersedia:
/start - Pesan selamat datang dan petunjuk setup
/ringkasan - Dapatkan ringkasan keuangan Anda
/hutang - Lihat hutang dan kredit yang akan jatuh tempo
/bantuan - Tampilkan pesan bantuan ini

Fitur:
📊 Laporan keuangan otomatis
💳 Pengingat hutang dan pembayaran
📈 Wawasan bertenaga AI
🔔 Notifikasi yang dapat disesuaikan

Butuh bantuan lebih lanjut? Kunjungi aplikasi web KeuanganKu untuk fungsionalitas lengkap.
      `;
      
      bot.sendMessage(chatId, helpMessage);
    });

    // Error handling
    bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });

    console.log('Bot Telegram berhasil diinisialisasi');
    return bot;
  } catch (error) {
    console.error('Gagal menginisialisasi bot Telegram:', error);
    throw error;
  }
};

export const sendTelegramMessage = async (chatId, message) => {
  if (!bot) {
    throw new Error('Bot Telegram belum diinisialisasi');
  }
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Gagal mengirim pesan Telegram:', error);
    
    // Provide more specific error messages
    if (error.response && error.response.body) {
      const errorBody = error.response.body;
      if (errorBody.error_code === 400 && errorBody.description.includes('chat not found')) {
        throw new Error('chat not found');
      }
      if (errorBody.error_code === 403 && errorBody.description.includes('bot was blocked')) {
        throw new Error('bot was blocked');
      }
    }
    
    throw error;
  }
};

// Get bot info
export const getBotInfo = async () => {
  if (!bot) {
    throw new Error('Bot Telegram belum diinisialisasi');
  }
  
  try {
    return await bot.getMe();
  } catch (error) {
    console.error('Gagal mendapatkan info bot:', error);
    throw error;
  }
};