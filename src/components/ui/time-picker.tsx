
import React from 'react';
import { TimeInput } from '@/components/ui/time-input';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: number;
  placeholder?: string;
}

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
