import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import debtRoutes from './routes/debts.js';
import analysisRoutes from './routes/analysis.js';
import telegramRoutes from './routes/telegram.js';
import settingsRoutes from './routes/settings.js';
import { initializeTelegramBot } from './services/telegramBot.js';
import { sendScheduledReports } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection with better error handling
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/financeapp';
    
    // Set connection options for better error handling
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n📋 To fix this issue:');
    console.log('1. Make sure MongoDB is installed and running locally');
    console.log('2. Or set MONGODB_URI in your .env file to a cloud MongoDB instance');
    console.log('3. For local setup: brew install mongodb/brew/mongodb-community (macOS)');
    console.log('4. Start MongoDB: brew services start mongodb/brew/mongodb-community');
    console.log('5. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    console.log('\n⚠️  Server will continue running but database features will be unavailable\n');
    return false;
  }
};

// Middleware to check database connection
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'MongoDB connection is not established. Please check your database configuration.',
      setup: {
        local: 'Install and start MongoDB locally',
        cloud: 'Use MongoDB Atlas or another cloud provider',
        env: 'Set MONGODB_URI in your .env file'
      }
    });
  }
  next();
};

// Routes with database check middleware
app.use('/api/auth', checkDatabaseConnection, authRoutes);
app.use('/api/transactions', checkDatabaseConnection, transactionRoutes);
app.use('/api/debts', checkDatabaseConnection, debtRoutes);
app.use('/api/analysis', checkDatabaseConnection, analysisRoutes);
app.use('/api/telegram', checkDatabaseConnection, telegramRoutes);
app.use('/api/settings', checkDatabaseConnection, settingsRoutes);

// Health check with database status
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    environment: {
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'using default',
      openaiKey: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      telegramToken: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'
    }
  });
});

// Database setup endpoint for development
app.get('/api/setup/database', (req, res) => {
  res.json({
    message: 'Database Setup Instructions',
    steps: [
      {
        step: 1,
        title: 'Local MongoDB Setup',
        instructions: [
          'Install MongoDB Community Edition',
          'macOS: brew install mongodb/brew/mongodb-community',
          'Ubuntu: sudo apt-get install mongodb',
          'Windows: Download from mongodb.com'
        ]
      },
      {
        step: 2,
        title: 'Start MongoDB Service',
        instructions: [
          'macOS: brew services start mongodb/brew/mongodb-community',
          'Ubuntu: sudo systemctl start mongod',
          'Windows: Start MongoDB service from Services panel'
        ]
      },
      {
        step: 3,
        title: 'Cloud Alternative (MongoDB Atlas)',
        instructions: [
          'Visit https://www.mongodb.com/atlas',
          'Create a free cluster',
          'Get connection string',
          'Add to .env file as MONGODB_URI'
        ]
      }
    ],
    currentStatus: {
      connected: mongoose.connection.readyState === 1,
      connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/financeapp'
    }
  });
});

// Initialize database connection
const startServer = async () => {
  const dbConnected = await connectToDatabase();
  
  // Initialize Telegram Bot only if database is connected
  if (dbConnected && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      initializeTelegramBot();
      console.log('✅ Telegram bot initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
  }

  // Schedule reports only if database is connected
  if (dbConnected) {
    // Daily reports at 9 AM
    cron.schedule('0 9 * * *', () => {
      sendScheduledReports('daily');
    });

    // Weekly reports on Monday at 9 AM
    cron.schedule('0 9 * * 1', () => {
      sendScheduledReports('weekly');
    });

    // Monthly reports on 1st day at 9 AM
    cron.schedule('0 9 1 * *', () => {
      sendScheduledReports('monthly');
    });

    // Debt reminders daily at 10 AM
    cron.schedule('0 10 * * *', () => {
      sendScheduledReports('debt-reminders');
    });

    console.log('✅ Scheduled reports configured');
  } else {
    console.log('⚠️  Scheduled reports disabled (database not connected)');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Database setup guide: http://localhost:${PORT}/api/setup/database`);
    console.log(`\n📋 Environment status:`);
    console.log(`   Database: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
    
    if (!dbConnected) {
      console.log(`\n💡 To enable database features:`);
      console.log(`   Visit: http://localhost:${PORT}/api/setup/database`);
    }
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

// Start the server
startServer();