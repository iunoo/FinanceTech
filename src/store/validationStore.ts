import { create } from 'zustand';

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'email' | 'number' | 'positive' | 'custom' | 'currency' | 'date' | 'phone';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface ValidationSchema {
  [formName: string]: ValidationRule[];
}

interface ValidationState {
  schemas: ValidationSchema;
  
  // Actions
  registerSchema: (formName: string, rules: ValidationRule[]) => void;
  addRule: (formName: string, rule: ValidationRule) => void;
  removeRule: (formName: string, field: string) => void;
  validate: (formName: string, data: Record<string, any>) => ValidationResult;
  validateField: (rule: ValidationRule, value: any) => { error: string | null; warning: string | null };
  validateTransaction: (transaction: any) => ValidationResult;
  validateDebt: (debt: any) => ValidationResult;
  validateWallet: (wallet: any) => ValidationResult;
  sanitizeInput: (value: any, type: string) => any;
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  schemas: {
    // Transaction validation schema
    transaction: [
      { field: 'amount', rule: 'required', message: 'Jumlah wajib diisi' },
      { field: 'amount', rule: 'positive', message: 'Jumlah harus lebih dari 0' },
      { field: 'amount', rule: 'max', value: 999999999, message: 'Jumlah terlalu besar' },
      { field: 'category', rule: 'required', message: 'Kategori wajib dipilih' },
      { field: 'walletId', rule: 'required', message: 'Dompet wajib dipilih' },
      { field: 'date', rule: 'required', message: 'Tanggal wajib diisi' },
      { field: 'date', rule: 'date', message: 'Format tanggal tidak valid' }
    ],
    
    // Debt validation schema
    debt: [
      { field: 'name', rule: 'required', message: 'Nama wajib diisi' },
      { field: 'name', rule: 'min', value: 2, message: 'Nama minimal 2 karakter' },
      { field: 'amount', rule: 'required', message: 'Jumlah wajib diisi' },
      { field: 'amount', rule: 'positive', message: 'Jumlah harus lebih dari 0' },
      { field: 'dueDate', rule: 'required', message: 'Tanggal jatuh tempo wajib diisi' },
      { field: 'dueDate', rule: 'date', message: 'Format tanggal tidak valid' },
      { field: 'type', rule: 'required', message: 'Jenis utang/piutang wajib dipilih' }
    ],
    
    // Wallet validation schema
    wallet: [
      { field: 'name', rule: 'required', message: 'Nama dompet wajib diisi' },
      { field: 'name', rule: 'min', value: 2, message: 'Nama minimal 2 karakter' },
      { field: 'name', rule: 'max', value: 50, message: 'Nama maksimal 50 karakter' },
      { field: 'type', rule: 'required', message: 'Jenis dompet wajib dipilih' },
      { field: 'balance', rule: 'number', message: 'Saldo harus berupa angka' }
    ],
    
    // User profile validation schema
    profile: [
      { field: 'name', rule: 'required', message: 'Nama wajib diisi' },
      { field: 'name', rule: 'min', value: 2, message: 'Nama minimal 2 karakter' },
      { field: 'email', rule: 'required', message: 'Email wajib diisi' },
      { field: 'email', rule: 'email', message: 'Format email tidak valid' }
    ]
  },
  
  registerSchema: (formName, rules) => {
    set((state) => ({
      schemas: {
        ...state.schemas,
        [formName]: rules
      }
    }));
  },
  
  addRule: (formName, rule) => {
    set((state) => ({
      schemas: {
        ...state.schemas,
        [formName]: [...(state.schemas[formName] || []), rule]
      }
    }));
  },
  
  removeRule: (formName, field) => {
    set((state) => ({
      schemas: {
        ...state.schemas,
        [formName]: (state.schemas[formName] || []).filter(r => r.field !== field)
      }
    }));
  },
  
  validate: (formName, data) => {
    const { schemas, validateField } = get();
    const formRules = schemas[formName] || [];
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    
    formRules.forEach(rule => {
      const value = data[rule.field];
      const result = validateField(rule, value);
      
      if (result.error) {
        errors[rule.field] = result.error;
      }
      
      if (result.warning) {
        warnings[rule.field] = result.warning;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  },
  
  validateField: (rule, value) => {
    let error: string | null = null;
    let warning: string | null = null;
    
    switch (rule.rule) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = rule.message;
        }
        break;
        
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          error = rule.message;
        }
        if (typeof value === 'string' && value.length < rule.value) {
          error = rule.message;
        }
        break;
        
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          error = rule.message;
        }
        if (typeof value === 'string' && value.length > rule.value) {
          error = rule.message;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          error = rule.message;
        }
        break;
        
      case 'number':
        if (value && isNaN(Number(value))) {
          error = rule.message;
        }
        break;
        
      case 'positive':
        if (typeof value === 'number' && value <= 0) {
          error = rule.message;
        }
        break;
        
      case 'currency':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          error = rule.message;
        }
        if (Number(value) > 1000000000) {
          warning = 'Jumlah sangat besar, pastikan sudah benar';
        }
        break;
        
