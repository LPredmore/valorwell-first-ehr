/**
 * TimeZoneService - THE OFFICIAL SOURCE OF TRUTH for all timezone operations
 * 
 * Core Principles:
 * - All timezone operations MUST use Luxon through this class
 * - All dates/times MUST be stored in UTC in the database
 * - All timezone conversions MUST happen at the display layer only
 * - All timezone strings MUST be in IANA format (e.g., 'America/New_York')
 */

import { DateTime, Duration } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

export type TimeUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export type DateTimeFormat = 
  | 'DATE_FULL'           // September 21, 2024
  | 'DATE_SHORT'          // 9/21/2024
  | 'TIME_12H'            // 3:45 PM
  | 'TIME_24H'            // 15:45
  | 'DATETIME_FULL'       // September 21, 2024, 3:45 PM
  | 'DATETIME_SHORT'      // 9/21/2024, 3:45 PM
  | 'ISO'                 // 2024-09-21T15:45:00.000Z
  | 'SQL'                 // 2024-09-21 15:45:00
  | 'RELATIVE';           // 3 days ago, in 5 hours, etc.

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' }
];

export const timezoneOptions = TIMEZONE_OPTIONS;

const TIMEZONE_NAME_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time': 'America/Anchorage',
  'Hawaii Time': 'Pacific/Honolulu',
  'Arizona': 'America/Phoenix'
};

interface TimeZoneServiceInterface {
  ensureIANATimeZone(timeZone?: string): string;
  formatTimeZoneDisplay(timeZone: string): string;
  createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime;
  toUTC(dateTime: DateTime): DateTime;
  fromUTC(utcStr: string, timeZone: string): DateTime;
  convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime;
  formatDateTime(dateTime: DateTime | Date | string, format?: string | DateTimeFormat, timeZone?: string): string;
  formatTime(time: string | Date, format?: string, timeZone?: string): string;
  convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent;
  getUserTimeZone(): string;
  parseWithZone(dateTimeStr: string, timeZone: string): DateTime;
  getCurrentDateTime(timeZone?: string): DateTime;
  formatDateToTime12Hour(date: Date | string): string;
  isSameDay(date1: DateTime, date2: DateTime): boolean;
  addDuration(date: DateTime, amount: number, unit: TimeUnit): DateTime;
  getWeekdayName(date: DateTime, format?: 'long' | 'short'): string;
  getMonthName(date: DateTime, format?: 'long' | 'short'): string;
  formatDate(date: DateTime | Date | string, format?: string): string;
  getDisplayNameFromIANA(timeZone: string): string;
  getIANAFromDisplayName(displayName: string): string;
  getTimezoneOffsetString(timeZone: string): string;
  toUTCTimestamp(date: Date | string, timeZone?: string): string;
  fromUTCTimestamp(timestamp: string, timeZone: string): DateTime;
}

