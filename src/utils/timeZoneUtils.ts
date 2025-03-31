
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
  try {
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
  } catch (error) {
    console.error('Error converting to user timezone:', error, { date, time, userTimeZone });
    // Return original date as fallback
    return typeof date === 'string' ? parseISO(date) : date;
  }
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
  try {
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
  } catch (error) {
    console.error('Error formatting in user timezone:', error, { date, time, userTimeZone, formatStr });
    // Return a fallback format
    return time || format(new Date(), 'h:mm a');
  }
};

/**
 * Formats a time string in the user's timezone
 */
export const formatTimeInUserTimeZone = (
  timeStr: string,
  userTimeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  try {
    // Parse the time string (expected format: "HH:mm:ss" or "HH:mm")
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0];
    const minutes = timeParts[1];
    
    // Create a Date object for today with the given time
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return formatInTimeZone(date, userTimeZone, formatStr);
  } catch (error) {
    console.error('Error formatting time in user timezone:', error, { timeStr, userTimeZone, formatStr });
    return timeStr || '';
  }
};

/**
 * Get current timezone if not specified
 */
export const getUserTimeZone = (userTimeZone?: string | null): string => {
  try {
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
  } catch (error) {
    console.error('Error getting user timezone:', error, { userTimeZone });
    return 'America/New_York'; // Default fallback timezone
  }
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

/**
 * Formats a date and time in a specific timezone with clear timezone indicator
 * @param date The date string or Date object
 * @param time The time string (HH:MM format)
 * @param timeZone The IANA timezone string
 * @param includeTimeZone Whether to include timezone in the output
 * @returns Formatted date and time with timezone indicator
 */
export const formatWithTimeZone = (
  date: string | Date,
  time: string,
  timeZone: string,
  includeTimeZone: boolean = true
): string => {
  try {
    const formattedTime = formatInUserTimeZone(date, time, timeZone);
    
    if (!includeTimeZone) {
      return formattedTime;
    }
    
    // Extract timezone abbreviation/name for display
    const timeZoneDisplay = timeZone.split('/').pop()?.replace('_', ' ') || timeZone;
    return `${formattedTime} (${timeZoneDisplay})`;
  } catch (error) {
    console.error('Error formatting with timezone:', error, { date, time, timeZone });
    return time || '';
  }
};

/**
 * Determine if a time is ambiguous due to DST transitions
 * Useful for checking times around DST transitions
 */
export const isDSTTransitionTime = (
  date: string | Date, 
  time: string, 
  timeZone: string
): boolean => {
  try {
    // Create two Date objects 1 hour apart
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const [hours, minutes] = time.split(':').map(Number);
    
    const baseDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      hours,
      minutes
    );
    
    const oneHourLater = new Date(baseDate);
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    
    // Convert both to the specified timezone
    const zonedBase = toZonedTime(baseDate, timeZone);
    const zonedLater = toZonedTime(oneHourLater, timeZone);
    
    // Calculate the actual difference
    const diffInHours = (zonedLater.getTime() - zonedBase.getTime()) / (1000 * 60 * 60);
    
    // If the difference is not 1 hour, we're in a DST transition
    return Math.abs(diffInHours - 1) > 0.1;
  } catch (error) {
    console.error('Error checking DST transition:', error, { date, time, timeZone });
    return false;
  }
};

/**
 * Generate a formatted time zone display name
 * @param timeZone IANA time zone identifier
 * @returns User-friendly time zone display
 */
export const formatTimeZoneDisplay = (timeZone: string): string => {
  try {
    if (!timeZone) return '';
    
    // Extract the location part (after the /)
    const location = timeZone.split('/').pop() || timeZone;
    
    // Replace underscores with spaces and format
    return location.replace(/_/g, ' ');
  } catch (error) {
    console.error('Error formatting time zone display:', error, timeZone);
    return timeZone || '';
  }
};