      case 'date':
        if (value && isNaN(Date.parse(value))) {
          error = rule.message;
        }
        if (value && new Date(value) > new Date()) {
          warning = 'Tanggal di masa depan';
        }
        break;
        
      case 'phone':
        const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
        if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
          error = rule.message;
        }
        break;
        
      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          error = rule.message;
        }
        break;
    }
    
    return { error, warning };
  },
  
  validateTransaction: (transaction) => {
    const { validate } = get();
    
    // Additional business logic validation
    const result = validate('transaction', transaction);
    
    // Check wallet balance for expenses
    if (transaction.type === 'expense' && transaction.walletId) {
      // This would need to check actual wallet balance
      // For now, we'll add a warning
      if (transaction.amount > 10000000) {
        result.warnings.amount = 'Pengeluaran sangat besar, pastikan saldo mencukupi';
      }
    }
    
    // Check for duplicate transactions
    if (transaction.description && transaction.description.length < 3) {
      result.warnings.description = 'Deskripsi terlalu singkat, pertimbangkan untuk menambah detail';
    }
    
    return result;
  },
  
  validateDebt: (debt) => {
    const { validate } = get();
    const result = validate('debt', debt);
    
    // Business logic validation
    if (debt.dueDate && new Date(debt.dueDate) < new Date()) {
      result.warnings.dueDate = 'Tanggal jatuh tempo sudah lewat';
    }
    
    if (debt.amount > 100000000) {
      result.warnings.amount = 'Jumlah sangat besar, pastikan sudah benar';
    }
    
    return result;
  },
  
  validateWallet: (wallet) => {
    const { validate } = get();
    const result = validate('wallet', wallet);
    
    // Check for duplicate wallet names
    // This would need to check against existing wallets
    
    if (wallet.balance && wallet.balance < 0) {
      result.warnings.balance = 'Saldo negatif terdeteksi';
    }
    
    return result;
  },
  
  sanitizeInput: (value, type) => {
    if (value === null || value === undefined) return value;
    
    switch (type) {
      case 'string':
        return String(value).trim();
        
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
        
      case 'currency':
        const currency = Number(value);
        return isNaN(currency) ? 0 : Math.max(0, Math.round(currency));
        
      case 'email':
        return String(value).toLowerCase().trim();
        
      case 'phone':
        return String(value).replace(/\s/g, '');
        
      case 'date':
        return value instanceof Date ? value.toISOString().split('T')[0] : value;
        
      default:
        return value;
    }
  }
}));

// Validation helper functions
export const validationHelpers = {
  // Quick validation functions
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidCurrency: (amount: any): boolean => {
    const num = Number(amount);
    return !isNaN(num) && num >= 0 && num <= 999999999;
  },
  
  isValidDate: (date: any): boolean => {
    return !isNaN(Date.parse(date));
  },
  
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  // Sanitization functions
  sanitizeCurrency: (amount: any): number => {
    const num = Number(amount);
    return isNaN(num) ? 0 : Math.max(0, Math.round(num));
  },
  
  sanitizeString: (str: any): string => {
    return String(str || '').trim();
  },
  
  // Business logic validators
  validateTransactionAmount: (amount: number, walletBalance: number, type: 'income' | 'expense'): { isValid: boolean; message?: string } => {
    if (amount <= 0) {
      return { isValid: false, message: 'Jumlah harus lebih dari 0' };
    }
    
    if (type === 'expense' && amount > walletBalance) {
      return { isValid: false, message: 'Saldo tidak mencukupi' };
    }
    
    if (amount > 999999999) {
      return { isValid: false, message: 'Jumlah terlalu besar' };
    }
    
    return { isValid: true };
  },
  
  validateDebtAmount: (amount: number, remainingAmount: number): { isValid: boolean; message?: string } => {
    if (amount <= 0) {
      return { isValid: false, message: 'Jumlah pembayaran harus lebih dari 0' };
    }
    
    if (amount > remainingAmount) {
      return { isValid: false, message: 'Pembayaran tidak boleh melebihi sisa kewajiban' };
    }
    
    return { isValid: true };
  }
};