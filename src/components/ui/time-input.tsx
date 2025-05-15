
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatTime12Hour } from '@/utils/timeZoneUtils';

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
  placeholder = '12:00 AM'
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [displayValue, setDisplayValue] = useState('');
  
  // Update internal state and display value when prop changes
  useEffect(() => {
    setInputValue(value);
    if (value) {
      setDisplayValue(formatTime12Hour(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty values temporarily during editing
    if (newValue === '') {
      setInputValue('');
      setDisplayValue('');
      return;
    }
    
    // Only accept valid characters for time input (numbers, colon, a, p, m)
    const cleaned = newValue.replace(/[^0-9:APMapm\s]/g, '');
    setDisplayValue(cleaned);
    
    // Try to convert input to 24-hour format
    try {
      // Check if it's already in 24-hour format (HH:MM)
      const timePattern24 = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (timePattern24.test(cleaned)) {
        setInputValue(cleaned);
        onChange(cleaned);
        return;
      }
      
      // Check for 12-hour format with AM/PM
      const timePattern12 = /^(0?[1-9]|1[0-2]):([0-5][0-9])(?:\s*)?(am|pm|AM|PM)?$/;
      const matches = cleaned.match(timePattern12);
      
      if (matches) {
        let hours = parseInt(matches[1], 10);
        const minutes = matches[2];
        const period = matches[3]?.toLowerCase();
        
        // Convert to 24-hour format
        if (period === 'pm' && hours < 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        setInputValue(formattedTime);
        onChange(formattedTime);
      }
    } catch (error) {
      console.error('Error parsing time input:', error);
    }
  };
  
  const handleBlur = () => {
    // When input loses focus, ensure valid format and update display
    const timePattern24 = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timePattern24.test(inputValue)) {
      // Reset to previous valid value if invalid
      setInputValue(value);
      setDisplayValue(value ? formatTime12Hour(value) : '');
    } else {
      // Ensure consistent 24-hour format (e.g., convert 9:30 to 09:30)
      const [hours, minutes] = inputValue.split(':');
      const formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
      setInputValue(formattedTime);
      setDisplayValue(formatTime12Hour(formattedTime));
      onChange(formattedTime);
    }
  };
  
  // Use the formatted display value for rendering
  return (
    <Input
      id={id}
      type="text"
      inputMode="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
};
