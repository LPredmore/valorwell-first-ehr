
import { DateTime, Duration } from 'luxon';
import { ensureIANATimeZone } from './timeZoneUtils';

/**
 * Get the current date and time in a specific timezone
 */
export const getCurrentDateTime = (timezone: string): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.now().setZone(ianaZone);
};

/**
 * Format a date with a specific format in a timezone
 */
export const formatDate = (
  date: string | Date,
  format: string = 'yyyy-MM-dd',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else {
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      console.error('Invalid date format:', { date, error: dt.invalidReason });
      return 'Invalid date';
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date and time with a specific format in a timezone
 */
export const formatDateTime = (
  dateTime: string | Date,
  format: string = 'yyyy-MM-dd HH:mm',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof dateTime === 'string') {
      dt = DateTime.fromISO(dateTime);
    } else {
      dt = DateTime.fromJSDate(dateTime);
    }
    
    if (!dt.isValid) {
      console.error('Invalid datetime format:', { dateTime, error: dt.invalidReason });
      return 'Invalid datetime';
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid datetime';
  }
};

/**
 * Format just the time portion of a date
 */
export const formatTime = (
  time: string,
  format: string = 'h:mm a',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (time.includes('T') || time.includes('Z')) {
      dt = DateTime.fromISO(time);
    } else if (time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      dt = DateTime.now().set({ hour: hours, minute: minutes });
    } else {
      throw new Error(`Unsupported time format: ${time}`);
    }
    
    if (!dt.isValid) {
      console.error('Invalid time format:', { time, error: dt.invalidReason });
      return time;
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

/**
 * Add a duration to a date
 */
export const addDuration = (
  date: string | Date,
  amount: number,
  unit: keyof Duration,
  timezone?: string
): DateTime => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else {
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      throw new Error('Invalid date for adding duration');
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    // Create duration object properly
    const duration = Duration.fromObject({ [unit]: amount });
    return dt.plus(duration);
  } catch (error) {
    console.error('Error adding duration to date:', error);
    throw error;
  }
};

