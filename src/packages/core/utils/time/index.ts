
/**
 * THIS FILE IS BEING DEPRECATED
 * All timezone functionality should use TimeZoneService from @/utils/timeZoneService directly
 * This file now re-exports functionality from TimeZoneService for backward compatibility
 */

// Import TimeZoneService from the correct path
import { TimeZoneService } from '../../../../utils/timeZoneService';

// Re-export utility functions from TimeZoneService
export const {
  ensureIANATimeZone,
  formatTime,
  formatDateTime,
  formatTimeZoneDisplay,
  convertEventToUserTimeZone,
  createDateTime,
  convertDateTime,
  fromUTC,
  toUTC,
  parseWithZone,
  formatDateToTime12Hour,
  getCurrentDateTime,
  isSameDay,
  addDuration,
  getWeekdayName,
  getMonthName,
  formatDate,
  getUserTimeZone,
  getDisplayNameFromIANA,
  getIANAFromDisplayName,
  getTimezoneOffsetString
} = TimeZoneService;

// Add deprecated warning to old imports
console.warn(
  'You are importing from packages/core/utils/time/index.ts, which is deprecated. ' +
  'Please import from @/utils/timeZoneService directly. ' +
  'These re-exports will be removed in a future update.'
);
