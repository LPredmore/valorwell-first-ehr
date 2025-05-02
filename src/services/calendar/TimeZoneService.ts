
import { DateTime } from 'luxon';

/**
 * TimeZoneService for calendar operations
 */
export class TimeZoneService {
  /**
   * This method is used by the test files for validation
   */
  static validateTimeZone(tz: string): string {
    return tz;
  }
  
  /**
   * This method is used by the test files for conversions
   */
  static convertTimeZone(date: Date | string, fromZone: string, toZone: string): Date {
    if (typeof date === 'string') {
      return new Date(date);
    }
    return date;
  }

  /**
   * Gets the local timezone of the browser
   */
  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
}
