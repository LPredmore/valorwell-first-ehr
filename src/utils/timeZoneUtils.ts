
import { TimeZoneService } from './timeZoneService';

/**
 * Get the user's timezone from the browser
 */
export function getUserTimeZone(): string {
  return TimeZoneService.ensureIANATimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

/**
 * Format a date object to a 12-hour time string (e.g. "9:00 AM")
 */
export function formatDateToTime12Hour(date: Date): string {
  return TimeZoneService.formatTime(TimeZoneService.fromJSDate(date));
}

/**
 * Format a time string to a 12-hour time string (e.g. "09:00" -> "9:00 AM")
 */
export function formatTimeStringTo12Hour(timeString: string): string {
  try {
    const dt = TimeZoneService.fromTimeString(timeString);
    return TimeZoneService.formatTime(dt);
  } catch (error) {
    console.error('Error formatting time string:', error);
    return timeString; // Return the original string if parsing fails
  }
}

/**
 * Format a time string in the user's timezone
 * @param timeString Time string in format "HH:MM"
 * @param userTimeZone IANA timezone string
 * @param formatStr Format string for the output
 */
export function formatTimeInUserTimeZone(timeString: string, userTimeZone: string, formatStr: string = TimeZoneService.TIME_FORMAT_AMPM): string {
  try {
    // Get today's date
    const today = TimeZoneService.today(userTimeZone);
    const todayStr = TimeZoneService.formatDate(today);
    
    // Use TimeZoneService to create and format the datetime
    const dateTime = TimeZoneService.createDateTime(todayStr, timeString, userTimeZone);
    return TimeZoneService.formatDateTime(dateTime, formatStr);
  } catch (error) {
    console.error('Error formatting time in user timezone:', error);
    return timeString;
  }
}

/**
 * Format timezone for display (e.g. "EDT" or "America/New_York")
 */
export function formatTimeZoneDisplay(timezone: string): string {
  try {
    const now = TimeZoneService.now(timezone);
    return now.toFormat('ZZZZ'); // Returns the timezone abbreviation (e.g., EDT)
  } catch (error) {
    console.error('Error formatting timezone display:', error);
    return timezone;
  }
}

/**
 * Convert a date and time string to a specific timezone
 */
export function convertToTimezone(dateStr: string, timeStr: string, timezone: string): ReturnType<typeof TimeZoneService.createDateTime> {
  return TimeZoneService.createDateTime(dateStr, timeStr, timezone);
}

/**
 * Format a date to display with timezone abbreviation (e.g. "Mar 12, 2023 - CST")
 */
export function formatDateWithTimezone(date: Date, timezone: string): string {
  const dt = TimeZoneService.fromJSDate(date, timezone);
  return TimeZoneService.formatDateTime(dt, 'MMM d, yyyy - ZZZZ');
}

/**
 * Format a date with timezone (e.g. "Mar 12, 2023 at 3:30 PM EDT")
 */
export function formatWithTimeZone(date: Date, timezone: string, formatStr: string = 'MMM d, yyyy \'at\' h:mm a ZZZZ'): string {
  try {
    const dt = TimeZoneService.fromJSDate(date, timezone);
    return TimeZoneService.formatDateTime(dt, formatStr);
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return TimeZoneService.formatDisplayDate(TimeZoneService.fromJSDate(date));
  }
}

/**
 * Ensures a timezone string is a valid IANA timezone
 */
export function ensureIANATimeZone(timezone: string | null | undefined): string {
  return TimeZoneService.ensureIANATimeZone(timezone);
}

/**
 * Format a time value to 12-hour format
 */
export function formatTime12Hour(timeString: string): string {
  try {
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const format = timeString.includes(':') ?
                  (timeString.split(':').length > 2 ? 'HH:mm:ss' : 'HH:mm') : 'HH';
    
    const dt = TimeZoneService.fromTimeString(timeString);
    return TimeZoneService.formatTime(dt);
  } catch (error) {
    console.error('Error formatting to 12-hour time:', error);
    return timeString;
  }
}
