// Database Optimization Script for Production
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file
const logFile = path.join(logDir, 'db-optimize.log');

// Log function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
};

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/financeapp';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 2
    });
    
    log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`);
    return false;
  }
};

// Create indexes
const createIndexes = async () => {
  try {
    log('Creating indexes...');
    
    // Get collections
    const db = mongoose.connection.db;
    
    // Transactions indexes
    log('Creating transaction indexes...');
    await db.collection('transactions').createIndex({ userId: 1, date: -1 });
    await db.collection('transactions').createIndex({ userId: 1, category: 1 });
    await db.collection('transactions').createIndex({ walletId: 1 });
    await db.collection('transactions').createIndex({ type: 1 });
    await db.collection('transactions').createIndex({ 'transactionId': 1 }, { unique: true });
    
    // Debts indexes
    log('Creating debt indexes...');
    await db.collection('debts').createIndex({ userId: 1, dueDate: 1 });
    await db.collection('debts').createIndex({ userId: 1, isPaid: 1 });
    await db.collection('debts').createIndex({ name: 1 });
    
    // User indexes
    log('Creating user indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    log('✅ Indexes created successfully');
    return true;
  } catch (error) {
    log(`❌ Failed to create indexes: ${error.message}`);
    return false;
  }
};

// Analyze database
const analyzeDatabase = async () => {
  try {
    log('Analyzing database...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    let totalDocuments = 0;
    let totalSize = 0;
    
    log('Collection statistics:');
    
    for (const collection of collections) {
      const stats = await db.command({ collStats: collection.name });
      const count = stats.count;
      const size = stats.size;
      const avgObjSize = stats.avgObjSize || 0;
      
      totalDocuments += count;
      totalSize += size;
      
      log(`- ${collection.name}: ${count} documents, ${formatBytes(size)}, avg ${formatBytes(avgObjSize)} per doc`);
    }
    
    log(`\nTotal: ${totalDocuments} documents, ${formatBytes(totalSize)}`);
    
    return {
      collections: collections.length,
      totalDocuments,
      totalSize
    };
  } catch (error) {
    log(`❌ Failed to analyze database: ${error.message}`);
    return null;
  }
};

// Format bytes to human-readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Optimize database
const optimizeDatabase = async () => {
  try {
    log('Optimizing database...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      log(`Optimizing collection: ${collection.name}...`);
      
      // Run compact command
      try {
        await db.command({ compact: collection.name });
        log(`✅ Compacted collection: ${collection.name}`);
      } catch (error) {
        log(`⚠️ Could not compact collection ${collection.name}: ${error.message}`);
      }
    }
    
    log('✅ Database optimization completed');
    return true;
  } catch (error) {
    log(`❌ Failed to optimize database: ${error.message}`);
    return false;
  }
};

// Clean up old data
const cleanupOldData = async () => {
  try {
    log('Cleaning up old data...');
    
    // We don't delete financial data, only logs and temporary data
    const db = mongoose.connection.db;
    
    // Clean up old logs (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    if (await db.collection('logs').countDocuments()) {
      const result = await db.collection('logs').deleteMany({
        createdAt: { $lt: ninetyDaysAgo }
      });
      
      log(`Deleted ${result.deletedCount} old log entries`);
    } else {
      log('No logs collection found');
    }
    
    // Clean up old cache (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (await db.collection('cache').countDocuments()) {
      const result = await db.collection('cache').deleteMany({
        createdAt: { $lt: sevenDaysAgo }
      });
      
      log(`Deleted ${result.deletedCount} old cache entries`);
    } else {
      log('No cache collection found');
    }
    
    log('✅ Cleanup completed');
    return true;
  } catch (error) {
    log(`❌ Failed to clean up old data: ${error.message}`);
    return false;
  }
};

// Main function
const main = async () => {
  log('🚀 Starting database optimization...');
  
  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    log('❌ Exiting due to database connection failure');
    process.exit(1);
  }
  
  // Analyze database before optimization
  log('\n📊 Database analysis before optimization:');
  const beforeStats = await analyzeDatabase();
  
  // Create indexes
  await createIndexes();
  
  // Optimize database
  await optimizeDatabase();
  
  // Clean up old data
  await cleanupOldData();
  
  // Analyze database after optimization
  log('\n📊 Database analysis after optimization:');
  const afterStats = await analyzeDatabase();
  
  // Calculate improvements
  if (beforeStats && afterStats) {
    const sizeDiff = beforeStats.totalSize - afterStats.totalSize;
    const percentImprovement = (sizeDiff / beforeStats.totalSize) * 100;
    
    log(`\n🎉 Optimization results:`);
    log(`- Size before: ${formatBytes(beforeStats.totalSize)}`);
    log(`- Size after: ${formatBytes(afterStats.totalSize)}`);
    log(`- Space saved: ${formatBytes(sizeDiff)} (${percentImprovement.toFixed(2)}%)`);
  }
  
  // Close database connection
  await mongoose.connection.close();
  log('✅ Database connection closed');
  
  log('✅ Database optimization completed successfully!');
};

// Run main function
main().catch(error => {
  log(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});