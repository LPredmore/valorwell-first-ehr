
/**
 * @component TimePickerInput
 * @description A wrapper component around TimeInput that provides additional time-specific
 * functionality like min/max time constraints and step intervals.
 */

import React from 'react';
import { TimeInput } from '@/components/ui/time-input';

/**
 * @interface TimePickerInputProps
 * @description Props for the TimePickerInput component
 */
interface TimePickerInputProps {
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
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Minimum allowed time in 24-hour format (HH:MM)
   */
  min?: string;
  
  /**
   * Maximum allowed time in 24-hour format (HH:MM)
   */
  max?: string;
  
  /**
   * Step interval in seconds for time selection
   * @default 60 (1 minute)
   */
  step?: number;
  
  /**
   * Placeholder text when no time is selected
   */
  placeholder?: string;
}

/**
 * A time picker input component that extends TimeInput with additional time-specific functionality.
 *
 * @example
 * // Basic usage
 * <TimePickerInput
 *   value={appointmentTime}
 *   onChange={setAppointmentTime}
 * />
 *
 * @example
 * // With constraints
 * <TimePickerInput
 *   value={appointmentTime}
 *   onChange={setAppointmentTime}
 *   min="09:00"
 *   max="17:00"
 *   step={30 * 60} // 30 minute intervals
 *   placeholder="Select appointment time"
 * />
 */
export function TimePickerInput({
  value,
  onChange,
  disabled,
  min,
  max,
  step,
  placeholder
}: TimePickerInputProps) {
  return (
    <TimeInput
      value={value}
      onChange={onChange}
      className="w-full"
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
    />
  );
}
