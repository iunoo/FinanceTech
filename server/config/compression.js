// Compression Configuration for Production
import compression from 'compression';

// Determine if request should be compressed
const shouldCompress = (req, res) => {
  // Don't compress if client doesn't accept gzip
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Use compression filter
  return compression.filter(req, res);
};

// Create compression middleware with optimal settings
export const createCompressionMiddleware = () => {
  return compression({
    filter: shouldCompress,
    level: 6, // Balance between compression ratio and CPU usage
    threshold: 1024, // Only compress responses larger than 1KB
    memLevel: 8, // Use more memory for better compression
    chunkSize: 16 * 1024 // 16KB chunks
  });
};