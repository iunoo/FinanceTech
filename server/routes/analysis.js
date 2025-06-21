import express from 'express';
import { generateFinancialAnalysis } from '../services/openaiService.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate AI analysis
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { timeRange } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        message: 'Layanan AI ChatGPT tidak tersedia. API key belum dikonfigurasi.',
        error: 'OPENAI_API_KEY_MISSING'
      });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get transactions for the period
    const transactions = await Transaction.find({
      userId: req.userId,
      date: {
        $gte: startDate,
        $lte: now
      }
    });

    // Calculate statistics
    const income = transactions
      .filter(t => t.type === 'income' && !t.isTransfer)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense' && !t.isTransfer)
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense' && !t.isTransfer)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Generate AI analysis
    const analysis = await generateFinancialAnalysis({
      timeRange,
      income,
      expenses,
      balance: income - expenses,
      categoryBreakdown,
      transactionCount: transactions.filter(t => !t.isTransfer).length
    });

    res.json({ analysis });
  } catch (error) {
    console.error('Analysis generation error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(503).json({ 
        message: 'API key OpenAI tidak valid atau telah kedaluwarsa',
        error: 'INVALID_API_KEY'
      });
    }
    
    res.status(500).json({ 
      message: 'Gagal menghasilkan analisis AI', 
      error: error.message 
    });
  }
});

// Check AI service status
router.get('/status', async (req, res) => {
  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasApiKey) {
      return res.json({ 
        status: 'offline',
        message: 'AI ChatGPT tidak aktif - OPENAI_API_KEY belum diatur'
      });
    }

    // Test API key validity by making a simple request
    try {
      const { generateFinancialAnalysis } = await import('../services/openaiService.js');
      
      // Quick test with minimal data
      await generateFinancialAnalysis({
        timeRange: 'test',
        income: 0,
        expenses: 0,
        balance: 0,
        categoryBreakdown: {},
        transactionCount: 0
      });
      
      res.json({ 
        status: 'online',
        message: 'AI ChatGPT (GPT-4o Mini) aktif dan siap digunakan'
      });
    } catch (error) {
      res.json({ 
        status: 'offline',
        message: 'AI ChatGPT tidak aktif - API key tidak valid atau bermasalah'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'offline',
      message: 'Gagal memeriksa status AI'
    });
  }
});

export default router;