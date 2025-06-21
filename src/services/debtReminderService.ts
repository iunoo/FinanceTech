import { TelegramReportService } from './telegramReportService';

export interface DebtReminderSettings {
  enabled: boolean;
  dailyTime: string; // HH:MM format
  urgentHours: number; // Hours before due date
  overdueEnabled: boolean;
  customMessages: {
    daily?: string;
    urgent?: string;
    overdue?: string;
  };
}

export class DebtReminderService {
  private static instance: DebtReminderService;
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  static getInstance(): DebtReminderService {
    if (!DebtReminderService.instance) {
      DebtReminderService.instance = new DebtReminderService();
    }
    return DebtReminderService.instance;
  }
  
  setupCustomReminders(userId: string, settings: DebtReminderSettings) {
    // Clear existing reminders for this user
    this.clearUserReminders(userId);
    
    if (!settings.enabled) return;
    
    // Setup daily reminder
    this.setupDailyReminder(userId, settings);
    
    // Setup urgent reminder
    this.setupUrgentReminder(userId, settings);
    
    // Setup overdue reminder
    if (settings.overdueEnabled) {
      this.setupOverdueReminder(userId, settings);
    }
  }
  
  private setupDailyReminder(userId: string, settings: DebtReminderSettings) {
    const [hours, minutes] = settings.dailyTime.split(':').map(Number);
    
    // Calculate milliseconds until next reminder time
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      this.sendDailyReminder(userId, settings);
      
      // Setup recurring daily reminder
      const dailyInterval = setInterval(() => {
        this.sendDailyReminder(userId, settings);
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
      this.reminderIntervals.set(`${userId}-daily`, dailyInterval);
    }, timeUntilReminder);
    
    this.reminderIntervals.set(`${userId}-daily-initial`, timeout);
  }
  
  private setupUrgentReminder(userId: string, settings: DebtReminderSettings) {
    // Check every hour for urgent debts
    const interval = setInterval(() => {
      this.checkUrgentDebts(userId, settings);
    }, 60 * 60 * 1000); // Every hour
    
    this.reminderIntervals.set(`${userId}-urgent`, interval);
  }
  
  private setupOverdueReminder(userId: string, settings: DebtReminderSettings) {
    // Check every 6 hours for overdue debts
    const interval = setInterval(() => {
      this.checkOverdueDebts(userId, settings);
    }, 6 * 60 * 60 * 1000); // Every 6 hours
    
    this.reminderIntervals.set(`${userId}-overdue`, interval);
  }
  
  private async sendDailyReminder(userId: string, settings: DebtReminderSettings) {
    try {
      // Get user's debts and telegram ID
      const { debts, telegramId } = await this.getUserDebtData(userId);
      
      if (!telegramId) return;
      
      const upcomingDebts = debts.filter(debt => {
        if (debt.isPaid) return false;
        const daysUntilDue = Math.ceil((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3 && daysUntilDue >= 0;
      });
      
      if (upcomingDebts.length > 0) {
        await TelegramReportService.sendDebtReminder(telegramId, upcomingDebts, 'daily');
      }
    } catch (error) {
      console.error('Failed to send daily debt reminder:', error);
    }
  }
  
  private async checkUrgentDebts(userId: string, settings: DebtReminderSettings) {
    try {
      const { debts, telegramId } = await this.getUserDebtData(userId);
      
      if (!telegramId) return;
      
      const urgentDebts = debts.filter(debt => {
        if (debt.isPaid) return false;
        const hoursUntilDue = (new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        return hoursUntilDue <= settings.urgentHours && hoursUntilDue > 0;
      });
      
      if (urgentDebts.length > 0) {
        await TelegramReportService.sendDebtReminder(telegramId, urgentDebts, 'urgent');
      }
    } catch (error) {
      console.error('Failed to check urgent debts:', error);
    }
  }
  
  private async checkOverdueDebts(userId: string, settings: DebtReminderSettings) {
    try {
      const { debts, telegramId } = await this.getUserDebtData(userId);
      
      if (!telegramId) return;
      
      const overdueDebts = debts.filter(debt => {
        if (debt.isPaid) return false;
        return new Date(debt.dueDate) < new Date();
      });
      
      if (overdueDebts.length > 0) {
        await TelegramReportService.sendDebtReminder(telegramId, overdueDebts, 'overdue');
      }
    } catch (error) {
      console.error('Failed to check overdue debts:', error);
    }
  }
  
  private async getUserDebtData(userId: string): Promise<{ debts: any[]; telegramId: string | null }> {
    // This would typically fetch from your database
    // For now, we'll use the store data
    const { useDebtStore } = await import('../store/debtStore');
    const { useAuthStore } = await import('../store/authStore');
    
    const debts = useDebtStore.getState().debts;
    const user = useAuthStore.getState().user;
    
    return {
      debts,
      telegramId: user?.telegramId || null
    };
  }
  
  clearUserReminders(userId: string) {
    // Clear all reminders for this user
    const userKeys = Array.from(this.reminderIntervals.keys()).filter(key => key.startsWith(userId));
    
    userKeys.forEach(key => {
      const interval = this.reminderIntervals.get(key);
      if (interval) {
        clearInterval(interval);
        this.reminderIntervals.delete(key);
      }
    });
  }
  
  clearAllReminders() {
    this.reminderIntervals.forEach(interval => clearInterval(interval));
    this.reminderIntervals.clear();
  }
}

export const debtReminderService = DebtReminderService.getInstance();