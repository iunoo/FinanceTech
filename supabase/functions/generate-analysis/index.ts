// Supabase Edge Function for generating financial analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface AnalysisRequest {
  timeRange: string;
  customData?: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    categoryBreakdown: Record<string, number>;
    transactionCount: number;
  };
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { timeRange, customData } = await req.json() as AnalysisRequest;

    // Skip API call for test requests
    if (timeRange === 'test') {
      return new Response(
        JSON.stringify({ analysis: 'Test berhasil - API ChatGPT siap digunakan' }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    // Create prompt based on data
    let prompt = `
Analisis data keuangan berikut dan berikan wawasan serta rekomendasi dalam bahasa Indonesia:

Periode: ${timeRange}
`;

    if (customData) {
      prompt += `
Total Pemasukan: Rp ${customData.totalIncome.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${customData.totalExpenses.toLocaleString('id-ID')}
Saldo Bersih: Rp ${customData.balance.toLocaleString('id-ID')}
Jumlah Transaksi: ${customData.transactionCount}

Rincian Pengeluaran per Kategori:
${Object.entries(customData.categoryBreakdown)
  .map(([category, amount]) => `- ${category}: Rp ${amount.toLocaleString('id-ID')}`)
  .join('\n')}
`;
    }

    prompt += `
Berikan:
1. Ringkasan situasi keuangan
2. Wawasan utama tentang pola pengeluaran
3. Rekomendasi spesifik untuk perbaikan
4. Saran anggaran
5. Peluang penghematan

Format respons dengan jelas dan dapat ditindaklanjuti dengan emoji untuk keterbacaan yang lebih baik.
`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
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
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(
        `OpenAI API error: ${openaiData.error?.message || "Unknown error"}`
      );
    }

    const analysis = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  } catch (error) {
    console.error("Error generating analysis:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate analysis",
        fallbackAnalysis: generateFallbackAnalysis()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  }
});

function generateFallbackAnalysis() {
  return `📊 **Analisis Keuangan**

💰 **Ringkasan:**
- Periksa rasio pemasukan dan pengeluaran Anda
- Pantau tren pengeluaran per kategori
- Evaluasi keseimbangan keuangan Anda

🎯 **Rekomendasi:**
- Buat anggaran berdasarkan kategori
- Siapkan dana darurat minimal 3x pengeluaran bulanan
- Evaluasi pengeluaran non-esensial
- Pertimbangkan peluang untuk meningkatkan pendapatan

⚠️ **Catatan:** Analisis ini menggunakan mode fallback. Untuk analisis AI yang lebih mendalam dengan GPT-4o Mini, pastikan API key OpenAI sudah dikonfigurasi di pengaturan.`;
}