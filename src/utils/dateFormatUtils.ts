
/**
 * @deprecated Use the TimeZoneService from @/utils/timezone instead
 * This file is maintained for backward compatibility with existing code
 */

import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

/**
 * Get the current date and time in a specific timezone
 * @deprecated Use TimeZoneService.getCurrentDateTime instead
 */
export const getCurrentDateTime = (timezone: string): any => {
  return TimeZoneService.getCurrentDateTime(timezone);
};

/**
 * Format a date with a specific format in a timezone
 * @deprecated Use TimeZoneService.formatDate instead
 */
export const formatDate = (
  date: string | Date,
  format: string = 'yyyy-MM-dd',
  timezone?: string
): string => {
  return TimeZoneService.formatDate(date, format);
};

/**
 * Format a date and time with a specific format in a timezone
 * @deprecated Use TimeZoneService.formatDateTime instead
 */
export const formatDateTime = (
  dateTime: string | Date,
  format: string = 'yyyy-MM-dd HH:mm',
  timezone?: string
): string => {
  // Convert string or Date to DateTime before passing to TimeZoneService
  const dt = typeof dateTime === 'string' ? 
    DateTime.fromISO(dateTime) : 
    DateTime.fromJSDate(dateTime);
    
  return TimeZoneService.formatDateTime(dt, format, timezone);
};

/**
 * Format just the time portion of a date
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTime = (
  time: string,
  format: string = 'h:mm a',
  timezone?: string
): string => {
  return TimeZoneService.formatTime(time, format, timezone);
};

/**
 * Add a duration to a date
 * @deprecated Use TimeZoneService.addDuration instead
 */
export const addDuration = (
  date: string | Date,
  amount: number,
  unit: any,
  timezone?: string
): any => {
  return TimeZoneService.addDuration(date, amount, unit);
};

/**
 * Get the weekday name from a date
 * @deprecated Use TimeZoneService.getWeekdayName instead
 */
export const getWeekdayName = (date: string | Date): string => {
  // Convert to DateTime if needed
  const dt = typeof date === 'string' ? 
    DateTime.fromISO(date) : 
    DateTime.fromJSDate(date);
    
  return TimeZoneService.getWeekdayName(dt);
};

/**
 * Format a date in a specific timezone
 * @deprecated Use TimeZoneService.formatDateTime instead
 */
export const formatInTimezone = (
  date: string | Date,
  format: string,
  timezone?: string
): string => {
  // Convert to DateTime if needed
  const dt = typeof date === 'string' ? 
    DateTime.fromISO(date) : 
    DateTime.fromJSDate(date);
    
  return TimeZoneService.formatDateTime(dt, format, timezone);
};

/**
 * Get the month name from a date
 * @deprecated Use TimeZoneService.getMonthName instead
 */
export const getMonthName = (date: string | Date): string => {
  // Convert to DateTime if needed
  const dt = typeof date === 'string' ? 
    DateTime.fromISO(date) : 
    DateTime.fromJSDate(date);
    
  return TimeZoneService.getMonthName(dt);
};

/**
 * Check if two dates are the same day
 * @deprecated Use TimeZoneService.isSameDay instead
 */
export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  // Convert to DateTime objects if needed
  const dt1 = typeof date1 === 'string' ? 
    DateTime.fromISO(date1) : 
    DateTime.fromJSDate(date1);
  
  const dt2 = typeof date2 === 'string' ? 
    DateTime.fromISO(date2) : 
    DateTime.fromJSDate(date2);
    
  return TimeZoneService.isSameDay(dt1, dt2);
};

/**
 * Convert Date to ISO format with timezone
 * @deprecated Use TimeZoneService methods instead
 */
export const toISOWithZone = (
  date: Date | string,
  timezone?: string
): string => {
  try {
    if (typeof date === 'string') {
      return TimeZoneService.parseWithZone(date, timezone || 'UTC').toISO();
    } else {
      // Convert Date to ISO string first, then parse with TimeZoneService
      const isoString = date.toISOString();
      return TimeZoneService.parseWithZone(isoString, timezone || 'UTC').toISO();
    }
  } catch (error) {
    console.error('Error converting to ISO with zone:', error);
    throw error;
  }
};

/**
 * Parse a date string to a DateTime object with timezone
 * @deprecated Use TimeZoneService.parseWithZone instead
 */
export const parseWithZone = (
  dateString: string,
  timezone: string
): any => {
  return TimeZoneService.parseWithZone(dateString, timezone);
};
