// Security Configuration for Production
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

export const securityConfig = {
  // CORS Configuration
  corsOptions: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://www.yourdomain.com'] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  
  // Helmet Configuration for HTTP Headers
  helmetOptions: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://images.pexels.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://api.telegram.org', 'https://api.openai.com']
      }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' }
  },
  
  // Rate Limiter Configuration
  rateLimitOptions: {
    standard: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 429, message: 'Terlalu banyak request, coba lagi nanti' }
    },
    auth: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 login attempts per hour
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 429, message: 'Terlalu banyak percobaan login, coba lagi nanti' }
    },
    api: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 300, // 300 API requests per 5 minutes
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 429, message: 'Batas API tercapai, coba lagi nanti' }
    }
  }
};

// Create middleware functions
export const createSecurityMiddleware = () => {
  const { corsOptions, helmetOptions, rateLimitOptions } = securityConfig;
  
  // Create rate limiters
  const standardLimiter = rateLimit(rateLimitOptions.standard);
  const authLimiter = rateLimit(rateLimitOptions.auth);
  const apiLimiter = rateLimit(rateLimitOptions.api);
  
  return {
    cors: cors(corsOptions),
    helmet: helmet(helmetOptions),
    rateLimiters: {
      standard: standardLimiter,
      auth: authLimiter,
      api: apiLimiter
    }
  };
};