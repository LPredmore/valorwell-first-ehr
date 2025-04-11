
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = '00:00'
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  
  // Update internal state when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty values temporarily during editing
    if (newValue === '') {
      setInputValue('');
      return;
    }
    
    // Only accept numbers and colons
    const cleaned = newValue.replace(/[^0-9:]/g, '');
    
    // Simple format validation
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (timePattern.test(cleaned)) {
      setInputValue(cleaned);
      onChange(cleaned);
    } else if (cleaned.length <= 5) {
      // Allow partial inputs during typing
      setInputValue(cleaned);
    }
  };
  
  const handleBlur = () => {
    // Ensure we have a valid format when input loses focus
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timePattern.test(inputValue)) {
      // Reset to previous valid value if invalid
      setInputValue(value);
    } else {
      // Ensure consistent format (e.g., convert 9:30 to 09:30)
      const [hours, minutes] = inputValue.split(':');
      const formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
      setInputValue(formattedTime);
      onChange(formattedTime);
    }
  };
  
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
};
