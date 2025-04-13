import { format, parse, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Map of common timezone display names to IANA format
 */
const TIME_ZONE_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time (AKT)': 'America/Anchorage',
  'Hawaii-Aleutian Time (HST)': 'Pacific/Honolulu',
  'Atlantic Time (AST)': 'America/Puerto_Rico',
  // Added support for Standard Time format used in dropdown
  'Eastern Standard Time (EST)': 'America/New_York',
  'Central Standard Time (CST)': 'America/Chicago',
  'Mountain Standard Time (MST)': 'America/Denver',
  'Pacific Standard Time (PST)': 'America/Los_Angeles',
  'Alaska Standard Time (AKST)': 'America/Anchorage',
  'Hawaii-Aleutian Standard Time (HST)': 'Pacific/Honolulu',
  'Atlantic Standard Time (AST)': 'America/Puerto_Rico'
};

/**
 * Ensure timezone is in IANA format
 * This function is now used across all time zone operations
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  // If already in IANA format (contains a slash)
  if (timeZone && timeZone.includes('/')) {
    return timeZone;
  }
  
  // Check if it's a known display name
  if (timeZone && TIME_ZONE_MAP[timeZone]) {
    return TIME_ZONE_MAP[timeZone];
  }
  
  // If we have a parenthetical format like "Something (XXX)", try to extract and match
  if (timeZone && timeZone.includes('(') && timeZone.includes(')')) {
    // Try to match by the full string first
    for (const [key, value] of Object.entries(TIME_ZONE_MAP)) {
      if (timeZone.includes(key)) {
        return value;
      }
    }
  }
  
  // Fallback to browser's timezone
  try {
    console.log(`Unable to map timezone "${timeZone}" to IANA format, using system default`);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting system timezone, using America/Chicago as fallback:', error);
    return 'America/Chicago'; // Safe fallback, changed to match our app default
  }
};

/**
 * Create a complete ISO datetime string from date and time components
 * @param date Date string or Date object
 * @param time Time string in HH:MM format
 * @returns Full ISO datetime string
 */
export const createISODateTimeString = (date: string | Date, time: string): string => {
  try {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    return `${dateStr}T${time}:00`;
  } catch (error) {
    console.error('Error creating ISO datetime string:', error);
    return new Date().toISOString();
  }
};

/**
 * Convert a local date and time to a UTC timestamp
 * Use this to convert user's local time to UTC for storage in database
 * 
 * @param date Date string or Date object in local timezone
 * @param time Time string in 24-hour format (HH:MM or HH:MM:SS)
 * @param timezone Source timezone (IANA format or display name)
 * @returns UTC datetime as ISO string
 */
export const toUTCTimestamp = (
  date: string | Date,
  time: string,
  timezone: string
): string => {
  try {
    const ianaTimeZone = ensureIANATimeZone(timezone);
    console.log(`Converting to UTC timestamp from timezone ${ianaTimeZone}`);
    
    // Create a full ISO datetime string in the source timezone
    const localDateTimeStr = createISODateTimeString(date, time);
    console.log(`Local datetime in ${ianaTimeZone}: ${localDateTimeStr}`);
    
    // Parse into a Date object in the local timezone
    let localDate: Date;
    if (typeof date === 'string') {
      localDate = parseISO(localDateTimeStr);
    } else {
      // If date is already a Date object, construct a new date with the right time
      const [hours, minutes] = time.split(':').map(Number);
      localDate = new Date(date);
      localDate.setHours(hours, minutes, 0, 0);
    }
    
    // Convert from source timezone to UTC
    const utcDateTime = fromZonedTime(localDate, ianaTimeZone);
    console.log(`Converted to UTC: ${utcDateTime.toISOString()}`);
    
    return utcDateTime.toISOString();
  } catch (error) {
    console.error('Error converting to UTC timestamp:', error, { date, time, timezone });
    // Return current time as fallback
    return new Date().toISOString();
  }
};

// Export aliases for backward compatibility
export const toUTC = toUTCTimestamp;

/**
 * Convert UTC datetime to local time in specified timezone
 * Use this to convert stored UTC time to user's local time
 * 
 * @param utcDatetime UTC datetime string or Date object
 * @param timezone Target timezone (IANA format or display name)
 * @returns Date object in the target timezone
 */
export const fromUTCTimestamp = (
  utcDatetime: string | Date,
  timezone: string
): Date => {
  try {
    const ianaTimeZone = ensureIANATimeZone(timezone);
    console.log(`Converting from UTC to timezone ${ianaTimeZone}`);
    
    // Parse the UTC datetime
    const utcDate = typeof utcDatetime === 'string' ? new Date(utcDatetime) : utcDatetime;
    console.log(`UTC datetime: ${utcDate.toISOString()}`);
    
    // Convert to target timezone
    const localDate = toZonedTime(utcDate, ianaTimeZone);
    console.log(`Converted to ${ianaTimeZone}: ${format(localDate, 'yyyy-MM-dd HH:mm:ss')}`);
    
    return localDate;
  } catch (error) {
    console.error('Error converting from UTC timestamp:', error, { utcDatetime, timezone });
    // Return current time as fallback
    return new Date();
  }
};

