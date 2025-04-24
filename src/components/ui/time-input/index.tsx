
import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  error?: string;
}

/**
 * A consistent time input component that works with our datetime utilities
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
