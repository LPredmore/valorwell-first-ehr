
import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  format?: '12h' | '24h';
}

export const TimeInput: React.FC<TimeInputProps> = ({
  id,
  value = '09:00',
  onChange,
  format = '24h'
}) => {
  const [hours, setHours] = useState('09');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      
      if (format === '12h') {
        let hour = parseInt(h, 10);
        const newPeriod = hour >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        if (hour === 0) {
          hour = 12;
        } else if (hour > 12) {
          hour -= 12;
        }
        
        setHours(hour.toString().padStart(2, '0'));
        setPeriod(newPeriod);
      } else {
        setHours(h);
      }
      
      setMinutes(m);
    }
  }, [value, format]);

  const handleHourChange = (hour: string) => {
    setHours(hour);
    updateValue(hour, minutes, period);
  };

  const handleMinuteChange = (minute: string) => {
    setMinutes(minute);
    updateValue(hours, minute, period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    updateValue(hours, minutes, newPeriod);
  };

  const updateValue = (hour: string, minute: string, newPeriod: 'AM' | 'PM') => {
    let formattedHour = parseInt(hour, 10);
    
    if (format === '12h') {
      // Convert to 24-hour format for storing the value
      if (newPeriod === 'PM' && formattedHour < 12) {
        formattedHour += 12;
      } else if (newPeriod === 'AM' && formattedHour === 12) {
        formattedHour = 0;
      }
    }
    
    const formattedValue = `${formattedHour.toString().padStart(2, '0')}:${minute}`;
    onChange(formattedValue);
  };

  const generateHourOptions = () => {
    const options = [];
    
    const start = format === '12h' ? 1 : 0;
    const end = format === '12h' ? 12 : 23;
    
    for (let i = start; i <= end; i++) {
      options.push(i.toString().padStart(2, '0'));
    }
    
    return options;
  };

  const generateMinuteOptions = () => {
    const options = [];
    for (let i = 0; i < 60; i += 15) {
      options.push(i.toString().padStart(2, '0'));
    }
    return options;
  };

  return (
    <div className="flex space-x-1 items-center">
      <Select value={hours} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {generateHourOptions().map(hour => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-lg">:</span>
      
      <Select value={minutes} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Minute" />
        </SelectTrigger>
        <SelectContent>
          {generateMinuteOptions().map(minute => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {format === '12h' && (
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