// Export aliases for backward compatibility
export const fromUTC = fromUTCTimestamp;

/**
 * Extract date string and time string from a timestamp
 * @param timestamp The timestamp to extract from
 * @param timezone The timezone to use (defaults to UTC)
 * @returns Object with date (yyyy-MM-dd) and time (HH:mm) strings
 */
export const extractDateAndTimeFromTimestamp = (
  timestamp: string | Date,
  timezone: string = 'UTC'
): { date: string, time: string } => {
  try {
    const ianaTimeZone = ensureIANATimeZone(timezone);
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    return {
      date: formatInTimeZone(date, ianaTimeZone, 'yyyy-MM-dd'),
      time: formatInTimeZone(date, ianaTimeZone, 'HH:mm')
    };
  } catch (error) {
    console.error('Error extracting date and time from timestamp:', error);
    const now = new Date();
    return {
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm')
    };
  }
};

/**
 * Format a UTC time for display to the user in their timezone
 * 
 * @param utcDatetime UTC datetime string or Date object
 * @param timezone User's timezone (IANA format or display name)
 * @param formatStr Optional format string (defaults to 'h:mm a')
 * @returns Formatted time string in user's timezone
 */
export const formatUTCTimeForUser = (
  utcDatetime: string | Date,
  timezone: string,
  formatStr: string = 'h:mm a'
): string => {
  try {
    const localTime = fromUTCTimestamp(utcDatetime, timezone);
    const ianaTimeZone = ensureIANATimeZone(timezone);
    
    return formatInTimeZone(localTime, ianaTimeZone, formatStr);
  } catch (error) {
    console.error('Error formatting UTC time for user:', error, { utcDatetime, timezone });
    // Return a fallback formatted string
    return format(new Date(), formatStr);
  }
};

/**
 * Converts a UTC date/time to the user's timezone
 */
export const convertToUserTimeZone = (
  date: string | Date,
  time: string,
  userTimeZone: string
): Date => {
  try {
    const ianaTimeZone = ensureIANATimeZone(userTimeZone);
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const [hours, minutes] = time.split(':').map(Number);
    
    const utcDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      hours,
      minutes
    );
    
    return toZonedTime(utcDate, ianaTimeZone);
  } catch (error) {
    console.error('Error converting to user timezone:', error, { date, time, userTimeZone });
    // Return original date as fallback
    return typeof date === 'string' ? parseISO(date) : date;
  }
};

/**
 * Formats a time string in the user's timezone
 * Improved to handle time strings in consistent format
 */
export const formatTimeInUserTimeZone = (
  timeStr: string,
  userTimeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  try {
    const ianaTimeZone = ensureIANATimeZone(userTimeZone);
    
    // Parse the time string (expected format: "HH:mm:ss" or "HH:mm")
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0];
    const minutes = timeParts[1];
    
    // Create a Date object for today with the given time
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return formatInTimeZone(date, ianaTimeZone, formatStr);
  } catch (error) {
    console.error('Error formatting time in user timezone:', error, { timeStr, userTimeZone, formatStr });
    return timeStr ? formatTime12Hour(timeStr) : '';
  }
};

/**
 * Get current timezone if not specified, ensuring it's in IANA format
 */
export const getUserTimeZone = (userTimeZone?: string | null): string => {
  if (!userTimeZone) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  return ensureIANATimeZone(userTimeZone);
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
 * @param timeZone The timezone string (display name or IANA)
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
    const ianaTimeZone = ensureIANATimeZone(timeZone);
    
    // Parse the date object if it's a string
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Parse the time string and create a combined date time object
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a combined date time object
    const dateTime = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      hours,
      minutes
    );
    
    // Format the time using date-fns-tz
    const formattedTime = formatInTimeZone(dateTime, ianaTimeZone, 'h:mm a');
    
    if (!includeTimeZone) {
      return formattedTime;
    }
    
    // Extract timezone abbreviation/name for display
    const timeZoneDisplay = formatTimeZoneDisplay(timeZone);
    return `${formattedTime} (${timeZoneDisplay})`;
  } catch (error) {
    console.error('Error formatting with timezone:', error, { date, time, timeZone });
    return time ? formatTime12Hour(time) : '';
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
    const ianaTimeZone = ensureIANATimeZone(timeZone);
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
    const zonedBase = toZonedTime(baseDate, ianaTimeZone);
    const zonedLater = toZonedTime(oneHourLater, ianaTimeZone);
    
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
 * @param timeZone IANA time zone identifier or display name
 * @returns User-friendly time zone display
 */
export const formatTimeZoneDisplay = (timeZone: string): string => {
  try {
    if (!timeZone) return '';
    
    // If it's a display name already, just return it without the parentheses part
    if (timeZone.includes('(') && timeZone.includes(')')) {
      return timeZone.split('(')[0].trim();
    }
    
    // If it's an IANA identifier, extract the location part (after the /)
    if (timeZone.includes('/')) {
      const location = timeZone.split('/').pop() || timeZone;
      return location.replace(/_/g, ' ');
    }
    
    return timeZone;
  } catch (error) {
    console.error('Error formatting time zone display:', error, timeZone);
    return timeZone || '';
  }
};
