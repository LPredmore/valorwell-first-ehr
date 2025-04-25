
import { DateTime, Duration } from 'luxon';
import { ensureIANATimeZone } from './timeZoneUtils';

/**
 * A comprehensive collection of date formatting utilities
 * that will serve as the single source of truth for all date/time operations
 */

/**
 * Get the current date and time in a specific timezone
 * @param timezone The timezone to use (IANA format)
 * @returns DateTime object representing the current date and time
 */
export const getCurrentDateTime = (timezone: string): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.now().setZone(ianaZone);
};

/**
 * Format a date with a specific format in a timezone
 * @param date Date string, ISO string, or Date object
 * @param format The format string (Luxon format)
 * @param timezone The timezone to use (IANA format)
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  format: string = 'yyyy-MM-dd',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      // Handle ISO string format
      dt = DateTime.fromISO(date);
    } else {
      // Handle JavaScript Date object
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
 * @param dateTime Date string, ISO string, or Date object
 * @param format The format string (Luxon format)
 * @param timezone The timezone to use (IANA format)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateTime: string | Date,
  format: string = 'yyyy-MM-dd HH:mm',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof dateTime === 'string') {
      // Handle ISO string format
      dt = DateTime.fromISO(dateTime);
    } else {
      // Handle JavaScript Date object
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
 * @param time Time string (HH:mm) or ISO date string
 * @param format The format string (Luxon format)
 * @param timezone The timezone to use (IANA format)
 * @returns Formatted time string
 */
export const formatTime = (
  time: string,
  format: string = 'h:mm a',
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (time.includes('T') || time.includes('Z')) {
      // Handle ISO string format
      dt = DateTime.fromISO(time);
    } else if (time.includes(':')) {
      // Handle HH:MM:SS format by assuming today's date
      const [hours, minutes] = time.split(':').map(Number);
      dt = DateTime.now().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
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
 * Format a date or time in a specific timezone
 * @param dateTime Date string, ISO string, or Date object
 * @param timezone The timezone to use (IANA format)
 * @param format The format string (Luxon format)
 * @returns Formatted date and time string in the specified timezone
 */
export const formatInTimezone = (
  dateTime: string | Date,
  timezone: string,
  format: string = 'yyyy-MM-dd HH:mm'
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  return formatDateTime(dateTime, format, ianaZone);
};

/**
 * Get the weekday name from a date or ISO string
 * @param date Date string, ISO string, or Date object
 * @param timezone The timezone to use (IANA format)
 * @returns Weekday name (lowercase)
 */
export const getWeekdayName = (
  date: string | Date,
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      // Handle ISO string format
      dt = DateTime.fromISO(date);
    } else {
      // Handle JavaScript Date object
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      console.error('Invalid date for weekday name:', { date, error: dt.invalidReason });
      return '';
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.weekdayLong.toLowerCase();
  } catch (error) {
    console.error('Error getting weekday name:', error);
    return '';
  }
};

/**
 * Get the month name from a date or ISO string
 * @param date Date string, ISO string, or Date object
 * @param timezone The timezone to use (IANA format)
 * @returns Month name
 */
export const getMonthName = (
  date: string | Date,
  timezone?: string
): string => {
  try {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      // Handle ISO string format
      dt = DateTime.fromISO(date);
    } else {
      // Handle JavaScript Date object
      dt = DateTime.fromJSDate(date);
    }
    
    if (!dt.isValid) {
      console.error('Invalid date for month name:', { date, error: dt.invalidReason });
      return '';
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    return dt.monthLong;
  } catch (error) {
    console.error('Error getting month name:', error);
    return '';
  }
};

/**
 * Check if two dates represent the same day (ignoring time)
 * @param date1 First date
 * @param date2 Second date
 * @param timezone The timezone to use (IANA format)
 * @returns Boolean indicating if dates are the same day
 */
export const isSameDay = (
  date1: string | Date,
  date2: string | Date,
  timezone?: string
): boolean => {
  try {
    let dt1: DateTime;
    let dt2: DateTime;
    
    if (typeof date1 === 'string') {
      dt1 = DateTime.fromISO(date1);
    } else {
      dt1 = DateTime.fromJSDate(date1);
    }
    
    if (typeof date2 === 'string') {
      dt2 = DateTime.fromISO(date2);
    } else {
      dt2 = DateTime.fromJSDate(date2);
    }
    
    if (!dt1.isValid || !dt2.isValid) {
      console.error('Invalid dates for comparison:', { 
        date1, 
        date2,
        valid1: dt1.isValid,
        valid2: dt2.isValid
      });
      return false;
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt1 = dt1.setZone(ianaZone);
      dt2 = dt2.setZone(ianaZone);
    }
    
    return dt1.hasSame(dt2, 'day');
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
};

/**
 * Add a duration to a date
 * @param date The date to modify
 * @param amount The amount to add
 * @param unit The unit of time (days, hours, etc.)
 * @param timezone The timezone to use (IANA format)
 * @returns The modified date as a Luxon DateTime
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
      console.error('Invalid date for adding duration:', { date, error: dt.invalidReason });
      throw new Error('Invalid date for adding duration');
    }
    
    if (timezone) {
      const ianaZone = ensureIANATimeZone(timezone);
      dt = dt.setZone(ianaZone);
    }
    
    const duration = {} as Duration;
    duration[unit] = amount;
    
    return dt.plus(duration);
  } catch (error) {
    console.error('Error adding duration to date:', error);
    throw error;
  }
};
