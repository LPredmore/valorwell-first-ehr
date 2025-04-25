
/**
 * @deprecated This file provides backward compatibility for old timezone utilities
 * New code should use TimeZoneService methods directly
 */

import { TimeZoneService } from './timeZoneService';
import { DateTime } from 'luxon';

/**
 * @deprecated Use TimeZoneService.ensureIANATimeZone instead
 */
export const ensureIANATimeZone = TimeZoneService.ensureIANATimeZone;

/**
 * @deprecated Use TimeZoneService.formatTimeZoneDisplay instead
 */
export const formatTimeZoneDisplay = TimeZoneService.formatTimeZoneDisplay;

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTimeInUserTimeZone = (time: string, format: string = 'h:mm a'): string => {
  return TimeZoneService.formatTime(time, format);
};

/**
 * @deprecated Use TimeZoneService.toUTCTimestamp instead
 */
export const toUTCTimestamp = TimeZoneService.toUTCTimestamp;

/**
 * @deprecated Use TimeZoneService.fromUTCTimestamp instead
 */
export const fromUTCTimestamp = TimeZoneService.fromUTCTimestamp;

/**
 * @deprecated Use TimeZoneService.formatTimeForUser instead
 */
export const formatUTCTimeForUser = TimeZoneService.formatTimeForUser;

/**
 * @deprecated Use TimeZoneService.convertDateTime instead
 */
export const convertDateTimeBetweenTimeZones = TimeZoneService.convertDateTime;

/**
 * @deprecated Use TimeZoneService.createISODateTimeString instead
 */
export const createISODateTimeString = TimeZoneService.createISODateTimeString;

/**
 * @deprecated Use TimeZoneService.formatWithTimeZone instead
 */
export const formatWithTimeZone = TimeZoneService.formatWithTimeZone;

/**
 * @deprecated Use TimeZoneService.formatDateToTime12Hour instead
 */
export const formatDateToTime12Hour = TimeZoneService.formatDateToTime12Hour;

/**
 * @deprecated Use TimeZoneService.toUTC instead
 */
export const toUTC = TimeZoneService.toUTC;

/**
 * @deprecated Use TimeZoneService.fromUTC instead
 */
export const fromUTC = TimeZoneService.fromUTC;

/**
 * @deprecated Use TimeZoneService or browser's built-in Intl.DateTimeFormat().resolvedOptions().timeZone
 */
export const getUserTimeZone = (): string => {
  try {
    return TimeZoneService.ensureIANATimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  } catch (error) {
    console.error('Error getting user timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTime12Hour = (time: string): string => {
  try {
    return TimeZoneService.formatTime(time, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

/**
 * Log warning about using deprecated timezone utilities
 */
console.warn(
  'You are using deprecated timezone utilities from timeZoneDeprecated.ts. ' +
  'Please migrate to using TimeZoneService methods directly. ' +
  'These utilities will be removed in a future update.'
);
