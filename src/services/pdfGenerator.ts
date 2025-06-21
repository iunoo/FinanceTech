import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FinancialReportData {
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

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  generateFinancialReport(data: FinancialReportData): Blob {
    this.doc = new jsPDF();
    
    // Header
    this.addHeader();
    
    // Summary Section
    this.addSummarySection(data);
    
    // Transaction Details
    this.addTransactionSection(data);
    
    // Category Breakdown
    this.addCategorySection(data);
    
    // Wallet Balances
    this.addWalletSection(data);
    
    // Debt Summary
    this.addDebtSection(data);
    
    // AI Analysis (if available)
    if (data.analysis) {
      this.addAnalysisSection(data.analysis);
    }
    
    // Footer
    this.addFooter();
    
    return this.doc.output('blob');
  }

  private addHeader() {
    const now = new Date();
    
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('KeuanganKu - Personal Finance Management', 105, 30, { align: 'center' });
    
    // Date
    this.doc.setFontSize(10);
    this.doc.text(`Dibuat: ${now.toLocaleString('id-ID')}`, 105, 40, { align: 'center' });
    
    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 45, 190, 45);
  }

  private addSummarySection(data: FinancialReportData) {
    let yPos = 55;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RINGKASAN KEUANGAN', 20, yPos);
    
    yPos += 10;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Summary table
    const summaryData = [
      ['Periode', data.period],
      ['Total Pemasukan', `Rp ${data.totalIncome.toLocaleString('id-ID')}`],
      ['Total Pengeluaran', `Rp ${data.totalExpenses.toLocaleString('id-ID')}`],
      ['Saldo Bersih', `Rp ${data.balance.toLocaleString('id-ID')}`],
      ['Status', data.balance >= 0 ? 'SURPLUS' : 'DEFISIT']
    ];

    (this.doc as any).autoTable({
      startY: yPos,
      head: [['Keterangan', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });
  }

  private addTransactionSection(data: FinancialReportData) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RIWAYAT TRANSAKSI', 20, finalY);
    
    // Prepare transaction data
    const transactionData = data.transactions
      .filter(t => !t.isTransfer && !t.isBalanceAdjustment)
      .slice(0, 20) // Limit to 20 recent transactions
      .map(t => [
        t.transactionId,
        new Date(t.date).toLocaleDateString('id-ID'),
        t.category,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        `Rp ${t.amount.toLocaleString('id-ID')}`,
        t.description || '-'
      ]);

    (this.doc as any).autoTable({
      startY: finalY + 5,
      head: [['ID', 'Tanggal', 'Kategori', 'Jenis', 'Jumlah', 'Keterangan']],
      body: transactionData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' }
      }
    });
  }

  private addCategorySection(data: FinancialReportData) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PENGELUARAN PER KATEGORI', 20, finalY);
    
    const categoryData = Object.entries(data.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([category, amount]) => [
        category,
        `Rp ${amount.toLocaleString('id-ID')}`,
        `${((amount / data.totalExpenses) * 100).toFixed(1)}%`
      ]);

    (this.doc as any).autoTable({
      startY: finalY + 5,
      head: [['Kategori', 'Jumlah', 'Persentase']],
      body: categoryData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 20, right: 20 }
    });
  }

  private addWalletSection(data: FinancialReportData) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SALDO DOMPET', 20, finalY);
    
    const walletData = data.walletBalances.map(wallet => [
      wallet.name,
      wallet.type,
      `Rp ${wallet.balance.toLocaleString('id-ID')}`,
      wallet.balance >= 0 ? 'Normal' : 'Negatif'
    ]);

    (this.doc as any).autoTable({
      startY: finalY + 5,
      head: [['Nama Dompet', 'Jenis', 'Saldo', 'Status']],
      body: walletData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 20, right: 20 }
    });
  }

  private addDebtSection(data: FinancialReportData) {
    if (data.debts.length === 0) return;
    
    const finalY = (this.doc as any).lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('UTANG & PIUTANG', 20, finalY);
    
    const debtData = data.debts
      .filter(d => !d.isPaid)
      .map(debt => [
        debt.name,
        debt.type === 'debt' ? 'Utang' : 'Piutang',
        `Rp ${debt.remainingAmount.toLocaleString('id-ID')}`,
        new Date(debt.dueDate).toLocaleDateString('id-ID'),
        debt.description || '-'
      ]);

    if (debtData.length > 0) {
      (this.doc as any).autoTable({
        startY: finalY + 5,
        head: [['Nama', 'Jenis', 'Sisa', 'Jatuh Tempo', 'Keterangan']],
        body: debtData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 20, right: 20 }
      });
    }
  }

  private addAnalysisSection(analysis: string) {
    // Check if we need a new page
    const currentY = (this.doc as any).lastAutoTable?.finalY || 100;
    if (currentY > 250) {
      this.doc.addPage();
      var yPos = 20;
    } else {
      var yPos = currentY + 15;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ANALISIS AI (GPT-4o Mini)', 20, yPos);
    
    yPos += 10;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    // Split analysis text into lines
    const lines = this.doc.splitTextToSize(analysis, 170);
    
    // Add analysis text
    lines.forEach((line: string, index: number) => {
      if (yPos > 280) {
        this.doc.addPage();
        yPos = 20;
      }
      this.doc.text(line, 20, yPos);
      yPos += 5;
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setLineWidth(0.5);
      this.doc.line(20, 285, 190, 285);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('KeuanganKu - Personal Finance Management', 20, 292);
      this.doc.text(`Halaman ${i} dari ${pageCount}`, 190, 292, { align: 'right' });
      
      // Disclaimer
      this.doc.setFontSize(7);
      this.doc.text('Laporan ini dibuat secara otomatis oleh sistem KeuanganKu', 105, 297, { align: 'center' });
    }
  }
}

export const pdfGenerator = new PDFGenerator();