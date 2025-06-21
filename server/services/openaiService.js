import OpenAI from 'openai';

let openai;

// Initialize OpenAI client
const initializeOpenAI = () => {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
};

// Initialize on startup
initializeOpenAI();

export const generateFinancialAnalysis = async (data) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return generateFallbackAnalysis(data);
    }

    // Reinitialize if needed
    if (!openai) {
      initializeOpenAI();
    }

    // Skip API call for test requests
    if (data.timeRange === 'test') {
      return 'Test berhasil - API ChatGPT siap digunakan';
    }

    const prompt = `
Analisis data keuangan berikut dan berikan wawasan serta rekomendasi dalam bahasa Indonesia:

Periode: ${data.timeRange}
Total Pemasukan: Rp ${data.income.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${data.expenses.toLocaleString('id-ID')}
Saldo Bersih: Rp ${data.balance.toLocaleString('id-ID')}
Jumlah Transaksi: ${data.transactionCount}

Rincian Pengeluaran per Kategori:
${Object.entries(data.categoryBreakdown)
  .map(([category, amount]) => `- ${category}: Rp ${amount.toLocaleString('id-ID')}`)
  .join('\n')}

Berikan:
1. Ringkasan situasi keuangan
2. Wawasan utama tentang pola pengeluaran
3. Rekomendasi spesifik untuk perbaikan
4. Saran anggaran
5. Peluang penghematan

Format respons dengan jelas dan dapat ditindaklanjuti dengan emoji untuk keterbacaan yang lebih baik.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Anda adalah penasihat keuangan profesional yang memberikan analisis keuangan personal dan rekomendasi dalam bahasa Indonesia. Berikan analisis yang praktis, mudah dipahami, dan dapat ditindaklanjuti. Gunakan format yang rapi dengan emoji untuk meningkatkan keterbacaan."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.status === 401) {
      throw new Error('API key OpenAI tidak valid atau telah kedaluwarsa');
    }
    
    if (error.status === 429) {
      throw new Error('Batas penggunaan API OpenAI terlampaui. Coba lagi nanti.');
    }
    
    if (error.status === 500) {
      throw new Error('Server OpenAI sedang bermasalah. Coba lagi nanti.');
    }
    
    return generateFallbackAnalysis(data);
  }
};

const generateFallbackAnalysis = (data) => {
  const { timeRange, income, expenses, balance, categoryBreakdown } = data;
  
  const topCategory = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)[0];
  
  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
  
  return `📊 **Analisis Keuangan - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}**

💰 **Ringkasan:**
- Pemasukan: Rp ${income.toLocaleString('id-ID')}
- Pengeluaran: Rp ${expenses.toLocaleString('id-ID')}
- Saldo Bersih: Rp ${balance.toLocaleString('id-ID')}
- Tingkat Tabungan: ${savingsRate}%

🎯 **Wawasan Utama:**
${topCategory ? `- Kategori pengeluaran terbesar adalah ${topCategory[0]} (Rp ${topCategory[1].toLocaleString('id-ID')})` : '- Tidak ada data pengeluaran tersedia'}
- ${balance >= 0 ? '✅ Anda berhasil mempertahankan saldo positif periode ini' : '⚠️ Pengeluaran Anda melebihi pemasukan'}
- ${Object.keys(categoryBreakdown).length} kategori pengeluaran berbeda tercatat

💡 **Rekomendasi:**
${balance < 0 ? '- 🚨 Fokus pada pengurangan pengeluaran untuk menghindari defisit' : '- 🎉 Pertahankan arus kas positif yang baik!'}
${topCategory && topCategory[1] > expenses * 0.3 ? `- Pertimbangkan untuk mengurangi pengeluaran di kategori ${topCategory[0]}` : '- Distribusi pengeluaran Anda terlihat seimbang'}
- Siapkan transfer tabungan otomatis
- Lacak pengeluaran harian lebih ketat
- Tinjau dan optimalkan langganan berulang

📈 **Langkah Selanjutnya:**
- Buat anggaran berdasarkan kategori
- Siapkan dana darurat jika belum ada
- Pertimbangkan peluang investasi untuk dana surplus

⚠️ **Catatan:** Analisis ini menggunakan mode fallback. Untuk analisis AI yang lebih mendalam dengan GPT-4o Mini, pastikan API key OpenAI sudah dikonfigurasi di pengaturan.`;
};