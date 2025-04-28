
import { DateTime } from 'luxon';
import { TimeZoneService } from './timeZoneService';

/**
 * Format a date using the specified format pattern
 * 
 * @param date The date to format (string, Date object, or DateTime)
 * @param format The format pattern using Luxon's formatting tokens
 * @param timeZone Optional timezone identifier
 * @returns The formatted date string
 */
export function formatDate(
  date: string | Date | DateTime, 
  format: string = 'yyyy-MM-dd', 
  timeZone?: string
): string {
  try {
    // Check if already a DateTime
    if (DateTime.isDateTime(date)) {
      const dtWithZone = timeZone 
        ? date.setZone(TimeZoneService.ensureIANATimeZone(timeZone)) 
        : date;
      return dtWithZone.toFormat(format);
    }
    
    // Convert to DateTime
    let dt: DateTime;
    
    if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else if (typeof date === 'string') {
      if (date.includes('T')) {
        // ISO format
        dt = DateTime.fromISO(date);
      } else {
        // Simple date
        dt = DateTime.fromFormat(date, 'yyyy-MM-dd');
      }
    } else {
      throw new Error('Invalid date format');
    }
    
    // Apply timezone if provided
    if (timeZone) {
      dt = dt.setZone(TimeZoneService.ensureIANATimeZone(timeZone));
    }
    
    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formatting date:', error, { date, format, timeZone });
    return String(date); // Fallback
  }
}

/**
 * Format a time string 
 * 
 * @param time The time to format (string or Date object)
 * @param format The format pattern using Luxon's formatting tokens
 * @param timeZone Optional timezone identifier
 * @returns The formatted time string
 */
export function formatTime(
  time: string | Date | DateTime, 
  format: string = 'h:mm a', 
  timeZone?: string
): string {
  try {
    // Check if already a DateTime
    if (DateTime.isDateTime(time)) {
      const dtWithZone = timeZone 
        ? time.setZone(TimeZoneService.ensureIANATimeZone(timeZone)) 
        : time;
      return dtWithZone.toFormat(format);
    }
    
    // Use TimeZoneService for consistent time handling
    return TimeZoneService.formatTime(
      time instanceof Date ? time.toISOString() : time, 
      format, 
      timeZone
    );
  } catch (error) {
    console.error('Error formatting time:', error, { time, format, timeZone });
    return String(time); // Fallback
  }
}

/**
 * Convert a date string to a DateTime object
 * 
 * @param dateStr Date string in any recognized format
 * @param timeZone Optional timezone identifier
 * @returns A Luxon DateTime object
 */
export function toDateTime(
  dateStr: string | Date | DateTime, 
  timeZone?: string
): DateTime {
  try {
    // Already a DateTime
    if (DateTime.isDateTime(dateStr)) {
      return timeZone 
        ? dateStr.setZone(TimeZoneService.ensureIANATimeZone(timeZone)) 
        : dateStr;
    }
    
    // Convert to DateTime
    if (dateStr instanceof Date) {
      const dt = DateTime.fromJSDate(dateStr);
      return timeZone ? dt.setZone(TimeZoneService.ensureIANATimeZone(timeZone)) : dt;
    }
    
    // Use TimeZoneService for parsing with zone
    return TimeZoneService.parseWithZone(
      dateStr,
      timeZone || 'UTC'
    );
  } catch (error) {
    console.error('Error converting to DateTime:', error, { dateStr, timeZone });
    return DateTime.now(); // Fallback
  }
}

/**
 * Get the day of week name (Monday, Tuesday, etc.) from a date
 * 
 * @param date Date string, Date object or DateTime
 * @param timeZone Optional timezone
 * @returns Day name string (lowercase)
 */
export function getWeekdayName(
  date: string | Date | DateTime, 
  timeZone?: string
): string {
  try {
    // Check if already a DateTime
    if (DateTime.isDateTime(date)) {
      const dtWithZone = timeZone 
        ? date.setZone(TimeZoneService.ensureIANATimeZone(timeZone)) 
        : date;
      return dtWithZone.weekdayLong.toLowerCase();
    }
    
    const dt = toDateTime(date, timeZone);
    return dt.weekdayLong.toLowerCase();
  } catch (error) {
    console.error('Error getting weekday name:', error, { date, timeZone });
    return ''; // Fallback
  }
}

/**
 * Compare two dates (without time)
 * 
 * @param date1 The first date
 * @param date2 The second date
 * @param timeZone Optional timezone
 * @returns -1, 0, or 1
 */
export function compareDates(
  date1: string | Date | DateTime,
  date2: string | Date | DateTime,
  timeZone?: string
): number {
  try {
    const dt1 = toDateTime(date1, timeZone).startOf('day');
    const dt2 = toDateTime(date2, timeZone).startOf('day');
    
    if (dt1 < dt2) return -1;
    if (dt1 > dt2) return 1;
    return 0;
  } catch (error) {
    console.error('Error comparing dates:', error, { date1, date2, timeZone });
    return 0; // Fallback
  }
}

/**
 * Check if a date is today
 * 
 * @param date The date to check
 * @param timeZone Optional timezone
 * @returns True if the date is today
 */
export function isToday(date: string | Date | DateTime, timeZone?: string): boolean {
  try {
    const dt = toDateTime(date, timeZone).startOf('day');
    const today = DateTime.now().setZone(timeZone || dt.zone).startOf('day');
    return dt.equals(today);
  } catch (error) {
    console.error('Error checking if date is today:', error, { date, timeZone });
    return false; // Fallback
  }
}

/**
 * Format duration from minutes to readable string
 * 
 * @param minutes Duration in minutes
 * @returns Formatted duration string (e.g., "1 hour 30 minutes")
 */
export function formatDuration(minutes: number): string {
  try {
    if (isNaN(minutes) || minutes < 0) {
      throw new Error('Invalid duration');
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error formatting duration:', error, { minutes });
    return `${minutes} minutes`; // Fallback
  }
}

/**
 * Get date range string (e.g., "May 1 - May 7, 2023")
 */
export function getDateRangeString(
  startDate: string | Date | DateTime, 
  endDate: string | Date | DateTime,
  timeZone?: string
): string {
  try {
    const start = toDateTime(startDate, timeZone);
    const end = toDateTime(endDate, timeZone);
    
    // Same month and year
    if (start.month === end.month && start.year === end.year) {
      return `${start.toFormat('MMM d')} - ${end.toFormat('d, yyyy')}`;
    }
    
    // Same year
    if (start.year === end.year) {
      return `${start.toFormat('MMM d')} - ${end.toFormat('MMM d, yyyy')}`;
    }
    
    // Different years
    return `${start.toFormat('MMM d, yyyy')} - ${end.toFormat('MMM d, yyyy')}`;
  } catch (error) {
    console.error('Error getting date range string:', error, { startDate, endDate });
    return ''; // Fallback
  }
}
