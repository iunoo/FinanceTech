import { pdfGenerator } from './pdfGenerator';

interface TelegramReportData {
  userId: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: any[];
  categoryBreakdown: Record<string, number>;
  walletBalances: any[];
  debts: any[];
  analysis?: string;
}

export class TelegramReportService {
  
  static async sendFinancialReport(
    telegramId: string, 
    reportData: TelegramReportData,
    reportType: 'daily' | 'weekly' | 'monthly'
  ): Promise<{ success: boolean; message: string }> {
    
    try {
      // Generate AI analysis first
      const aiAnalysis = await this.generateAIAnalysis(reportData);
      
      // Create comprehensive report message
      const message = this.createReportMessage(reportData, reportType, aiAnalysis);
      
      // Generate PDF report
      const pdfBlob = pdfGenerator.generateFinancialReport({
        ...reportData,
        analysis: aiAnalysis
      });
      
      // Send to Telegram with PDF attachment
      const result = await this.sendTelegramReport(telegramId, message, pdfBlob, reportType);
      
      return result;
      
    } catch (error) {
      console.error('Error sending Telegram report:', error);
      return {
        success: false,
        message: 'Gagal mengirim laporan ke Telegram'
      };
    }
  }
  
  private static async generateAIAnalysis(data: TelegramReportData): Promise<string> {
    try {
      // Use the existing AI analysis service
      const response = await fetch('/api/analysis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          timeRange: 'month',
          customData: data
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.analysis;
      } else {
        return this.generateFallbackAnalysis(data);
      }
    } catch (error) {
      return this.generateFallbackAnalysis(data);
    }
  }
  
  private static generateFallbackAnalysis(data: TelegramReportData): string {
    const savingsRate = data.totalIncome > 0 ? ((data.balance / data.totalIncome) * 100).toFixed(1) : '0';
    const topCategory = Object.entries(data.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    return `📊 **Analisis Keuangan ${data.period}**

💰 **Ringkasan:**
- Pemasukan: Rp ${data.totalIncome.toLocaleString('id-ID')}
- Pengeluaran: Rp ${data.totalExpenses.toLocaleString('id-ID')}
- Saldo Bersih: Rp ${data.balance.toLocaleString('id-ID')}
- Tingkat Tabungan: ${savingsRate}%

🎯 **Wawasan Utama:**
${topCategory ? `- Kategori pengeluaran terbesar: ${topCategory[0]} (Rp ${topCategory[1].toLocaleString('id-ID')})` : '- Tidak ada data pengeluaran'}
- ${data.balance >= 0 ? '✅ Saldo positif - keuangan sehat!' : '⚠️ Defisit - perlu evaluasi pengeluaran'}
- Total ${data.transactions.length} transaksi tercatat

💡 **Rekomendasi:**
${data.balance < 0 ? '- 🚨 Kurangi pengeluaran untuk menghindari defisit' : '- 🎉 Pertahankan arus kas positif!'}
- Siapkan dana darurat minimal 3x pengeluaran bulanan
- Evaluasi kategori pengeluaran terbesar
- Pertimbangkan investasi untuk dana surplus

📈 **Aksi Selanjutnya:**
- Buat anggaran berdasarkan kategori
- Monitor pengeluaran harian
- Tingkatkan sumber pemasukan jika memungkinkan`;
  }
  
  private static createReportMessage(
    data: TelegramReportData, 
    reportType: string,
    aiAnalysis: string
  ): string {
    const reportTitle = `📊 **Laporan Keuangan ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}**`;
    const period = data.period;
    
    let message = `${reportTitle}\n`;
    message += `📅 **Periode**: ${period}\n\n`;
    
    // Financial Summary
    message += `💰 **Ringkasan Keuangan:**\n`;
    message += `• Pemasukan: Rp ${data.totalIncome.toLocaleString('id-ID')}\n`;
    message += `• Pengeluaran: Rp ${data.totalExpenses.toLocaleString('id-ID')}\n`;
    message += `• Saldo Bersih: Rp ${data.balance.toLocaleString('id-ID')}\n`;
    message += `• Status: ${data.balance >= 0 ? '✅ SURPLUS' : '❌ DEFISIT'}\n\n`;
    
    // Top Categories
    if (Object.keys(data.categoryBreakdown).length > 0) {
      message += `📈 **Kategori Pengeluaran Teratas:**\n`;
      Object.entries(data.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, amount], index) => {
          message += `${index + 1}. ${category}: Rp ${amount.toLocaleString('id-ID')}\n`;
        });
      message += '\n';
    }
    
    // Wallet Balances
    message += `💳 **Saldo Dompet:**\n`;
    data.walletBalances.forEach(wallet => {
      const status = wallet.balance >= 0 ? '✅' : '❌';
      message += `${status} ${wallet.name}: Rp ${wallet.balance.toLocaleString('id-ID')}\n`;
    });
    message += '\n';
    
    // Debt Summary
    const activeDebts = data.debts.filter(d => !d.isPaid);
    if (activeDebts.length > 0) {
      message += `⚠️ **Utang & Piutang Aktif:**\n`;
      activeDebts.slice(0, 3).forEach(debt => {
        const icon = debt.type === 'debt' ? '🔴' : '🟢';
        message += `${icon} ${debt.name}: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\n`;
      });
      if (activeDebts.length > 3) {
        message += `... dan ${activeDebts.length - 3} lainnya\n`;
      }
      message += '\n';
    }
    
