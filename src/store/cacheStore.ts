import { create } from 'zustand';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

interface CacheState {
  cache: Record<string, CacheEntry<any>>;
  stats: CacheStats;
  
  // Actions
  set: <T>(key: string, data: T, ttl?: number) => void;
  get: <T>(key: string) => T | null;
  invalidate: (key: string) => void;
  invalidatePattern: (pattern: string) => void;
  clear: () => void;
  cleanup: () => void;
  getStats: () => CacheStats;
  preload: (key: string, dataLoader: () => Promise<any>, ttl?: number) => Promise<void>;
  warmup: (keys: string[], dataLoaders: (() => Promise<any>)[]) => Promise<void>;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: {},
  stats: {
    totalEntries: 0,
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
    memoryUsage: 0
  },
  
  set: (key, data, ttl = 5 * 60 * 1000) => { // Default 5 minutes
    const now = Date.now();
    
    set((state) => {
      const newCache = {
        ...state.cache,
        [key]: {
          data,
          timestamp: now,
          ttl,
          hits: 0,
          lastAccessed: now
        }
      };
      
      const memoryUsage = JSON.stringify(newCache).length;
      
      return {
        cache: newCache,
        stats: {
          ...state.stats,
          totalEntries: Object.keys(newCache).length,
          memoryUsage
        }
      };
    });
  },
  
  get: (key) => {
    const { cache, stats } = get();
    const entry = cache[key];
    
    if (!entry) {
      // Cache miss
      set((state) => ({
        stats: {
          ...state.stats,
          totalMisses: state.stats.totalMisses + 1,
          hitRate: state.stats.totalHits / (state.stats.totalHits + state.stats.totalMisses + 1) * 100
        }
      }));
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      // Remove expired entry
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return {
          cache: newCache,
          stats: {
            ...state.stats,
            totalEntries: Object.keys(newCache).length,
            totalMisses: state.stats.totalMisses + 1,
            hitRate: state.stats.totalHits / (state.stats.totalHits + state.stats.totalMisses + 1) * 100
          }
        };
      });
      return null;
    }
    
    // Cache hit - update stats and last accessed
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          ...entry,
          hits: entry.hits + 1,
          lastAccessed: Date.now()
        }
      },
      stats: {
        ...state.stats,
        totalHits: state.stats.totalHits + 1,
        hitRate: (state.stats.totalHits + 1) / (state.stats.totalHits + state.stats.totalMisses + 1) * 100
      }
    }));
    
    return entry.data;
  },
  
  invalidate: (key) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return {
        cache: newCache,
        stats: {
          ...state.stats,
          totalEntries: Object.keys(newCache).length
        }
      };
    });
  },
  
  invalidatePattern: (pattern) => {
    const regex = new RegExp(pattern);
    set((state) => {
      const newCache: Record<string, CacheEntry<any>> = {};
      
      Object.entries(state.cache).forEach(([key, entry]) => {
        if (!regex.test(key)) {
          newCache[key] = entry;
        }
      });
      
      return {
        cache: newCache,
        stats: {
          ...state.stats,
          totalEntries: Object.keys(newCache).length
        }
      };
    });
  },
  
  clear: () => {
    set({
      cache: {},
      stats: {
        totalEntries: 0,
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
        memoryUsage: 0
      }
    });
  },
  
  cleanup: () => {
    const { cache } = get();
    const now = Date.now();
    const newCache: Record<string, CacheEntry<any>> = {};
    
    // Remove expired entries and LRU cleanup
    const entries = Object.entries(cache)
      .filter(([_, entry]) => now - entry.timestamp <= entry.ttl)
      .sort(([_, a], [__, b]) => b.lastAccessed - a.lastAccessed)
      .slice(0, 100); // Keep only 100 most recent entries
    
    entries.forEach(([key, entry]) => {
      newCache[key] = entry;
    });
    
    const memoryUsage = JSON.stringify(newCache).length;
    
    set((state) => ({
      cache: newCache,
      stats: {
        ...state.stats,
        totalEntries: Object.keys(newCache).length,
        memoryUsage
      }
    }));
  },
  
  getStats: () => {
    return get().stats;
  },
  
  preload: async (key, dataLoader, ttl) => {
    try {
      const data = await dataLoader();
      get().set(key, data, ttl);
    } catch (error) {
      console.error(`Failed to preload cache key: ${key}`, error);
    }
  },
  
  warmup: async (keys, dataLoaders) => {
    const promises = keys.map((key, index) => 
      get().preload(key, dataLoaders[index])
    );
    
    await Promise.allSettled(promises);
  }
}));

// Auto cleanup every 10 minutes
setInterval(() => {
  useCacheStore.getState().cleanup();
}, 10 * 60 * 1000);

// Cache helper functions
export const cacheHelpers = {
  // Transaction cache keys
  transactionsByDate: (startDate: string, endDate: string) => 
    `transactions:date:${startDate}:${endDate}`,
  transactionsByCategory: (walletId?: string) => 
    `transactions:category:${walletId || 'all'}`,
  transactionStats: (period: string) => 
    `transactions:stats:${period}`,
  
  // Wallet cache keys
  walletBalance: (walletId: string) => 
    `wallet:balance:${walletId}`,
  totalBalance: () => 
    'wallet:total:balance',
  
  // Analytics cache keys
  expensePatterns: () => 
    'analytics:expense:patterns',
  categoryInsights: (category: string) => 
    `analytics:category:${category}`,
  spendingTrends: (timeframe: string) => 
    `analytics:trends:${timeframe}`,
  
  // AI Analysis cache keys
  aiAnalysis: (timeRange: string, dataHash: string) => 
    `ai:analysis:${timeRange}:${dataHash}`,
};