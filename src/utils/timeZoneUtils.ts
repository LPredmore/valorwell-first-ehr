
import { DateTime } from 'luxon';
import { TimeZoneService } from './timeZoneService';

/**
 * @deprecated Use TimeZoneService.ensureIANATimeZone instead
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  return TimeZoneService.ensureIANATimeZone(timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTimeZoneDisplay instead 
 */
export const formatTimeZoneDisplay = (timezone: string): string => {
  return TimeZoneService.formatTimeZoneDisplay(timezone);
};

/**
 * Get user timezone or fallback to browser timezone
 */
export const getUserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone, falling back to America/Chicago:', error);
    return 'America/Chicago';
  }
};

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTimeInUserTimeZone = (
  time: string,
  timezone: string,
  format: string = 'h:mm a'
): string => {
  return TimeZoneService.formatTime(time, format, timezone);
};

/**
 * @deprecated Use TimeZoneService.formatTime instead with no timezone parameter
 */
export const formatTime12Hour = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

/**
 * @deprecated Use TimeZoneService.convertDateTime instead
 */
export const convertDateTimeBetweenTimeZones = (
  dateTime: string | Date,
  sourceTimeZone: string,
  targetTimeZone: string
): DateTime => {
  return TimeZoneService.convertDateTime(dateTime, sourceTimeZone, targetTimeZone);
};
