import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ id, value, onChange, className }: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      id={id}
      type="time"
      value={value}
      onChange={handleChange}
      className={className}
    />
  );
}
