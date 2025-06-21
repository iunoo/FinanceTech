import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih waktu',
  className = '',
  disabled = false
}) => {
  const { isDark } = useThemeStore();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Set default value to current time if empty
  useEffect(() => {
    if (!value) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  }, []);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Clock className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-500'} opacity-70`} />
        </div>
        
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={handleTimeChange}
          disabled={disabled}
          className={`
            w-full pl-10 pr-4 py-2.5 glass-input
            ${isDark ? 'text-white' : 'text-gray-800'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}
            ${className}
          `}
          style={{ fontSize: '14px' }}
        />
      </div>
    </div>
  );
};

export default TimePicker;