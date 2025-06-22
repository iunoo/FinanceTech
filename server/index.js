import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { config } from './config/env.js';
import { memoryConfig } from './config/memory.js';
import { createSecurityMiddleware } from './config/security.js';
import { createCompressionMiddleware } from './config/compression.js';
import { logger, createRequestLogger } from './config/logging.js';
import { dataRetentionConfig, safeCleanup } from './config/dataRetention.js';

// Import routes
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import debtRoutes from './routes/debts.js';
import analysisRoutes from './routes/analysis.js';
import telegramRoutes from './routes/telegram.js';
import settingsRoutes from './routes/settings.js';

// Import services
import { initializeTelegramBot } from './services/telegramBot.js';
import { sendScheduledReports } from './services/scheduler.js';
import { setupBackupScheduler } from './scripts/backup-scheduler.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

// Initialize Express app
const app = express();
const PORT = config.PORT || 3001;

// Create security middleware
const security = createSecurityMiddleware();

// Apply global middleware
app.use(helmet(security.helmetOptions));
app.use(cors(security.corsOptions));
app.use(express.json({ limit: memoryConfig.express.limit }));
app.use(express.urlencoded({ extended: true, limit: memoryConfig.express.limit }));

// Apply compression in production
if (config.isProd && config.COMPRESSION_ENABLED) {
  app.use(createCompressionMiddleware());
}

// Apply request logging
app.use(createRequestLogger());

// Database connection with better error handling
const connectToDatabase = async () => {
  try {
    const mongoUri = config.MONGODB_URI || 'mongodb://localhost:27017/financeapp';
    
    // Set connection options for better error handling
    const options = {
      serverSelectionTimeoutMS: memoryConfig.mongodb.serverSelectionTimeoutMS,
      socketTimeoutMS: memoryConfig.mongodb.socketTimeoutMS,
      maxPoolSize: memoryConfig.mongodb.maxPoolSize,
      minPoolSize: memoryConfig.mongodb.minPoolSize,
      maxIdleTimeMS: memoryConfig.mongodb.maxIdleTimeMS,
      family: 4, // Use IPv4, more reliable in many environments
    };

    await mongoose.connect(mongoUri, options);
    logger.info('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    logger.info('\n📋 To fix this issue:');
    logger.info('1. Make sure MongoDB is installed and running locally');
    logger.info('2. Or set MONGODB_URI in your .env file to a cloud MongoDB instance');
    logger.info('3. For local setup: brew install mongodb/brew/mongodb-community (macOS)');
    logger.info('4. Start MongoDB: brew services start mongodb/brew/mongodb-community');
    logger.info('5. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    
    if (config.isProd) {
      logger.error('❌ Exiting application due to database connection failure in production');
      process.exit(1);
    }
    
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

// Apply rate limiting in production
if (config.isProd) {
  app.use('/api/auth', security.rateLimiters.auth);
  app.use('/api', security.rateLimiters.api);
}

// Routes with database check middleware
app.use('/api/auth', checkDatabaseConnection, authRoutes);
app.use('/api/transactions', checkDatabaseConnection, authenticateToken, transactionRoutes);
app.use('/api/debts', checkDatabaseConnection, authenticateToken, debtRoutes);
app.use('/api/analysis', checkDatabaseConnection, authenticateToken, analysisRoutes);
app.use('/api/telegram', checkDatabaseConnection, authenticateToken, telegramRoutes);
app.use('/api/settings', checkDatabaseConnection, authenticateToken, settingsRoutes);

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
      nodeEnv: config.NODE_ENV,
      mongoUri: config.MONGODB_URI ? 'configured' : 'using default',
      openaiKey: config.OPENAI_API_KEY ? 'configured' : 'not configured',
      telegramToken: config.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'
    },
    memory: {
      usage: process.memoryUsage().rss / 1024 / 1024,
      unit: 'MB'
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
      connectionString: config.MONGODB_URI || 'mongodb://localhost:27017/financeapp'
    }
  });
});

// Serve static files in production
if (config.isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const staticPath = path.join(__dirname, '../dist');
  
  app.use(express.static(staticPath));
  
  // Serve index.html for all routes not starting with /api
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database connection
const startServer = async () => {
  const dbConnected = await connectToDatabase();
  
  // Initialize Telegram Bot only if database is connected
  if (dbConnected && config.TELEGRAM_BOT_TOKEN) {
    try {
      initializeTelegramBot();
      logger.info('✅ Telegram bot initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Telegram bot:', error.message);
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
    
    // Setup backup scheduler in production
    if (config.isProd) {
      setupBackupScheduler();
    }
    
    // Setup data retention cleanup
    if (config.isProd && dataRetentionConfig.logs.cleanupEnabled) {
      // Run cleanup at 3:30 AM every day
      cron.schedule('30 3 * * *', safeCleanup);
    }

    logger.info('✅ Scheduled tasks configured');
  } else {
    logger.warn('⚠️ Scheduled tasks disabled (database not connected)');
  }

  app.listen(PORT, () => {
    logger.info(`\n🚀 Server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    
    if (!config.isProd) {
      logger.info(`🔧 Database setup guide: http://localhost:${PORT}/api/setup/database`);
    }
    
    logger.info(`\n📋 Environment status:`);
    logger.info(`   Environment: ${config.NODE_ENV}`);
    logger.info(`   Database: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
    logger.info(`   OpenAI API: ${config.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    logger.info(`   Telegram Bot: ${config.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
    
    if (!dbConnected && !config.isProd) {
      logger.info(`\n💡 To enable database features:`);
      logger.info(`   Visit: http://localhost:${PORT}/api/setup/database`);
    }
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down server...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    logger.info('✅ Database connection closed');
  }
  process.exit(0);
});

// Start the server
startServer();