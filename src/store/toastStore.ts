import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  message: string;
  description?: string;
  duration: number;
  isVisible: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'isVisible'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      isVisible: false,
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));
    
    // Trigger animation
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map(t => 
          t.id === id ? { ...t, isVisible: true } : t
        )
      }));
    }, 50);
    
    // Auto remove if duration > 0
    if (toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }
    
    return id;
  },
  
  removeToast: (id) => {
    // Trigger exit animation
    set((state) => ({
      toasts: state.toasts.map(t => 
        t.id === id ? { ...t, isVisible: false } : t
      )
    }));
    
    // Remove after animation
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 300);
  },
  
  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  },
  
  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for easy usage
export const toast = {
  success: (message: string, description?: string, duration = 4000) => {
    return useToastStore.getState().addToast({
      type: 'success',
      message,
      description,
      duration,
    });
  },
  
  error: (message: string, description?: string, duration = 6000) => {
    return useToastStore.getState().addToast({
      type: 'error',
      message,
      description,
      duration,
    });
  },
  
  info: (message: string, description?: string, duration = 4000) => {
    return useToastStore.getState().addToast({
      type: 'info',
      message,
      description,
      duration,
    });
  },
  
  warning: (message: string, description?: string, duration = 5000) => {
    return useToastStore.getState().addToast({
      type: 'warning',
      message,
      description,
      duration,
    });
  },
  
  loading: (message: string, description?: string) => {
    return useToastStore.getState().addToast({
      type: 'loading',
      message,
      description,
      duration: 0, // No auto dismiss
    });
  },
  
  dismiss: (id: string) => {
    useToastStore.getState().removeToast(id);
  },
  
  dismissAll: () => {
    useToastStore.getState().clearAll();
  },
};