export const TimeZoneService: TimeZoneServiceInterface = {
  ensureIANATimeZone(timeZone?: string): string {
    try {
      if (!timeZone) {
        console.warn('[TimeZoneService] No timezone provided, defaulting to UTC');
        return 'UTC';
      }
      
      const now = DateTime.now();
      const validZone = now.setZone(timeZone);
      
      if (!validZone.isValid) {
        console.error(`[TimeZoneService] Invalid timezone: ${timeZone}, reason: ${validZone.invalidReason}, defaulting to UTC`);
        return 'UTC';
      }
      
      return timeZone;
    } catch (error) {
      console.error('[TimeZoneService] Error validating timezone:', error);
      return 'UTC';
    }
  },

  formatTimeZoneDisplay(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    const tzOption = TIMEZONE_OPTIONS.find(option => option.value === validTimeZone);
    if (tzOption) {
      return tzOption.label;
    }
    
    try {
      const now = DateTime.now().setZone(validTimeZone);
      return now.toFormat('ZZZZ');
    } catch (error) {
      return validTimeZone.split('/').pop()?.replace('_', ' ') || validTimeZone;
    }
  },

  createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const timeFormat = timeStr.includes(':') ? (timeStr.split(':').length > 2 ? 'HH:mm:ss' : 'HH:mm') : 'HH';
    
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, `yyyy-MM-dd ${timeFormat}`, { zone: validTimeZone });
  },

  toUTC(dateTime: DateTime): DateTime {
    return dateTime.toUTC();
  },

  fromUTC(utcStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(utcStr).setZone(validTimeZone);
  },

  convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    return dateTime.setZone(validFromZone).setZone(validToZone);
  },

  formatDateTime(dateTime: DateTime | Date | string, format: string | DateTimeFormat = 'DATETIME_SHORT', timeZone?: string): string {
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    if (timeZone) {
      const validTimeZone = this.ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    switch (format) {
      case 'DATE_FULL':
        return dt.toFormat('MMMM d, yyyy');
      case 'DATE_SHORT':
        return dt.toFormat('M/d/yyyy');
      case 'TIME_12H':
        return dt.toFormat('h:mm a');
      case 'TIME_24H':
        return dt.toFormat('HH:mm');
      case 'DATETIME_FULL':
        return dt.toFormat('MMMM d, yyyy, h:mm a');
      case 'DATETIME_SHORT':
        return dt.toFormat('M/d/yyyy, h:mm a');
      case 'ISO':
        return dt.toISO();
      case 'SQL':
        return dt.toFormat('yyyy-MM-dd HH:mm:ss');
      case 'RELATIVE':
        return dt.toRelative() || dt.toFormat('M/d/yyyy, h:mm a');
      default:
        return dt.toFormat(format);
    }
  },

  formatTime(time: string | Date, format: string = 'h:mm a', timeZone?: string): string {
    try {
      let dt: DateTime;
      
      if (time instanceof Date) {
        dt = DateTime.fromJSDate(time);
      } else if (typeof time === 'string') {
        if (time.includes('T') && (time.includes('Z') || time.includes('+'))) {
          dt = DateTime.fromISO(time);
        } else if (time.includes(':')) {
          const parts = time.split(':').map(Number);
          dt = DateTime.now().set({
            hour: parts[0] || 0,
            minute: parts[1] || 0,
            second: parts[2] || 0,
            millisecond: 0
          });
        } else {
          throw new Error(`Unsupported time format: ${time}`);
        }
      } else {
        throw new Error('Time must be a string or Date object');
      }
      
      if (timeZone) {
        const validTimeZone = this.ensureIANATimeZone(timeZone);
        dt = dt.setZone(validTimeZone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error formatting time:', error);
      return String(time);
    }
  },

  convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    
    if (!event.start || !event.end) {
      return event;
    }
    
    try {
      let startDt: DateTime;
      let endDt: DateTime;
      
      if (event.start instanceof Date) {
        startDt = DateTime.fromJSDate(event.start).setZone(validTimeZone);
      } else {
        startDt = DateTime.fromISO(String(event.start)).setZone(validTimeZone);
      }
      
      if (event.end instanceof Date) {
        endDt = DateTime.fromJSDate(event.end).setZone(validTimeZone);
      } else {
        endDt = DateTime.fromISO(String(event.end)).setZone(validTimeZone);
      }
      
      const extendedProps = {
        ...(event.extendedProps || {}),
        displayStart: startDt.toFormat('h:mm a'),
        displayEnd: endDt.toFormat('h:mm a'),
        displayDay: startDt.toFormat('ccc'),
        displayDate: startDt.toFormat('MMM d')
      };
      
      return {
        ...event,
        start: startDt.toISO(),
        end: endDt.toISO(),
        title: event.title || '',
        extendedProps
      };
    } catch (error) {
      console.error('Error converting event to user timezone:', error);
      return event;
    }
  },

  getUserTimeZone(): string {
    try {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.ensureIANATimeZone(browserTimeZone);
    } catch (error) {
      console.warn('Error detecting browser timezone:', error);
      return 'America/Chicago';
    }
  },

  parseWithZone(dateTimeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
  },

  getCurrentDateTime(timeZone?: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone);
  },

  formatDateToTime12Hour(date: Date | string): string {
    const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return dt.toFormat('h:mm a');
  },

  isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  },

  addDuration(date: DateTime, amount: number, unit: TimeUnit): DateTime {
    return date.plus({ [unit]: amount });
  },

  getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'cccc' : 'ccc');
  },

  getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
  },

  formatDate(date: DateTime | Date | string, format: string = 'yyyy-MM-dd'): string {
    let dt: DateTime;
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    return dt.toFormat(format);
  },

  getDisplayNameFromIANA(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const option = TIMEZONE_OPTIONS.find(tz => tz.value === validTimeZone);
    return option?.label || validTimeZone;
  },

  getIANAFromDisplayName(displayName: string): string {
    const option = TIMEZONE_OPTIONS.find(tz => tz.label === displayName);
    return option?.value || this.getUserTimeZone();
  },

  getTimezoneOffsetString(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone).toFormat('ZZ');
  },

  toUTCTimestamp(date: Date | string, timeZone?: string): string {
    let dt: DateTime;
    if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    if (timeZone) {
      dt = dt.setZone(this.ensureIANATimeZone(timeZone));
    }
    
    return dt.toUTC().toISO();
  },

  fromUTCTimestamp(timestamp: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(timestamp).setZone(validTimeZone);
  }
};
