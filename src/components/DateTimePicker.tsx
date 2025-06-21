import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface DateTimePickerProps {
  value: string;
  timeValue?: string;
  onChange: (date: string) => void;
  onTimeChange?: (time: string) => void;
  showTime?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowFuture?: boolean; // New prop to control future date validation
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  timeValue = '',
  onChange,
  onTimeChange,
  showTime = false,
  placeholder = 'Pilih tanggal',
  className = '',
  disabled = false,
  allowFuture = false // Default to false for transaction dates
}) => {
  const { isDark } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    // Validate future dates for transactions
    if (!allowFuture && isBefore(startOfDay(new Date()), startOfDay(date))) {
      return; // Don't allow future dates for transactions
    }
    
    setSelectedDate(date);
    onChange(format(date, 'yyyy-MM-dd'));
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (time: string) => {
    if (onTimeChange) {
      onTimeChange(time);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    onChange(format(today, 'yyyy-MM-dd'));
    if (onTimeChange) {
      onTimeChange(format(today, 'HH:mm'));
    }
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange('');
    if (onTimeChange) {
      onTimeChange('');
    }
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for proper calendar layout
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const endDay = monthEnd.getDay();
  const endPaddingDays = Array.from({ length: 6 - endDay }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + (i + 1));
    return date;
  });

  const allDays = [...paddingDays, ...calendarDays, ...endPaddingDays];

  const displayValue = selectedDate 
    ? format(selectedDate, 'dd/MM/yyyy', { locale: id })
    : '';

  return (
    <div ref={containerRef} className="relative">
      {/* Compact Input Field */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full p-2.5 glass-input cursor-pointer flex items-center justify-between
          ${isDark ? 'text-white' : 'text-gray-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}
          ${className}
        `}
        style={{ fontSize: '14px' }}
      >
        <div className="flex items-center space-x-2">
          <Calendar className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-500'} opacity-70`} />
          <span className={displayValue ? '' : 'opacity-50'}>
            {displayValue || placeholder}
          </span>
          {showTime && timeValue && (
            <>
              <Clock className={`w-3 h-3 ${isDark ? 'text-white' : 'text-gray-500'} opacity-70`} />
              <span className="text-sm">{timeValue}</span>
            </>
          )}
        </div>
        {selectedDate && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3 opacity-50 hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Compact Calendar Dropdown */}
      {isOpen && !disabled && (
        <div 
          className={`
            absolute top-full left-0 mt-1 p-4 rounded-xl border z-50 min-w-[280px]
            ${isDark 
              ? 'bg-gray-900/95 border-gray-700 shadow-2xl' 
              : 'bg-white/98 border-gray-200 shadow-xl'
            }
          `}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Compact Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="glass-button p-1.5 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="glass-button p-1.5 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Calendar Grid */}
          <div className="mb-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div 
                  key={day} 
                  className={`text-center text-xs font-medium py-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((date, index) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const isFutureDate = !allowFuture && isBefore(startOfDay(new Date()), startOfDay(date));
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    disabled={isFutureDate}
                    className={`
                      p-1.5 text-xs rounded-lg transition-all duration-200 hover:transform hover:scale-110
                      ${isSelected 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : isTodayDate
                          ? 'bg-blue-500/20 text-blue-500 font-bold'
                          : isCurrentMonth
                            ? isFutureDate
                              ? `${isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
                              : `${isDark ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'}`
                            : `${isDark ? 'text-gray-600' : 'text-gray-400'}`
                      }
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex justify-between space-x-2">
            <button
              onClick={goToToday}
              className="flex-1 py-1.5 px-3 glass-button rounded-lg text-xs font-medium hover:transform hover:scale-105 transition-all duration-200"
            >
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Hari Ini</span>
            </button>
            <button
              onClick={clearDate}
              className="flex-1 py-1.5 px-3 glass-button rounded-lg text-xs font-medium hover:transform hover:scale-105 transition-all duration-200"
            >
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Hapus</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:transform hover:scale-105 transition-all duration-200"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;