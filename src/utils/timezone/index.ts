
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import * as Core from './core';
import * as Formatting from './formatting';
import * as Calendar from './calendar';
import { TimeZoneError } from './TimeZoneError';

export type { DateTimeFormat } from './formatting';
export type TimeUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export { TimeZoneError } from './TimeZoneError';

/**
 * TimeZoneService Interface
 * This interface defines all methods available in the TimeZoneService
 */
export interface TimeZoneServiceInterface {
  // Constants
  TIMEZONE_OPTIONS: typeof Core.TIMEZONE_OPTIONS;
  
  // Core functions
  ensureIANATimeZone(timeZone?: string): string;
  createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime;
  toUTC(dateTime: DateTime): DateTime;
  fromUTC(utcStr: string, timeZone: string): DateTime;
  convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime;
  parseWithZone(dateTimeStr: string, timeZone: string): DateTime;
  getCurrentDateTime(timeZone?: string): DateTime;
  isSameDay(date1: DateTime, date2: DateTime): boolean;
  addDuration(date: DateTime, amount: number, unit: TimeUnit): DateTime;
  getUserTimeZone(): string;
  
  // Formatting functions
  formatTimeZoneDisplay(timeZone: string): string;
  formatDateTime(dateTime: DateTime | Date | string, format?: string | Formatting.DateTimeFormat, timeZone?: string): string;
  formatTime(time: string | Date, format?: string, timeZone?: string): string;
  formatDate(date: DateTime | Date | string, format?: string): string;
  formatDateToTime12Hour(date: Date | string): string;
  getWeekdayName(date: DateTime, format?: 'long' | 'short'): string;
  getMonthName(date: DateTime, format?: 'long' | 'short'): string;
  getDisplayNameFromIANA(timeZone: string): string;
  getIANAFromDisplayName(displayName: string): string;
  getTimezoneOffsetString(timeZone: string): string;
  
  // Calendar functions
  convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent;
  
  // UTC timestamp conversion with proper overloads
  toUTCTimestamp(dateTime: Date | string, timeZone: string): string;
  toUTCTimestamp(dateStr: string, timeStr: string, timeZone: string): string;
  fromUTCTimestamp(timestamp: string, timeZone: string): DateTime;
}

/**
 * TimeZoneService - THE OFFICIAL SOURCE OF TRUTH for all timezone operations
 */
export const TimeZoneService: TimeZoneServiceInterface = {
  // Constants
  TIMEZONE_OPTIONS: Core.TIMEZONE_OPTIONS,
  
  // Core functions
  ensureIANATimeZone: Core.ensureIANATimeZone,
  createDateTime: Core.createDateTime,
  toUTC: Core.toUTC,
  fromUTC: Core.fromUTC,
  convertDateTime: Core.convertDateTime,
  parseWithZone: Core.parseWithZone,
  getCurrentDateTime: Core.getCurrentDateTime,
  isSameDay: Core.isSameDay,
  addDuration: Core.addDuration,
  getUserTimeZone: Core.getUserTimeZone,
  
  // Formatting functions
  formatTimeZoneDisplay: Formatting.formatTimeZoneDisplay,
  formatDateTime: Formatting.formatDateTime,
  formatTime: Formatting.formatTime,
  formatDate: Formatting.formatDate,
  formatDateToTime12Hour: Formatting.formatDateToTime12Hour,
  getWeekdayName: Formatting.getWeekdayName,
  getMonthName: Formatting.getMonthName,
  getDisplayNameFromIANA: Formatting.getDisplayNameFromIANA,
  getIANAFromDisplayName: Formatting.getIANAFromDisplayName,
  getTimezoneOffsetString: Formatting.getTimezoneOffsetString,
  
  // Calendar functions
  convertEventToUserTimeZone: Calendar.convertEventToUserTimeZone,
  
  // UTC timestamp conversion
  toUTCTimestamp: Core.toUTCTimestamp,
  fromUTCTimestamp: Core.fromUTCTimestamp
};

