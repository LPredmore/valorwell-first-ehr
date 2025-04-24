
import { DateTime } from 'luxon';

/**
 * Get the full weekday name from a date in lowercase
 * @param date Date object or ISO string
 * @returns Lowercase weekday name (e.g., "monday", "tuesday")
 */
export const getWeekdayName = (date: Date | string): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat('cccc').toLowerCase(); // 'cccc' gives full weekday name
};

/**
 * Format a date to a readable string
 * @param date Date object or ISO string
 * @param formatStr Optional format string (defaults to 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd'
): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat(formatStr);
};

/**
 * Format a date and time to a readable string
 * @param date Date object or ISO string 
 * @param formatStr Optional format string (defaults to 'yyyy-MM-dd h:mm a')
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd h:mm a'
): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat(formatStr);
};

/**
 * Format a time from a date object
 * @param date Date object or ISO string
 * @param formatStr Optional format string (defaults to 'h:mm a')
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string,
  formatStr: string = 'h:mm a'
): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat(formatStr);
};

/**
 * Format a date with timezone consideration
 * @param date Date object or ISO string
 * @param timezone IANA timezone string
 * @param formatStr Optional format string (defaults to 'yyyy-MM-dd h:mm a')
 * @returns Formatted date string in specified timezone
 */
export const formatInTimezone = (
  date: Date | string,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd h:mm a'
): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.setZone(timezone).toFormat(formatStr);
};

/**
 * Get the name of the month from a date
 * @param date Date object or ISO string
 * @returns Month name (e.g., "January", "February")
 */
export const getMonthName = (date: Date | string): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat('MMMM'); // 'MMMM' gives full month name
};

/**
 * Get the current date as a DateTime object
 * @param timezone Optional timezone (defaults to local timezone)
 * @returns DateTime object for current date/time
 */
export const getCurrentDateTime = (timezone?: string): DateTime => {
  return timezone ? DateTime.now().setZone(timezone) : DateTime.now();
};

/**
 * Compare two dates to check if they're the same day
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns Boolean indicating if dates are the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const dt1 = typeof date1 === 'string' ? DateTime.fromISO(date1) : DateTime.fromJSDate(date1);
  const dt2 = typeof date2 === 'string' ? DateTime.fromISO(date2) : DateTime.fromJSDate(date2);
  
  return dt1.hasSame(dt2, 'day');
};

/**
 * Add a specified duration to a date
 * @param date Original date
 * @param duration Object specifying duration to add
 * @returns New DateTime with duration added
 */
export const addDuration = (
  date: Date | string, 
  duration: { 
    years?: number;
    months?: number; 
    days?: number; 
    hours?: number; 
    minutes?: number;
    seconds?: number;
  }
): DateTime => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.plus(duration);
};
