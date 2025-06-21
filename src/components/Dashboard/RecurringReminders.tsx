import React from 'react';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useRecurringTransactionStore } from '../../store/recurringTransactionStore';
import { useThemeStore } from '../../store/themeStore';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

const RecurringReminders: React.FC = () => {
  const { getUpcomingTransactions, getOverdueTransactions } = useRecurringTransactionStore();
  const { isDark } = useThemeStore();

  const upcomingTransactions = getUpcomingTransactions(3); // Next 3 days
  const overdueTransactions = getOverdueTransactions();

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const allReminders = [...overdueTransactions, ...upcomingTransactions];

  if (allReminders.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Clock className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Pengingat Transaksi
        </h2>
      </div>

      <div className="space-y-3">
        {allReminders.map((tx) => {
          const daysUntil = getDaysUntilDue(tx.nextDueDate);
          const isOverdue = daysUntil < 0;
          const isToday = daysUntil === 0;
          
          return (
            <div 
              key={tx.id} 
              className={`p-4 rounded-lg border-l-4 ${
                isOverdue ? 'border-red-500 bg-red-500/5' :
                isToday ? 'border-orange-500 bg-orange-500/5' :
                'border-blue-500 bg-blue-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isOverdue ? 'bg-red-500/20' :
                    isToday ? 'bg-orange-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {isOverdue ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Calendar className={`w-5 h-5 ${
                        isToday ? 'text-orange-500' : 'text-blue-500'
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {tx.name}
                    </p>
                    <p className={`text-sm ${
                      isOverdue ? 'text-red-500' :
                      isToday ? 'text-orange-500' :
                      isDark ? 'text-white opacity-70' : 'text-gray-600'
                    }`}>
                      {isOverdue 
                        ? `Terlambat ${Math.abs(daysUntil)} hari`
                        : isToday 
                          ? 'Jatuh tempo hari ini'
                          : `${daysUntil} hari lagi`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                    {format(new Date(tx.nextDueDate), 'dd/MM', { locale: id })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {overdueTransactions.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className={`text-sm text-red-500 font-medium`}>
            ⚠️ {overdueTransactions.length} transaksi terlambat. Segera proses untuk menjaga akurasi keuangan.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurringReminders;