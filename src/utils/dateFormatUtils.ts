
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

/**
 * Get the weekday name from a date
 */
export const getWeekdayName = (date: string | Date): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else {
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      console.error('Invalid date for getWeekdayName:', { date, error: dt.invalidReason });
      return 'Invalid date';
    }
    
    return dt.weekdayLong.toLowerCase();
  } catch (error) {
    console.error('Error getting weekday name:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date in a specific timezone
 */
export const formatInTimezone = (
  date: string | Date,
  format: string,
  timezone?: string
): string => {
  return formatDateTime(date, format, timezone);
};

/**
 * Get the month name from a date
 */
export const getMonthName = (date: string | Date): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else {
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      console.error('Invalid date for getMonthName:', { date, error: dt.invalidReason });
      return 'Invalid date';
    }
    
    return dt.monthLong;
  } catch (error) {
    console.error('Error getting month name:', error);
    return 'Invalid date';
  }
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  try {
    const dt1 = typeof date1 === 'string' ? DateTime.fromISO(date1) : DateTime.fromJSDate(date1);
    const dt2 = typeof date2 === 'string' ? DateTime.fromISO(date2) : DateTime.fromJSDate(date2);
    
    if (!dt1.isValid || !dt2.isValid) {
      console.error('Invalid date for isSameDay check');
      return false;
    }
    
    return dt1.hasSame(dt2, 'day');
  } catch (error) {
    console.error('Error checking if dates are the same day:', error);
    return false;
  }
};

/**
 * Convert Date to ISO format with timezone
 */
export const toISOWithZone = (
  date: Date | string,
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else {
      dt = DateTime.fromJSDate(date);
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.toISO();
  } catch (error) {
    console.error('Error converting to ISO with zone:', error);
    throw error;
  }
};

/**
 * Parse a date string to a DateTime object with timezone
 */
export const parseWithZone = (
  dateString: string,
  timezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dt = DateTime.fromISO(dateString, { zone: ianaZone });
  
  if (!dt.isValid) {
    console.error('Invalid date string:', { dateString, error: dt.invalidReason });
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  return dt;
};
