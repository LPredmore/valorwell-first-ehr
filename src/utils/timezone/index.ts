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
import { TimeUnit, DateTimeFormat, CalendarEventType } from './types';

// Export the types
export type { TimeUnit, DateTimeFormat, CalendarEventType };

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
   * Gets the local timezone of the browser
   */
  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Gets the user's timezone - alias for getLocalTimeZone
   */
  static getUserTimeZone(): string {
    return this.getLocalTimeZone();
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
    dateTime: DateTime | string | Date,
    fromTimeZone: string,
    toTimeZone: string
  ): DateTime {
    const validFromTimeZone = this.ensureIANATimeZone(fromTimeZone);
    const validToTimeZone = this.ensureIANATimeZone(toTimeZone);
    
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime.setZone(validFromTimeZone);
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime).setZone(validFromTimeZone);
    } else {
      dt = DateTime.fromISO(dateTime).setZone(validFromTimeZone);
    }
    
    return dt.setZone(validToTimeZone);
  }

  /**
   * Format a DateTime object for display
   */
  static formatDateTime(
    dateTime: DateTime | Date | string,
    format: string = 'full',
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
    return this.formatDateTime(time, format, timeZone);
  }

  /**
   * Converts a calendar event's dates to the user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = event.extendedProps?.sourceTimeZone || 'UTC';
    
    let eventStart: DateTime;
    let eventEnd: DateTime;
    
    // Convert start time
    if (typeof event.start === 'string') {
      eventStart = DateTime.fromISO(event.start, { zone: sourceTimeZone }).setZone(validTimeZone);
    } else {
      eventStart = DateTime.fromJSDate(event.start, { zone: sourceTimeZone }).setZone(validTimeZone);
    }
    
    // Convert end time
    if (typeof event.end === 'string') {
      eventEnd = DateTime.fromISO(event.end, { zone: sourceTimeZone }).setZone(validTimeZone);
    } else {
      eventEnd = DateTime.fromJSDate(event.end, { zone: sourceTimeZone }).setZone(validTimeZone);
    }
    
    // Create additional display fields for the event
    const displayStart = this.formatTime(eventStart);
    const displayEnd = this.formatTime(eventEnd);
    const displayDay = eventStart.toFormat('cccc');
    const displayDate = eventStart.toFormat('MMM d, yyyy');
    
    // Return the event with converted times and display fields
    return {
      ...event,
      start: eventStart.toJSDate(),
      end: eventEnd.toJSDate(),
      extendedProps: {
        ...event.extendedProps,
        sourceTimeZone,
        displayStart,
        displayEnd,
        displayDay,
        displayDate,
        _userTimeZone: validTimeZone
      }
    };
  }

  /**
   * Converts a DateTime to UTC
   */
  static toUTC(date: Date | DateTime): DateTime {
    if (date instanceof DateTime) {
      return date.toUTC();
    }
    return DateTime.fromJSDate(date).toUTC();
  }

  /**
   * Converts a UTC string to a DateTime in the specified timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(validTimeZone);
  }

  /**
   * Parse a date string with timezone
   */
  static parseWithZone(dateString: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateString, { zone: validTimeZone });
  }
  
  /**
   * Convert a date to a UTC timestamp in milliseconds
   */
  static toUTCTimestamp(date: Date | DateTime | string, sourceTimeZone?: string): number {
    if (date instanceof DateTime) {
      return date.toUTC().toMillis();
    } else if (date instanceof Date) {
      return DateTime.fromJSDate(date).toUTC().toMillis();
    } else {
      // For string dates, use the source timezone if provided
      const zone = sourceTimeZone ? this.ensureIANATimeZone(sourceTimeZone) : 'UTC';
      return DateTime.fromISO(date, { zone }).toUTC().toMillis();
    }
  }

  /**
   * Convert a UTC timestamp to a DateTime in the specified timezone
   */
  static fromUTCTimestamp(timestamp: number, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromMillis(timestamp, { zone: 'UTC' }).setZone(validTimeZone);
  }
  
  /**
   * Add a duration to a DateTime
   */
  static addDuration(date: DateTime, amount: number, unit: TimeUnit): DateTime {
    return date.plus({ [unit]: amount });
  }
  
  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }
  
  /**
   * Get the current date and time in the specified timezone
   */
  static getCurrentDateTime(timezone?: string): DateTime {
    const validTimeZone = timezone ? this.ensureIANATimeZone(timezone) : undefined;
    return DateTime.now().setZone(validTimeZone);
  }
  
  /**
   * Get the name of the weekday for a date
   */
  static getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'EEEE' : 'EEE');
  }
  
  /**
   * Get the name of the month for a date
   */
  static getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
  }
  
  /**
   * Format a timezone for display
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    try {
      const now = DateTime.now().setZone(timeZone);
      if (!now.isValid) return timeZone;
      
      const offset = now.toFormat('ZZ');
      const label = timeZone.replace(/_/g, ' ').split('/').pop() || timeZone;
      return `${label} (GMT${offset})`;
    } catch (error) {
      return timeZone;
    }
  }

  /**
   * Format date to 12-hour time format
   */
  static formatDateToTime12Hour(date: Date | string): string {
    const dt = typeof date === 'string' ? new Date(date) : date;
    return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  /**
   * Get display name from IANA timezone identifier
   */
  static getDisplayNameFromIANA(timeZone: string): string {
    try {
      // Try to get a user-friendly name from the IANA identifier
      const parts = timeZone.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      return city;
    } catch (error) {
      return timeZone;
    }
  }
  
  /**
   * Get IANA timezone from display name
   */
  static getIANAFromDisplayName(displayName: string): string {
    // This is a simplified implementation - in reality, you would need a more comprehensive mapping
    const displayToIANA: Record<string, string> = {
      'Eastern Time': 'America/New_York',
      'Central Time': 'America/Chicago',
      'Mountain Time': 'America/Denver',
      'Pacific Time': 'America/Los_Angeles',
      // Add more mappings as needed
    };
    
    return displayToIANA[displayName] || 'UTC';
  }
  
  /**
   * Get timezone offset string (e.g., GMT+2)
   */
  static getTimezoneOffsetString(timeZone: string): string {
    try {
      const now = new Date();
      const options = { timeZone, timeZoneName: 'short' as const };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart?.value || '';
    } catch (error) {
      return '';
    }
  }
}

// Export the TimeZoneService as both default and named export
export default TimeZoneService;
