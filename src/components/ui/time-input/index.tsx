
/**
 * @component TimeInput
 * @description A consistent time input component that works with the application's datetime utilities.
 * Provides a standardized way to input time values with optional label and error message display.
 */

import React from 'react';
import { Input } from '@/components/ui/input';

/**
 * @interface TimeInputProps
 * @description Props for the TimeInput component
 */
interface TimeInputProps {
  /**
   * Optional ID for the input element
   */
  id?: string;
  
  /**
   * Current time value in 24-hour format (HH:MM)
   */
  value: string;
  
  /**
   * Function called when the time value changes
   * @param value - The new time value
   */
  onChange: (value: string) => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Optional label text to display above the input
   */
  label?: string;
  
  /**
   * Optional error message to display below the input
   */
  error?: string;
}

/**
 * A consistent time input component that works with the application's datetime utilities.
 *
 * @example
 * // Basic usage
 * <TimeInput
 *   value={time}
 *   onChange={setTime}
 * />
 *
 * @example
 * // With label and error
 * <TimeInput
 *   label="Appointment Time"
 *   value={time}
 *   onChange={setTime}
 *   error={errors.time}
 * />
 */
export function TimeInput({ 
  id, 
  value, 
  onChange, 
  className,
  label,
  error
}: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="text-sm font-medium">{label}</label>}
      <Input
        id={id}
        type="time"
        value={value}
        onChange={handleChange}
        className={className}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
