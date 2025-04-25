
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

export class TimeZoneService {
  static ensureIANATimeZone(timeZone: string): string {
    try {
      if (!timeZone || DateTime.local().setZone(timeZone).invalidReason) {
        console.warn(`Invalid timezone ${timeZone}, falling back to UTC`);
        return 'UTC';
      }
      return timeZone;
    } catch (error) {
      console.error('Error validating timezone:', error);
      return 'UTC';
    }
  }

  static formatTimeZoneDisplay(timezone: string): string {
    try {
      const now = DateTime.now().setZone(timezone);
      if (now.isValid) {
        return `${now.zoneName} (${now.toFormat('ZZZZ')})`;
      }
      return timezone;
    } catch (error) {
      console.error('Error formatting timezone:', error);
      return timezone;
    }
  }

  static formatTime(time: string, format: string = 'h:mm a', timezone?: string): string {
    try {
      let dt = DateTime.fromISO(time);
      if (timezone) {
        dt = dt.setZone(timezone);
      }
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  }

  static toUTCTimestamp(date: Date | string, time: string, timezone: string): string {
    try {
      const dateStr = typeof date === 'string' ? date : DateTime.fromJSDate(date).toISODate();
      const dt = DateTime.fromFormat(`${dateStr} ${time}`, 'yyyy-MM-dd HH:mm', { zone: timezone });
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('Error converting to UTC timestamp:', error);
      throw error;
    }
  }

  static fromUTCTimestamp(timestamp: string, timezone: string): DateTime {
    try {
      return DateTime.fromISO(timestamp).setZone(timezone);
    } catch (error) {
      console.error('Error converting from UTC timestamp:', error);
      throw error;
    }
  }

  static formatTimeForUser(time: string, timezone: string): string {
    try {
      return this.fromUTCTimestamp(time, timezone).toFormat('h:mm a');
    } catch (error) {
      console.error('Error formatting time for user:', error);
      return time;
    }
  }

  static convertDateTime(
    dateTime: string | Date,
    sourceTimeZone: string,
    targetTimeZone: string
  ): DateTime {
    try {
      const dt = typeof dateTime === 'string' 
        ? DateTime.fromISO(dateTime, { zone: sourceTimeZone })
        : DateTime.fromJSDate(dateTime).setZone(sourceTimeZone);
      return dt.setZone(targetTimeZone);
    } catch (error) {
      console.error('Error converting datetime between timezones:', error);
      throw error;
    }
  }

  static createISODateTimeString(date: Date | string, time: string, timezone: string): string {
    try {
      const dateStr = typeof date === 'string' ? date : DateTime.fromJSDate(date).toISODate();
      return DateTime.fromFormat(`${dateStr} ${time}`, 'yyyy-MM-dd HH:mm', { zone: timezone }).toISO();
    } catch (error) {
      console.error('Error creating ISO datetime string:', error);
      throw error;
    }
  }

  static formatWithTimeZone(date: Date | string, format: string, timezone: string): string {
    try {
      const dt = typeof date === 'string' 
        ? DateTime.fromISO(date, { zone: timezone })
        : DateTime.fromJSDate(date).setZone(timezone);
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error formatting with timezone:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  }

  static parseWithZone(dateStr: string, timezone: string): DateTime {
    return DateTime.fromISO(dateStr).setZone(timezone);
  }

  static fromUTC(utcStr: string, timezone: string): DateTime {
    return DateTime.fromISO(utcStr).setZone(timezone);
  }

  static toUTC(localDateTime: DateTime | string): DateTime {
    const dt = typeof localDateTime === 'string' ? DateTime.fromISO(localDateTime) : localDateTime;
    return dt.toUTC();
  }

  static formatDateToTime12Hour(date: Date): string {
    return DateTime.fromJSDate(date).toFormat('h:mm a');
  }
}
