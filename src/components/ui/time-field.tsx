
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TimeFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

export function TimeField({
  label,
  value,
  onChange,
  disabled = false,
  error,
  placeholder = 'Select time',
  required = false,
  className,
  min,
  max,
}: TimeFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {label && (
        <Label>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        type="time"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default TimeField;
