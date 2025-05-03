
import React from 'react';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  name?: string;
  formContext?: boolean; // Whether this is used in a Form context
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
  name,
  formContext = false,
}: TimeFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // If used within a Form context
  if (formContext) {
    return (
      <FormItem className={className}>
        {label && (
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
        )}
        <FormControl>
          <Input
            type="time"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            name={name}
            className="w-full"
          />
        </FormControl>
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    );
  }

  // Standalone usage
  return (
    <div className={className}>
      {label && (
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}
      <Input
        type="time"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        name={name}
        className="w-full"
      />
      {error && <p className="text-sm font-medium text-destructive mt-1">{error}</p>}
    </div>
  );
}

export default TimeField;
