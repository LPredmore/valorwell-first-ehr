
import React from 'react';
import { TimeInput } from '@/components/ui/time-input';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePickerInput({ value, onChange }: TimePickerInputProps) {
  return (
    <TimeInput
      value={value}
      onChange={onChange}
      className="w-full"
    />
  );
}
