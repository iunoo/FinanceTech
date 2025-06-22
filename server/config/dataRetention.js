// Data Retention Configuration
export const dataRetentionConfig = {
  // Keep all financial data by default
  transactions: {
    retentionPeriod: null, // null = keep forever
    archiveAfter: 365 * 2, // Archive after 2 years (optional)
    cleanupEnabled: false   // Never auto-delete
  },
  
  debts: {
    retentionPeriod: null, // Keep all debt records
    cleanupEnabled: false
  },
  
  // Only cleanup non-critical data
  logs: {
    retentionPeriod: 90,   // Keep logs for 90 days
    cleanupEnabled: true
  },
  
  cache: {
    retentionPeriod: 7,    // Keep cache for 7 days
    cleanupEnabled: true
  },
  
  // Backup strategy
  backup: {
    frequency: 'weekly',
    retention: 12,         // Keep 12 weekly backups (3 months)
    compression: true
  }
};

// Safe cleanup function - only removes non-financial data
export const safeCleanup = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  // Only cleanup logs and cache, NEVER financial data
  await db.collection('logs').deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  await db.collection('cache').deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  console.log('✅ Safe cleanup completed - financial data preserved');
};