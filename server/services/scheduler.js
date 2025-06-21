import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Debt from '../models/Debt.js';
import { sendTelegramMessage } from './telegramBot.js';
import { generateFinancialAnalysis } from './openaiService.js';

export const sendScheduledReports = async (reportType) => {
  try {
    console.log(`Mengirim laporan ${reportType}...`);
    
    // Get users with Telegram IDs and appropriate notification settings
    const users = await User.find({
      telegramId: { $exists: true, $ne: null },
      [`notificationSettings.${reportType === 'debt-reminders' ? 'debtReminders' : reportType}`]: true
    });

    for (const user of users) {
      try {
        if (reportType === 'debt-reminders') {
          await sendDebtReminders(user);
        } else {
          await sendFinancialReport(user, reportType);
        }
      } catch (error) {
        console.error(`Gagal mengirim laporan ${reportType} ke pengguna ${user._id}:`, error);
      }
    }
    
    console.log(`Laporan ${reportType} dikirim ke ${users.length} pengguna`);
  } catch (error) {
    console.error(`Error mengirim laporan ${reportType}:`, error);
  }
};

const sendFinancialReport = async (user, reportType) => {
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (reportType) {
    case 'daily':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  // Get transactions for the period
  const transactions = await Transaction.find({
    userId: user._id,
    date: {
      $gte: startDate,
      $lte: now
    }
  });

  // Calculate statistics
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  // Generate report message
  const reportTitle = `📊 Laporan Keuangan ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
  const period = reportType === 'daily' ? 'kemarin' : 
                reportType === 'weekly' ? 'minggu ini' : 'bulan ini';
  
  let message = `${reportTitle}\n\n`;
  message += `💰 **Pemasukan**: Rp ${income.toLocaleString('id-ID')}\n`;
  message += `💸 **Pengeluaran**: Rp ${expenses.toLocaleString('id-ID')}\n`;
  message += `📈 **Saldo**: Rp ${(income - expenses).toLocaleString('id-ID')}\n\n`;

  if (Object.keys(categoryBreakdown).length > 0) {
    message += `**Kategori Pengeluaran Teratas:**\n`;
    Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([category, amount]) => {
        message += `• ${category}: Rp ${amount.toLocaleString('id-ID')}\n`;
      });
    message += '\n';
  }

  if (income - expenses < 0) {
    message += `⚠️ Anda mengeluarkan Rp ${(expenses - income).toLocaleString('id-ID')} lebih banyak dari yang Anda peroleh ${period}.\n`;
  } else if (income - expenses > 0) {
    message += `✅ Bagus! Anda berhasil menabung Rp ${(income - expenses).toLocaleString('id-ID')} ${period}.\n`;
  }

  message += `\n📱 Lihat analisis detail di aplikasi KeuanganKu`;

  await sendTelegramMessage(user.telegramId, message);
};

const sendDebtReminders = async (user) => {
  // Get debts due in the next 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const upcomingDebts = await Debt.find({
    userId: user._id,
    isPaid: false,
    dueDate: {
      $gte: new Date(),
      $lte: threeDaysFromNow
    }
  }).sort({ dueDate: 1 });

  if (upcomingDebts.length === 0) {
    return; // No reminders needed
  }

  let message = `🔔 **Pengingat Hutang**\n\n`;
  message += `Anda memiliki ${upcomingDebts.length} pembayaran yang akan jatuh tempo:\n\n`;

  upcomingDebts.forEach(debt => {
    const daysUntilDue = Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const urgency = daysUntilDue === 0 ? '🚨 JATUH TEMPO HARI INI' : 
                   daysUntilDue === 1 ? '⚠️ Jatuh tempo besok' : 
                   `📅 Jatuh tempo dalam ${daysUntilDue} hari`;
    
    message += `${urgency}\n`;
    message += `💳 **${debt.name}**: Rp ${debt.amount.toLocaleString('id-ID')}\n`;
    if (debt.description) {
      message += `📝 ${debt.description}\n`;
    }
    message += `📅 Jatuh tempo: ${debt.dueDate.toLocaleDateString('id-ID')}\n\n`;
  });

  message += `📱 Kelola hutang Anda di aplikasi KeuanganKu`;

  await sendTelegramMessage(user.telegramId, message);
};