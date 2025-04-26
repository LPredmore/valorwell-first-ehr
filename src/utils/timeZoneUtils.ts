
/**
 * @deprecated This file is maintained for backward compatibility
 * New code should use TimeZoneService methods directly from "@/utils/timeZoneService"
 */

import { TimeZoneService } from './timeZoneService';

console.warn(
  'You are importing from timeZoneUtils.ts, which is deprecated. ' +
  'Please import directly from TimeZoneService instead. ' +
  'These re-exports will be removed in a future update.'
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
  parseWithZone
} = TimeZoneService;

/**
 * Get user timezone or fallback to browser timezone
 * @deprecated Use TimeZoneService or the useTimeZone hook
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
