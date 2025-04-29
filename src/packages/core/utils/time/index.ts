
/**
 * THIS FILE IS BEING DEPRECATED
 * All timezone functionality should use TimeZoneService from @/utils/timezone directly
 * This file now re-exports functionality from TimeZoneService for backward compatibility
 */

// Import TimeZoneService from the correct path
import { TimeZoneService } from '../../../../utils/timezone';
import { DateTime } from 'luxon';

// Directly implement any missing functions to ensure backward compatibility
export const ensureIANATimeZone = TimeZoneService.ensureIANATimeZone;
export const formatTime = TimeZoneService.formatTime;
export const formatDateTime = TimeZoneService.formatDateTime;
export const formatTimeZoneDisplay = TimeZoneService.formatTimeZoneDisplay;
export const convertEventToUserTimeZone = TimeZoneService.convertEventToUserTimeZone;
export const createDateTime = TimeZoneService.createDateTime;
export const convertDateTime = TimeZoneService.convertDateTime;
export const fromUTC = TimeZoneService.fromUTC;
export const toUTC = TimeZoneService.toUTC;
export const parseWithZone = TimeZoneService.parseWithZone;

// Implement missing functions
export const formatDateToTime12Hour = (date: Date | string): string => {
  const dt = typeof date === 'string' ? new Date(date) : date;
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const getCurrentDateTime = (timeZone?: string): DateTime => {
  return DateTime.now().setZone(timeZone || 'UTC');
};

export const isSameDay = (date1: DateTime, date2: DateTime): boolean => {
  return date1.hasSame(date2, 'day');
};

export const addDuration = (date: DateTime, amount: number, unit: string): DateTime => {
  return date.plus({ [unit]: amount });
};

export const getWeekdayName = (date: DateTime, format: 'long' | 'short' = 'long'): string => {
  return date.toFormat(format === 'long' ? 'EEEE' : 'EEE');
};

export const getMonthName = (date: DateTime, format: 'long' | 'short' = 'long'): string => {
  return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
};

export const formatDate = (date: DateTime | Date | string, format: string = 'yyyy-MM-dd'): string => {
  if (date instanceof Date) {
    return DateTime.fromJSDate(date).toFormat(format);
  }
  if (typeof date === 'string') {
    return DateTime.fromISO(date).toFormat(format);
  }
  return date.toFormat(format);
};

export const getUserTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getDisplayNameFromIANA = (timeZone: string): string => {
  try {
    // Try to get a user-friendly name from the IANA identifier
    const parts = timeZone.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    return city;
  } catch (error) {
    return timeZone;
  }
};

export const getIANAFromDisplayName = (displayName: string): string => {
  // This is a simplified implementation - in reality, you would need a more comprehensive mapping
  const displayToIANA: Record<string, string> = {
    'Eastern Time': 'America/New_York',
    'Central Time': 'America/Chicago',
    'Mountain Time': 'America/Denver',
    'Pacific Time': 'America/Los_Angeles',
    // Add more mappings as needed
  };
  
  return displayToIANA[displayName] || 'UTC';
};

export const getTimezoneOffsetString = (timeZone: string): string => {
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
};

// Add deprecated warning to old imports
console.warn(
  'You are importing from packages/core/utils/time/index.ts, which is deprecated. ' +
  'Please import from @/utils/timezone directly. ' +
  'These re-exports will be removed in a future update.'
);
