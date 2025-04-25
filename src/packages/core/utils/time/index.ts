
/**
 * THIS FILE IS BEING DEPRECATED
 * All timezone functionality should use TimeZoneService from @/utils/timeZoneService directly
 * This file now re-exports functionality from TimeZoneService for backward compatibility
 * New code should import directly from @/utils/timeZoneService
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
  toISOWithZone,
  parseWithZone,
  formatDateToTime12Hour,
  getCurrentDateTime,
  isSameDay,
  addDuration,
  getWeekdayName,
  getMonthName,
  formatDate
} = TimeZoneService;

// Add deprecated warning to old imports
// These will be gradually removed in future updates
// @deprecated - Use TimeZoneService directly
export * from './timeZone';
// @deprecated - Use TimeZoneService directly
export {
  createDateTime as createDateTimeLegacy,
  convertToTimezone as convertToTimezoneLegacy,
  formatDateTime as formatDateTimeLegacy,
  fromUTCToTimezone as fromUTCToTimezoneLegacy
} from './luxon';
// @deprecated - Use TimeZoneService directly
export {
  formatEventTime as formatEventTimeLegacy,
  convertEventToUserTimeZone as convertEventToUserTimeZoneLegacy
} from './calendar';
// @deprecated - Use TimeZoneService directly
export {
  formatTimeZoneDisplay as formatTimeZoneDisplayLegacy
} from './formatting';
// @deprecated - Use TimeZoneService directly
export * from './validation';
// @deprecated - Use TimeZoneService directly
export * from './conversion';
