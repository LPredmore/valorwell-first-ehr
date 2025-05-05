
import { format, parseISO } from 'date-fns';
import { DateTime } from 'luxon';

/**
 * Get the user's timezone from the browser
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'America/Chicago'; // Default fallback
  }
}

/**
 * Format a date object to a 12-hour time string (e.g. "9:00 AM")
 */
export function formatDateToTime12Hour(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Format a time string to a 12-hour time string (e.g. "09:00" -> "9:00 AM")
 */
export function formatTimeStringTo12Hour(timeString: string): string {
  try {
    // Parse the time string (expecting format like "09:00")
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object with the time
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    // Format to 12-hour time
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time string:', error);
    return timeString; // Return the original string if parsing fails
  }
}

/**
 * Convert a date and time string to a specific timezone
 */
export function convertToTimezone(dateStr: string, timeStr: string, timezone: string): DateTime {
  try {
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: timezone });
  } catch (error) {
    console.error('Error converting to timezone:', error);
    return DateTime.now().setZone(timezone); // Fallback to current time in the timezone
  }
}

/**
 * Format a date to display with timezone abbreviation (e.g. "Mar 12, 2023 - CST")
 */
export function formatDateWithTimezone(date: Date, timezone: string): string {
  try {
    const dt = DateTime.fromJSDate(date).setZone(timezone);
    return `${dt.toFormat('MMM d, yyyy')} - ${dt.toFormat('ZZZZ')}`;
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return format(date, 'MMM d, yyyy'); // Fallback without timezone
  }
}