    // AI Analysis
    message += `🤖 **Analisis AI (GPT-4o Mini):**\n`;
    message += aiAnalysis + '\n\n';
    
    // Footer
    message += `📄 **Laporan PDF lengkap terlampir**\n`;
    message += `⏰ Dibuat: ${new Date().toLocaleString('id-ID')}\n`;
    message += `📱 KeuanganKu - Personal Finance Management`;
    
    return message;
  }
  
  private static async sendTelegramReport(
    telegramId: string, 
    message: string, 
    pdfBlob: Blob,
    reportType: string
  ): Promise<{ success: boolean; message: string }> {
    
    try {
      // First send the text message
      const textResponse = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          telegramId,
          message
        })
      });
      
      if (!textResponse.ok) {
        throw new Error('Failed to send text message');
      }
      
      // Then send the PDF document
      const formData = new FormData();
      formData.append('telegramId', telegramId);
      formData.append('document', pdfBlob, `laporan-keuangan-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
      formData.append('caption', `📄 Laporan Keuangan ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - ${new Date().toLocaleDateString('id-ID')}`);
      
      const documentResponse = await fetch('/api/telegram/send-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!documentResponse.ok) {
        throw new Error('Failed to send PDF document');
      }
      
      return {
        success: true,
        message: 'Laporan berhasil dikirim ke Telegram dengan PDF'
      };
      
    } catch (error) {
      console.error('Telegram send error:', error);
      return {
        success: false,
        message: 'Gagal mengirim laporan ke Telegram'
      };
    }
  }
  
  static async sendDebtReminder(
    telegramId: string, 
    debts: any[],
    reminderType: 'daily' | 'urgent' | 'overdue'
  ): Promise<{ success: boolean; message: string }> {
    
    try {
      let message = '';
      
      switch (reminderType) {
        case 'daily':
          message = this.createDailyDebtReminder(debts);
          break;
        case 'urgent':
          message = this.createUrgentDebtReminder(debts);
          break;
        case 'overdue':
          message = this.createOverdueDebtReminder(debts);
          break;
      }
      
      const response = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          telegramId,
          message
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Pengingat utang berhasil dikirim'
        };
      } else {
        throw new Error('Failed to send reminder');
      }
      
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengirim pengingat utang'
      };
    }
  }
  
  private static createDailyDebtReminder(debts: any[]): string {
    const upcomingDebts = debts.filter(debt => {
      const daysUntilDue = Math.ceil((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    });
    
    if (upcomingDebts.length === 0) return '';
    
    let message = `🔔 **Pengingat Utang Harian**\n\n`;
    message += `Anda memiliki ${upcomingDebts.length} kewajiban yang akan jatuh tempo:\n\n`;
    
    upcomingDebts.forEach(debt => {
      const daysUntilDue = Math.ceil((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const urgency = daysUntilDue === 0 ? '🚨 HARI INI' : 
                     daysUntilDue === 1 ? '⚠️ BESOK' : 
                     `📅 ${daysUntilDue} hari lagi`;
      
      message += `${urgency}\n`;
      message += `💳 **${debt.name}**: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\n`;
      message += `📅 Jatuh tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID')}\n\n`;
    });
    
    message += `📱 Kelola di aplikasi KeuanganKu`;
    
    return message;
  }
  
  private static createUrgentDebtReminder(debts: any[]): string {
    let message = `🚨 **PENGINGAT MENDESAK**\n\n`;
    message += `Utang/Piutang berikut akan jatuh tempo dalam 24 jam:\n\n`;
    
    debts.forEach(debt => {
      message += `💳 **${debt.name}**\n`;
      message += `💰 Jumlah: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\n`;
      message += `⏰ Jatuh tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID')}\n`;
      if (debt.description) {
        message += `📝 ${debt.description}\n`;
      }
      message += '\n';
    });
    
    message += `⚡ **SEGERA AMBIL TINDAKAN!**\n`;
    message += `📱 Buka aplikasi KeuanganKu untuk memproses pembayaran`;
    
    return message;
  }
  
  private static createOverdueDebtReminder(debts: any[]): string {
    let message = `🚨 **PERINGATAN: UTANG TERLAMBAT**\n\n`;
    message += `Kewajiban berikut sudah melewati tanggal jatuh tempo:\n\n`;
    
    debts.forEach(debt => {
      const daysOverdue = Math.ceil((new Date().getTime() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      message += `❌ **${debt.name}**\n`;
      message += `💰 Jumlah: Rp ${debt.remainingAmount.toLocaleString('id-ID')}\n`;
      message += `⏰ Terlambat: ${daysOverdue} hari\n`;
      message += `📅 Seharusnya: ${new Date(debt.dueDate).toLocaleDateString('id-ID')}\n\n`;
    });
    
    message += `🚨 **TINDAKAN DIPERLUKAN SEGERA!**\n`;
    message += `📱 Segera buka aplikasi KeuanganKu untuk menyelesaikan pembayaran`;
    
    return message;
  }
}