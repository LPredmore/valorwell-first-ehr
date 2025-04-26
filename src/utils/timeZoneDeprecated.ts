
/**
 * @deprecated This file provides backward compatibility for old timezone utilities
 * New code should use TimeZoneService methods directly
 */

import { TimeZoneService } from './timeZoneService';

console.warn(
  'You are using deprecated timezone utilities from timeZoneDeprecated.ts. ' +
  'Please migrate to using TimeZoneService methods directly. ' +
  'These utilities will be removed in a future update.'
);

// Re-export TimeZoneService functions to maintain backward compatibility
export const {
  ensureIANATimeZone,
  formatTimeZoneDisplay,
  formatTime: formatTimeInUserTimeZone,
  toUTCTimestamp,
  fromUTCTimestamp,
  formatTimeForUser: formatUTCTimeForUser,
  convertDateTime: convertDateTimeBetweenTimeZones,
  createISODateTimeString,
  formatWithTimeZone,
  formatDateToTime12Hour,
  toUTC,
  fromUTC,
  getUserTimeZone,
  getDisplayNameFromIANA,
  getIANAFromDisplayName,
  getTimezoneOffsetString
} = TimeZoneService;

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTime12Hour = (time: string): string => {
  return TimeZoneService.formatTime(time, 'h:mm a');
};
