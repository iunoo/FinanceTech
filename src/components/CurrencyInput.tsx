import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  className = "",
  disabled = false
}) => {
  const { isDark } = useThemeStore();
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toLocaleString('id-ID'));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numberValue = parseInt(numericValue, 10);
    
    if (isFocused) {
      // Show formatted value while typing
      setDisplayValue(numberValue.toLocaleString('id-ID'));
    } else {
      setDisplayValue(numberValue.toString());
    }
    
    onChange(numberValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Keep formatted display when focused
    if (value > 0) {
      setDisplayValue(value.toLocaleString('id-ID'));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format with thousand separators when blurred
    if (value > 0) {
      setDisplayValue(value.toLocaleString('id-ID'));
    }
  };

  return (
    <div className="relative">
      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
        isDark ? 'text-white' : 'text-gray-700'
      } font-medium z-10`}>
        Rp
      </span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 glass-input ${
          isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'
        } ${className}`}
        placeholder={placeholder}
        style={{ fontSize: '16px' }}
        inputMode="numeric"
      />
    </div>
  );
};

export default CurrencyInput;