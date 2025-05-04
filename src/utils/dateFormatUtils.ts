
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Format a date string with the specified format
 */
export const formatDate = (date: string | Date, format: string = 'yyyy-MM-dd', timezone?: string): string => {
  return TimeZoneService.formatDate(date, format, timezone);
};

/**
 * Format a date and time with the specified format
 */
export const formatDateTime = (date: string | Date, format: string = 'yyyy-MM-dd HH:mm', timezone?: string): string => {
  return TimeZoneService.formatDateTime(date, format, timezone);
};

/**
 * Format a time with the specified format
 */
export const formatTime = (time: string | Date, format: string = 'h:mm a', timezone?: string): string => {
  return TimeZoneService.formatTime(time, format, timezone);
};

/**
 * Add a duration to a date
 */
export const addDuration = (date: string | Date | DateTime, amount: number, unit: string): DateTime => {
  return TimeZoneService.addDuration(date, amount, unit);
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: string | Date | DateTime, date2: string | Date | DateTime): boolean => {
  return TimeZoneService.isSameDay(date1, date2);
};

/**
 * Parse a date string with a timezone
 */
export const parseWithZone = (dateStr: string, timezone: string): DateTime => {
  return TimeZoneService.parseWithZone(dateStr, timezone);
};

/**
 * Convert a date to an ISO string with timezone
 */
export const toISOWithZone = (dateStr: string, timezone: string): string => {
  const dt = TimeZoneService.parseWithZone(dateStr, timezone);
  return dt.toISO() || '';
};

/**
 * Get the current date and time in the specified timezone
 */
export const getCurrentDateTime = (timezone?: string): DateTime => {
  return TimeZoneService.getCurrentDateTime(timezone);
};

/**
 * Format a date in a specific timezone
 */
export const formatInTimezone = (date: string | Date, format: string, timezone: string): string => {
  return TimeZoneService.formatDateTime(date, format, timezone);
};

/**
 * Get the weekday name from a date
 */
export const getWeekdayName = (date: string | Date | DateTime): string => {
  return TimeZoneService.getWeekdayName(date);
};

/**
 * Get the month name from a date
 */
export const getMonthName = (date: string | Date | DateTime): string => {
  return TimeZoneService.getMonthName(date);
};
