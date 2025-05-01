import { DateTime } from 'luxon';
import { TimeZoneService as CoreTimeZoneService } from '@/utils/timezone';
import { TimeZoneError } from '@/utils/timezone/TimeZoneError';
import { CalendarError } from './CalendarErrorHandler';

/**
 * TimeZoneService
 * 
 * A specialized service for handling time zones in the calendar system.
 * This service extends the core TimeZoneService with calendar-specific functionality.
 */
export class TimeZoneService {
  /**
   * Validates a timezone string and returns a valid IANA timezone
   * 
   * @param timeZone - The timezone string to validate
   * @returns A valid IANA timezone string
   * @throws CalendarError if the timezone is invalid
   */
  static validateTimeZone(timeZone: string): string {
    try {
      return CoreTimeZoneService.ensureIANATimeZone(timeZone);
    } catch (error) {
      if (error instanceof TimeZoneError) {
        throw new CalendarError(
          `Invalid timezone: ${timeZone}`,
          'CALENDAR_TIMEZONE_ERROR',
          { originalTimeZone: timeZone }
        );
      }
      throw error;
    }
  }

  /**
   * Converts a date from one timezone to another
   * 
   * @param date - The date to convert
   * @param fromTimeZone - The source timezone
   * @param toTimeZone - The target timezone
   * @returns The converted date
   */
  static convertTimeZone(date: Date | string, fromTimeZone: string, toTimeZone: string): Date {
    try {
      const validFromTimeZone = this.validateTimeZone(fromTimeZone);
      const validToTimeZone = this.validateTimeZone(toTimeZone);

      let dateTime: DateTime;
      if (typeof date === 'string') {
        dateTime = CoreTimeZoneService.parseWithZone(date, validFromTimeZone);
      } else {
        dateTime = DateTime.fromJSDate(date).setZone(validFromTimeZone);
      }

      return dateTime.setZone(validToTimeZone).toJSDate();
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert between timezones',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          date, 
          fromTimeZone, 
          toTimeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Formats a date for display with timezone information
   * 
   * @param date - The date to format
   * @param format - The format string (optional)
   * @param timeZone - The timezone to use (optional)
   * @returns The formatted date string
   */
  static formatDateTime(date: Date | string, format?: string, timeZone?: string): string {
    try {
      return CoreTimeZoneService.formatDateTime(
        date, 
        format || 'yyyy-MM-dd HH:mm', 
        timeZone ? this.validateTimeZone(timeZone) : undefined
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to format date with timezone',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          date, 
          format, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a DateTime object from date and time strings in a specific timezone
   * 
   * @param dateStr - The date string (YYYY-MM-DD)
   * @param timeStr - The time string (HH:MM)
   * @param timeZone - The timezone
   * @returns A DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    try {
      const validTimeZone = this.validateTimeZone(timeZone);
      return CoreTimeZoneService.createDateTime(dateStr, timeStr, validTimeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create date time with timezone',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          dateStr, 
          timeStr, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets the current date and time in a specific timezone
   * 
   * @param timeZone - The timezone
   * @returns The current date and time
   */
  static getCurrentDateTime(timeZone: string): DateTime {
    try {
      const validTimeZone = this.validateTimeZone(timeZone);
      return CoreTimeZoneService.getCurrentDateTime(validTimeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get current date time with timezone',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Converts a date to UTC
   * 
   * @param date - The date to convert
   * @param timeZone - The source timezone
   * @returns The UTC date string
   */
  static toUTC(date: Date | string, timeZone: string): string {
    try {
      const validTimeZone = this.validateTimeZone(timeZone);
      return CoreTimeZoneService.toUTCTimestamp(date, validTimeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert date to UTC',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          date, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Converts a UTC date string to a date in a specific timezone
   * 
   * @param utcStr - The UTC date string
   * @param timeZone - The target timezone
   * @returns The date in the target timezone
   */
  static fromUTC(utcStr: string, timeZone: string): Date {
    try {
      const validTimeZone = this.validateTimeZone(timeZone);
      return CoreTimeZoneService.fromUTC(utcStr, validTimeZone).toJSDate();
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert UTC date to timezone',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          utcStr, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets a user-friendly display name for a timezone
   * 
   * @param timeZone - The timezone
   * @returns The display name
   */
  static getTimeZoneDisplayName(timeZone: string): string {
    try {
      const validTimeZone = this.validateTimeZone(timeZone);
      return CoreTimeZoneService.formatTimeZoneDisplay(validTimeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get timezone display name',
        'CALENDAR_TIMEZONE_ERROR',
        { 
          timeZone, 
          originalError: error 
        }
      );
    }
  }
}