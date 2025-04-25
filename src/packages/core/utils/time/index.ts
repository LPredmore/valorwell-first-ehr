
export * from './timeZone';
export {
  createDateTime,
  convertToTimezone,
  fromUTCToTimezone
} from './luxon';
export {
  formatEventTime,
  convertEventToUserTimeZone
} from './calendar';
export {
  formatTimeZoneDisplay
} from './formatting';
export * from './validation';
export * from './conversion';

// Export the standardized utilities using TimeZoneService's static methods
export const getWeekdayName = (date: any) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.getWeekdayName(date));
export const formatDate = (date: any, format?: string, timeZone?: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.formatDate(date, format, timeZone));
// Renamed to avoid conflict with the imported formatDateTime
export const formatDateTimeWithService = (date: any, format?: string, timeZone?: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.formatDateTime(date, format, timeZone));
export const formatTime = (time: string, format?: string, timeZone?: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.formatTime(time, format, timeZone));
export const formatInTimezone = (date: any, format: string, timeZone: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.formatInTimezone(date, format, timeZone));
export const getMonthName = (date: any) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.getMonthName(date));
export const getCurrentDateTime = (timeZone: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.getCurrentDateTime(timeZone));
export const isSameDay = (date1: any, date2: any) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.isSameDay(date1, date2));
export const addDuration = (date: any, amount: number, unit: any, timeZone?: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.addDuration(date, amount, unit, timeZone));
export const toISOWithZone = (date: any, timezone?: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.toISOWithZone(date, timezone));
export const parseWithZone = (dateString: string, timezone: string) => import('@/utils/timeZoneService').then(m => m.TimeZoneService.parseWithZone(dateString, timezone));
