// Environment Configuration for Production
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Default configuration
const defaultConfig = {
  // Server configuration
  PORT: 3001,
  NODE_ENV: 'development',
  
  // Database configuration
  MONGODB_URI: 'mongodb://localhost:27017/financeapp',
  
  // JWT configuration
  JWT_SECRET: 'your-super-secret-jwt-key-here-change-this-in-production',
  JWT_EXPIRES_IN: '7d',
  
  // API keys (empty by default)
  OPENAI_API_KEY: '',
  TELEGRAM_BOT_TOKEN: '',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Security
  CORS_ORIGIN: '*',
  
  // Performance
  COMPRESSION_ENABLED: true,
  CACHE_ENABLED: true,
  CACHE_TTL: 300 // 5 minutes
};

// Production validation
const validateEnv = () => {
  const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these variables in your .env file or environment');
    
    // In production, exit if required vars are missing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  // Warn about weak JWT secret in production
  if (process.env.NODE_ENV === 'production' && 
      process.env.JWT_SECRET === defaultConfig.JWT_SECRET) {
    console.error('⚠️ WARNING: Using default JWT_SECRET in production!');
    console.error('Please set a strong, unique JWT_SECRET for production use');
  }
};

// Create config object
export const config = {
  ...defaultConfig,
  ...process.env,
  
  // Derived values
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Convert string values to proper types
  PORT: parseInt(process.env.PORT || defaultConfig.PORT, 10),
  COMPRESSION_ENABLED: process.env.COMPRESSION_ENABLED !== 'false',
  CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || defaultConfig.CACHE_TTL, 10)
};

// Validate environment
validateEnv();

// Export config
export default config;