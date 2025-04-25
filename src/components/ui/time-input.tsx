
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { formatTime } from '@/utils/dateFormatUtils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  step?: number;
  placeholder?: string;
  min?: string;
  max?: string;
}

export function TimeInput({ 
  value, 
  onChange, 
  className,
  disabled = false,
  step = 900, // 15 minutes by default
  placeholder = "Select time",
  min = "00:00",
  max = "23:59"
}: TimeInputProps) {
  const [formattedValue, setFormattedValue] = useState<string>("");
  
  // Update formatted display value when value changes
  useEffect(() => {
    try {
      if (!value) {
        setFormattedValue("");
        return;
      }
      
      // Format the time for display if needed
      const displayValue = value.includes(':') ? value : formatTime(`2023-01-01T${value}`);
      setFormattedValue(value);
    } catch (error) {
      console.error("Error formatting time input value:", error);
      setFormattedValue(value || "");
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <input
      type="time"
      value={value}
      onChange={handleChange}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background file:border-0 file:bg-transparent",
        "file:text-sm file:font-medium placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={disabled}
      step={step}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
}
