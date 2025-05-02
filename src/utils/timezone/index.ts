
/**
 * Timezone Service
 * 
 * This is the central service for all timezone operations in the application.
 * It ensures consistent timezone handling and serves as a wrapper around Luxon.
 * 
 * DO NOT use other timezone methods directly. Always use this service for timezone operations.
 */

import { DateTime, IANAZone, Zone } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

/**
 * Map of common timezone display names to IANA format
 */
const TIMEZONE_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time (AKT)': 'America/Anchorage',
  'Hawaii-Aleutian Time (HST)': 'Pacific/Honolulu',
  'Atlantic Time (AST)': 'America/Puerto_Rico',
  'GMT': 'Etc/GMT',
  'UTC': 'Etc/UTC'
};

/**
 * Available timezone options for UI display
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

/**
 * Time unit type for duration calculations
 */
export type TimeUnit = 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

/**
 * DateTime format options
 */
export type DateTimeFormat = string;

/**
 * Timezone Service
 * Central service for all timezone operations
 */
export class TimeZoneService {
  /**
   * Ensures the provided timezone is a valid IANA timezone string.
   * If not valid, falls back to the browser's timezone or America/Chicago
   */
  static ensureIANATimeZone(timeZone?: string): string {
    if (!timeZone) {
      console.warn('No timezone provided, using system default');
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        console.error('Error getting system timezone, using America/Chicago as fallback:', error);
        return 'America/Chicago';
      }
    }

    // If it's already a valid IANA timezone (contains a slash)
    if (timeZone && timeZone.includes('/')) {
      try {
        // Validate it's a real timezone
        if (IANAZone.isValidZone(timeZone)) {
          return timeZone;
        }
      } catch (error) {
        console.error(`Invalid IANA timezone: ${timeZone}`, error);
      }
    }

    // Try to map from common names
    if (timeZone && TIMEZONE_MAP[timeZone]) {
      return TIMEZONE_MAP[timeZone];
    }

