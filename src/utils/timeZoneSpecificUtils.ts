
/**
 * @deprecated Use the TimeZoneService from @/utils/timezone instead
 * This file contains timezone-specific utilities that are used across the application
 * but should be replaced with the standardized TimeZoneService.
 */

import { TimeZoneService } from '@/utils/timezone';

/**
 * Format a date and time in a specific timezone with timezone indicator
 * @param date The date string or Date object
 * @param time The time string (HH:MM format)
 * @param timeZone The timezone string
 * @param includeTimeZone Whether to include timezone in output
 * @returns Formatted date and time with timezone indicator
 */
/**
 * Format a date and time in a specific timezone with timezone indicator
 * @deprecated Use TimeZoneService.formatDateTime with appropriate format instead
 */
export const formatDateTimeWithTimeZone = (
  date: string | Date,
  time: string,
  timeZone: string,
  includeTimeZone: boolean = true
): string => {
  try {
    const ianaTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    
    // Create a combined date+time string
    const dateTimeStr = `${typeof date === 'string' ? date : date.toISOString().split('T')[0]}T${time}`;
    
    // Format the time
    const formattedTime = TimeZoneService.formatTime(dateTimeStr, 'h:mm a', ianaTimeZone);
    
    if (!includeTimeZone) {
      return formattedTime;
    }
    
    // Get timezone display
    const timeZoneDisplay = TimeZoneService.formatTimeZoneDisplay(ianaTimeZone);
    return `${formattedTime} (${timeZoneDisplay})`;
  } catch (error) {
    console.error('Error formatting with timezone:', error, { date, time, timeZone });
    return time;
  }
};

/**
 * Generate a formatted time zone display name
 * @param timeZone IANA time zone identifier or display name
 * @returns User-friendly time zone display
 */
/**
 * Generate a formatted time zone display name
 * @deprecated Use TimeZoneService.formatTimeZoneDisplay instead
 */
export const formatTimeZoneDisplay = (timeZone: string): string => {
  return TimeZoneService.formatTimeZoneDisplay(timeZone);
};

/**
 * Get timezone offset string (e.g., GMT+2)
 * @param timeZone IANA timezone identifier
 * @returns Formatted timezone offset string
 */
/**
 * Get timezone offset string (e.g., GMT+2)
 * @deprecated Use TimeZoneService.getTimezoneOffsetString instead
 */
export const getTimezoneOffsetString = (timeZone: string): string => {
  return TimeZoneService.getTimezoneOffsetString(timeZone);
};
