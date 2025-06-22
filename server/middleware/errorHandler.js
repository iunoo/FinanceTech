// Error Handler Middleware for Production
import { logger } from '../config/logging.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Indicates if error is operational or programming
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';
  let errorCode = err.errorCode || 'SERVER_ERROR';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Data tidak valid';
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token tidak valid';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token telah kedaluwarsa';
    errorCode = 'TOKEN_EXPIRED';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Data sudah ada';
    errorCode = 'DUPLICATE_ENTRY';
  }
  
  // Log error
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      errorCode
    });
  } else {
    logger.warn({
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
      errorCode
    });
  }
  
  // Send response
  res.status(statusCode).json({
    status: 'error',
    message,
    errorCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route tidak ditemukan: ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
};