    // If we couldn't get a valid timezone, use the browser's timezone or fallback
    try {
      console.warn(`Unable to map timezone "${timeZone}" to IANA format, using system default`);
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Error getting system timezone, using America/Chicago as fallback:', error);
      return 'America/Chicago';
    }
  }

  /**
   * Creates a DateTime object from date and time strings with timezone
   */
  static createDateTime(
    dateStr: string,
    timeStr: string,
    timeZone: string
  ): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    return DateTime.fromISO(dateStr, { zone: validTimeZone })
      .set({ hour: hours, minute: minutes });
  }

  /**
   * Converts a DateTime from one timezone to another
   */
  static convertDateTime(
    dateTime: DateTime,
    fromTimeZone: string,
    toTimeZone: string
  ): DateTime {
    const validFromTimeZone = this.ensureIANATimeZone(fromTimeZone);
    const validToTimeZone = this.ensureIANATimeZone(toTimeZone);
    
    // If already in the correct zone, return as is
    if (validFromTimeZone === validToTimeZone && dateTime.zone?.name === validFromTimeZone) {
      return dateTime;
    }
    
    // Set to the source timezone if not already set
    const dateTimeInSourceZone = dateTime.zone?.name === validFromTimeZone
      ? dateTime
      : dateTime.setZone(validFromTimeZone);
    
    // Convert to the target timezone
    return dateTimeInSourceZone.setZone(validToTimeZone);
  }

  /**
   * Format a DateTime object for display
   */
  static formatDateTime(
    dateTime: DateTime | Date | string,
    format: string,
    timeZone?: string
  ): string {
    // Convert to DateTime if not already
    let dt: DateTime;
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    if (!dt.isValid) {
      console.error('Invalid DateTime object', dt.invalidReason);
      return 'Invalid date';
    }
    
    // Set timezone if provided
    const dateTimeInZone = timeZone 
      ? dt.setZone(this.ensureIANATimeZone(timeZone))
      : dt;
      
    return dateTimeInZone.toFormat(format);
  }
  
  /**
   * Format just the date part
   */
  static formatDate(
    date: DateTime | Date | string,
    format: string = 'yyyy-MM-dd',
    timeZone?: string
  ): string {
    return this.formatDateTime(date, format, timeZone);
  }
  
  /**
   * Format just the time part
   */
  static formatTime(
    time: string | Date | DateTime,
    format: string = 'h:mm a',
    timeZone?: string
  ): string {
    // Handle time-only strings (e.g., "14:30")
    if (typeof time === 'string' && time.includes(':') && !time.includes('T') && !time.includes('-')) {
      const [hours, minutes] = time.split(':').map(Number);
      const now = DateTime.now();
      const dt = now.set({ hour: hours, minute: minutes });
      return dt.toFormat(format);
    }
    
    return this.formatDateTime(time, format, timeZone);
  }

  /**
   * Add a duration to a date
   */
  static addDuration(
    dateTime: DateTime | Date | string,
    amount: number,
    unit: TimeUnit
  ): DateTime {
    // Convert to DateTime if not already
    let dt: DateTime;
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    return dt.plus({ [unit]: amount });
  }

  /**
   * Converts a UTC string to a DateTime object in the specified timezone
   */
  static fromUTC(utcString: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(utcString, { zone: 'utc' }).setZone(validTimeZone);
  }

  /**
   * Converts a timestamp string from UTC to the specified timezone
   */
  static fromUTCTimestamp(timestamp: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(timestamp).setZone(validTimeZone);
  }

  /**
   * Converts a DateTime to UTC
   */
  static toUTC(dateTime: DateTime): DateTime {
    return dateTime.toUTC();
  }

  /**
   * Converts a string timestamp to UTC
   */
  static toUTCTimestamp(timestamp: string, sourceTimeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(sourceTimeZone);
    return DateTime.fromISO(timestamp, { zone: validTimeZone }).toUTC().toISO();
  }

  /**
   * Converts a calendar event's dates to the user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = this.ensureIANATimeZone(
      event.extendedProps?.sourceTimeZone || event.extendedProps?.timezone || userTimeZone
    );
    
    // Only convert if there's actually a difference in timezones
    if (sourceTimeZone === validTimeZone) {
      return {
        ...event,
        _userTimeZone: validTimeZone,
        extendedProps: {
          ...event.extendedProps,
          displayTimeZone: validTimeZone
        }
      };
    }

    try {
      // Convert start time
      const startDT = typeof event.start === 'string'
        ? DateTime.fromISO(event.start, { zone: sourceTimeZone })
        : DateTime.fromJSDate(event.start, { zone: sourceTimeZone });
        
      // Convert end time
      const endDT = typeof event.end === 'string'
        ? DateTime.fromISO(event.end, { zone: sourceTimeZone })
        : DateTime.fromJSDate(event.end, { zone: sourceTimeZone });
      
      // Check for validity
      if (!startDT.isValid || !endDT.isValid) {
        console.error('Invalid datetime in event conversion', {
          event,
          startValidity: startDT.isValid ? 'valid' : startDT.invalidReason,
          endValidity: endDT.isValid ? 'valid' : endDT.invalidReason
        });
        return event;
      }
      
      // Convert to user timezone
      const userStartDT = startDT.setZone(validTimeZone);
      const userEndDT = endDT.setZone(validTimeZone);
      
      // Update and return the event with converted times
      return {
        ...event,
        start: userStartDT.toISO(),
        end: userEndDT.toISO(),
        _userTimeZone: validTimeZone,
        extendedProps: {
          ...event.extendedProps,
          displayTimeZone: validTimeZone,
          displayStart: userStartDT.toFormat('h:mm a'),
          displayEnd: userEndDT.toFormat('h:mm a'),
          displayDay: userStartDT.toFormat('ccc'),
          displayDate: userStartDT.toFormat('MMM d')
        }
      };
    } catch (error) {
      console.error('Error converting event timezone:', error, { event, sourceTimeZone, userTimeZone });
      return event;
    }
  }

  /**
   * Format a timezone for display
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    try {
      const now = DateTime.now().setZone(validTimeZone);
      const offset = now.toFormat('ZZ');
      const abbr = now.toFormat('ZZZZ');
      
      // Get the city name from the timezone
      const cityName = validTimeZone.split('/').pop()?.replace(/_/g, ' ');
      
      return `${cityName} (${abbr}, ${offset})`;
    } catch (error) {
      console.error('Error formatting timezone display:', error);
      return validTimeZone;
    }
  }

  /**
   * Get the current time in a specific timezone
   */
  static getCurrentTimeIn(timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone);
  }
  
  /**
   * Get the current date and time as a DateTime object
   */
  static getCurrentDateTime(timeZone: string = 'UTC'): DateTime {
    return this.getCurrentTimeIn(timeZone);
  }

  /**
   * Check if two events overlap in time
   */
  static eventsOverlap(
    event1Start: DateTime | string, 
    event1End: DateTime | string,
    event2Start: DateTime | string,
    event2End: DateTime | string,
    timeZone: string
  ): boolean {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    // Convert string dates to DateTime objects
    const start1 = typeof event1Start === 'string' 
      ? DateTime.fromISO(event1Start, { zone: validTimeZone }) 
      : event1Start.setZone(validTimeZone);
      
    const end1 = typeof event1End === 'string'
      ? DateTime.fromISO(event1End, { zone: validTimeZone })
      : event1End.setZone(validTimeZone);
      
    const start2 = typeof event2Start === 'string'
      ? DateTime.fromISO(event2Start, { zone: validTimeZone })
      : event2Start.setZone(validTimeZone);
      
    const end2 = typeof event2End === 'string'
      ? DateTime.fromISO(event2End, { zone: validTimeZone })
      : event2End.setZone(validTimeZone);
    
    // Check for overlap
    return start1 < end2 && end1 > start2;
  }
  
  /**
   * Check if two dates represent the same day
   */
  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }
  
  /**
   * Parse a date string with timezone
   */
  static parseWithZone(dateString: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateString, { zone: validTimeZone });
  }
  
  /**
   * Get the weekday name from a date
   */
  static getWeekdayName(date: DateTime): string {
    return date.toFormat('cccc'); // Full weekday name
  }
  
  /**
   * Get the month name from a date
   */
  static getMonthName(date: DateTime): string {
    return date.toFormat('MMMM'); // Full month name
  }
  
  /**
   * Get the user's current timezone
   */
  static getUserTimeZone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Error getting user timezone:', error);
      return 'America/Chicago'; // Default fallback
    }
  }
  
  /**
   * Format a date to 12-hour time
   */
  static formatDateToTime12Hour(date: Date | string | DateTime): string {
    return this.formatTime(date, 'h:mm a');
  }
}

// Export the TimeZoneService as both default and named export
export default TimeZoneService;
