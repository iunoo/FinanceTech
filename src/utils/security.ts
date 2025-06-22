import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

// Secret key for encryption - in a real app, this would be in environment variables
const SECRET_KEY = 'finance-tech-secure-key-2025';

/**
 * Password hashing functions
 */
export const passwordUtils = {
  // Hash a password
  hashPassword: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  },
  
  // Compare a password with a hash
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  }
};

/**
 * Data encryption functions
 */
export const encryptionUtils = {
  // Encrypt sensitive data
  encrypt: (data: any): string => {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      SECRET_KEY
    ).toString();
  },
  
  // Decrypt sensitive data
  decrypt: (encryptedData: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
};

/**
 * Input sanitization functions
 */
export const sanitizationUtils = {
  // Sanitize string input to prevent XSS
  sanitizeString: (input: string): string => {
    if (!input) return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  },
  
  // Sanitize object by sanitizing all string properties
  sanitizeObject: <T extends Record<string, any>>(obj: T): T => {
    const result = { ...obj };
    
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = sanitizationUtils.sanitizeString(result[key]);
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = sanitizationUtils.sanitizeObject(result[key]);
      }
    }
    
    return result;
  }
};

/**
 * Session management functions
 */
export const sessionUtils = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Get last activity time
  getLastActivity: (): number => {
    const lastActivity = localStorage.getItem('lastActivity');
    return lastActivity ? parseInt(lastActivity, 10) : Date.now();
  },
  
  // Update last activity time
  updateLastActivity: (): void => {
    localStorage.setItem('lastActivity', Date.now().toString());
  },
  
  // Check if session is expired
  isSessionExpired: (): boolean => {
    const lastActivity = sessionUtils.getLastActivity();
    return Date.now() - lastActivity > sessionUtils.SESSION_TIMEOUT;
  }
};

/**
 * Validation functions
 */
export const validationUtils = {
  // Validate email
  isValidEmail: (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },
  
  // Validate password strength
  isStrongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
  },
  
  // Get password strength feedback
  getPasswordStrength: (password: string): { score: number; feedback: string } => {
    if (!password) return { score: 0, feedback: 'Password diperlukan' };
    
    let score = 0;
    let feedback = '';
    
    // Length check
    if (password.length < 8) {
      feedback = 'Password terlalu pendek (min. 8 karakter)';
    } else {
      score += 1;
    }
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Feedback based on score
    if (score < 2) {
      feedback = 'Password sangat lemah';
    } else if (score < 3) {
      feedback = 'Password lemah';
    } else if (score < 4) {
      feedback = 'Password cukup kuat';
    } else if (score < 5) {
      feedback = 'Password kuat';
    } else {
      feedback = 'Password sangat kuat';
    }
    
    return { score, feedback };
  }
};