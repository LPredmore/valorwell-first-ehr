
/**
 * @deprecated This file provides backward compatibility for old timezone utilities
 * New code should use TimeZoneService methods directly
 * 
 * THIS FILE IS SCHEDULED FOR REMOVAL AFTER MIGRATION IS COMPLETE
 */

import { TimeZoneService } from './timeZoneService';

/**
 * @deprecated Import TimeZoneService directly
 */
console.warn(
  '[TIMEZONE MIGRATION] You are using deprecated timezone utilities from timeZoneDeprecated.ts. ' +
  'Please migrate to using TimeZoneService methods directly from @/utils/timeZoneService. ' +
  'This file will be removed after migration is complete.'
);

/**
 * @deprecated Use TimeZoneService.ensureIANATimeZone
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] ensureIANATimeZone is deprecated, use TimeZoneService.ensureIANATimeZone instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.ensureIANATimeZone(timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTimeZoneDisplay
 */
export const formatTimeZoneDisplay = (timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatTimeZoneDisplay is deprecated, use TimeZoneService.formatTimeZoneDisplay instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatTimeZoneDisplay(timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTime
 */
export const formatTimeInUserTimeZone = (time: string, timeZone: string, format = 'h:mm a'): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatTimeInUserTimeZone is deprecated, use TimeZoneService.formatTime instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatTime(time, format, timeZone);
};

/**
 * @deprecated Use TimeZoneService.toUTC
 */
export const toUTCTimestamp = (date: Date | string, time: string, timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] toUTCTimestamp is deprecated, use TimeZoneService.toUTC instead' + 
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.toUTCTimestamp(date, time, timeZone);
};

/**
 * @deprecated Use TimeZoneService.fromUTC
 */
export const fromUTCTimestamp = (timestamp: string, timeZone: string): any => {
  console.warn(
    '[TIMEZONE MIGRATION] fromUTCTimestamp is deprecated, use TimeZoneService.fromUTC instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.fromUTCTimestamp(timestamp, timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTimeForUser
 */
export const formatUTCTimeForUser = (time: string, timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatUTCTimeForUser is deprecated, use TimeZoneService.formatTimeForUser instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatTimeForUser(time, timeZone);
};

/**
 * @deprecated Use TimeZoneService.convertDateTime
 */
export const convertDateTime = (dateTime: string | Date, fromTimeZone: string, toTimeZone: string): any => {
  console.warn(
    '[TIMEZONE MIGRATION] convertDateTime is deprecated, use TimeZoneService.convertDateTime instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.convertDateTime(dateTime, fromTimeZone, toTimeZone);
};

/**
 * @deprecated Use TimeZoneService.createISODateTimeString
 */
export const createISODateTimeString = (date: Date | string, time: string, timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] createISODateTimeString is deprecated, use TimeZoneService.createISODateTimeString instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.createISODateTimeString(date, time, timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatWithTimeZone
 */
export const formatWithTimeZone = (date: Date | string, format: string, timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatWithTimeZone is deprecated, use TimeZoneService.formatWithTimeZone instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatWithTimeZone(date, format, timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatDateToTime12Hour = (time: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatDateToTime12Hour is deprecated, use TimeZoneService.formatTime instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatDateToTime12Hour(time);
};

/**
 * @deprecated Use TimeZoneService.toUTC
 */
export const toUTC = (localDateTime: any): any => {
  console.warn(
    '[TIMEZONE MIGRATION] toUTC is deprecated, use TimeZoneService.toUTC instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.toUTC(localDateTime);
};

/**
 * @deprecated Use TimeZoneService.fromUTC
 */
export const fromUTC = (utcStr: string, timeZone: string): any => {
  console.warn(
    '[TIMEZONE MIGRATION] fromUTC is deprecated, use TimeZoneService.fromUTC instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.fromUTC(utcStr, timeZone);
};

/**
 * @deprecated Use TimeZoneService.parseWithZone
 */
export const parseWithZone = (dateStr: string, timeZone: string): any => {
  console.warn(
    '[TIMEZONE MIGRATION] parseWithZone is deprecated, use TimeZoneService.parseWithZone instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.parseWithZone(dateStr, timeZone);
};

/**
 * @deprecated Use TimeZoneService.getUserTimeZone or useTimeZone hook from TimeZoneContext
 */
export const getUserTimeZone = (): string => {
  console.warn(
    '[TIMEZONE MIGRATION] getUserTimeZone is deprecated, use TimeZoneService.getUserTimeZone or useTimeZone hook from TimeZoneContext instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.getUserTimeZone();
};

/**
 * @deprecated Use TimeZoneService.getDisplayNameFromIANA
 */
export const getDisplayNameFromIANA = (ianaTimeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] getDisplayNameFromIANA is deprecated, use TimeZoneService.getDisplayNameFromIANA instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.getDisplayNameFromIANA(ianaTimeZone);
};

/**
 * @deprecated Use TimeZoneService.getIANAFromDisplayName
 */
export const getIANAFromDisplayName = (displayName: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] getIANAFromDisplayName is deprecated, use TimeZoneService.getIANAFromDisplayName instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.getIANAFromDisplayName(displayName);
};

/**
 * @deprecated Use TimeZoneService.getTimezoneOffsetString
 */
export const getTimezoneOffsetString = (timeZone: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] getTimezoneOffsetString is deprecated, use TimeZoneService.getTimezoneOffsetString instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.getTimezoneOffsetString(timeZone);
};

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTime12Hour = (time: string): string => {
  console.warn(
    '[TIMEZONE MIGRATION] formatTime12Hour is deprecated, use TimeZoneService.formatTime instead' +
    `\n  at ${new Error().stack?.split('\n')[2]?.trim()}`
  );
  return TimeZoneService.formatTime(time, 'h:mm a');
};
