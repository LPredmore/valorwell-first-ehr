
/**
 * @module TimeZoneService
 * @description A comprehensive service for handling timezone operations throughout the application.
 * This is the official source of truth for all timezone-related functionality.
 *
 * The service is organized into three main categories:
 * 1. Core functions - Basic timezone conversion and manipulation
 * 2. Formatting functions - Display and formatting of dates and times
 * 3. Calendar functions - Calendar-specific timezone operations
 *
 * @example
 * // Converting between timezones
 * import { TimeZoneService } from '@/utils/timezone';
 *
 * // Create a datetime in a specific timezone
 * const appointmentTime = TimeZoneService.createDateTime('2025-04-28', '14:30', 'America/New_York');
 *
 * // Convert to user's timezone
 * const userTimeZone = 'America/Los_Angeles';
 * const localTime = TimeZoneService.convertDateTime(appointmentTime, 'America/New_York', userTimeZone);
 *
 * // Format for display
 * const displayTime = TimeZoneService.formatDateTime(localTime, 'full');
 * // "Monday, April 28, 2025, 11:30 AM PDT"
 */

import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import * as Core from './core';
import * as Formatting from './formatting';
import * as Calendar from './calendar';
import * as DateTimeUtils from './dateTimeUtils';
import { TimeZoneError } from './TimeZoneError';

export type { DateTimeFormat } from './formatting';
/**
 * @typedef TimeUnit
 * @description Time units that can be used for duration calculations
 */
export type TimeUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export { TimeZoneError } from './TimeZoneError';
export {
  ensureDateTime,
  toISOString,
  safeToDateTime,
  calendarDateToDateTime,
  areDateTimesEqual,
  toAPIDateTime,
  toDisplayDateTime
} from './dateTimeUtils';

/**
 * @interface TimeZoneServiceInterface
 * @description Defines all methods available in the TimeZoneService
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
  
  // DateTime utility functions
  ensureDateTime(value: DateTime | Date | string, timeZone: string): DateTime;
  toISOString(dateTime: DateTime | Date | string, timeZone: string): string;
  safeToDateTime(value: any, timeZone: string): DateTime | null;
  calendarDateToDateTime(date: string | Date, timeZone: string): DateTime;
  areDateTimesEqual(a: DateTime | Date | string, b: DateTime | Date | string, timeZone: string): boolean;
  toAPIDateTime(value: DateTime | Date | string, timeZone: string): string;
  toDisplayDateTime(value: DateTime | Date | string, timeZone: string, format?: 'datetime' | 'date' | 'time'): string;
}

/**
 * @const TimeZoneService
 * @description THE OFFICIAL SOURCE OF TRUTH for all timezone operations in the application.
 * Provides a unified API for working with timezones, dates, and times.
 *
 * Key features:
 * - Consistent timezone handling across the application
 * - Robust error handling with detailed error messages
 * - Support for formatting dates and times in various formats
 * - Calendar-specific timezone operations
 * - Conversion between different timezone representations
 *
 * @example
 * // Basic usage
 * import { TimeZoneService } from '@/utils/timezone';
 *
 * // Get current time in user's timezone
 * const now = TimeZoneService.getCurrentDateTime('America/Chicago');
 *
 * // Format for display
 * const formattedDate = TimeZoneService.formatDateTime(now, 'full');
 *
 * @example
 * // Working with calendar events
 * import { TimeZoneService } from '@/utils/timezone';
 *
 * // Convert a calendar event from server timezone to user timezone
 * const localEvent = TimeZoneService.convertEventToUserTimeZone(
 *   serverEvent,
 *   'America/Chicago'
 * );
 *
 * @example
 * // Error handling
 * import { TimeZoneService, TimeZoneError } from '@/utils/timezone';
 *
 * try {
 *   const dateTime = TimeZoneService.parseWithZone('2025-04-28T14:30:00', 'Invalid/Zone');
 * } catch (error) {
 *   if (error instanceof TimeZoneError) {
 *     console.error(`TimeZone error: ${error.message}, Code: ${error.code}`);
 *   }
 * }
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
  fromUTCTimestamp: Core.fromUTCTimestamp,
  
  // DateTime utility functions
  ensureDateTime: DateTimeUtils.ensureDateTime,
  toISOString: DateTimeUtils.toISOString,
  safeToDateTime: DateTimeUtils.safeToDateTime,
  calendarDateToDateTime: DateTimeUtils.calendarDateToDateTime,
  areDateTimesEqual: DateTimeUtils.areDateTimesEqual,
  toAPIDateTime: DateTimeUtils.toAPIDateTime,
  toDisplayDateTime: DateTimeUtils.toDisplayDateTime
};

