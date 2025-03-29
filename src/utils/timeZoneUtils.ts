
import { format, parse, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Converts a UTC date/time to the user's timezone
 */
export const convertToUserTimeZone = (
  date: string | Date,
  time: string,
  userTimeZone: string
): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const [hours, minutes] = time.split(':').map(Number);
  
  const utcDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    hours,
    minutes
  );
  
  return toZonedTime(utcDate, userTimeZone);
};

/**
 * Formats a date in the user's timezone
 */
export const formatInUserTimeZone = (
  date: string | Date,
  time: string,
  userTimeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const [hours, minutes] = time.split(':').map(Number);
  
  const utcDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    hours,
    minutes
  );
  
  return formatInTimeZone(utcDate, userTimeZone, formatStr);
};

/**
 * Formats a time string in the user's timezone
 */
export const formatTimeInUserTimeZone = (
  timeStr: string,
  userTimeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  // Parse the time string (expected format: "HH:mm:ss" or "HH:mm")
  const timeParts = timeStr.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  // Create a Date object for today with the given time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return formatInTimeZone(date, userTimeZone, formatStr);
};

/**
 * Get current timezone if not specified
 */
export const getUserTimeZone = (userTimeZone?: string | null): string => {
  return userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
};
