
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
  if (userTimeZone && userTimeZone.includes('/')) {
    // Already in IANA format (e.g. "America/New_York")
    return userTimeZone;
  } else if (userTimeZone) {
    // Handle legacy format or other formats
    // Map common timezone names to IANA format
    const timezoneMap: Record<string, string> = {
      'Eastern Standard Time (EST)': 'America/New_York',
      'Central Standard Time (CST)': 'America/Chicago',
      'Mountain Standard Time (MST)': 'America/Denver',
      'Pacific Standard Time (PST)': 'America/Los_Angeles',
      'Alaska Standard Time (AKST)': 'America/Anchorage',
      'Hawaii-Aleutian Standard Time (HST)': 'Pacific/Honolulu',
      'Atlantic Standard Time (AST)': 'America/Puerto_Rico'
    };
    
    return timezoneMap[userTimeZone] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format a time string to 12-hour AM/PM format
 * For use when displaying raw time values (e.g. from database)
 */
export const formatTime12Hour = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return timeString || '';
  }
};

/**
 * Format a Date object to display time in 12-hour AM/PM format
 */
export const formatDateToTime12Hour = (date: Date): string => {
  try {
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting date to time:', error, date);
    return '';
  }
};
