import { DateTime, Duration } from 'luxon';

/**
 * Map of common timezone display names to IANA format
 */
const TIME_ZONE_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time (AKT)': 'America/Anchorage',
  'Hawaii-Aleutian Time (HST)': 'Pacific/Honolulu',
  'Atlantic Time (AST)': 'America/Puerto_Rico'
};

/**
 * Ensure timezone is in IANA format
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  if (!timeZone) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  if (timeZone.includes('/')) {
    return timeZone;
  }
  
  if (TIME_ZONE_MAP[timeZone]) {
    return TIME_ZONE_MAP[timeZone];
  }
  
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format timezone for display
 */
export const formatTimeZoneDisplay = (timezone: string): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  
  try {
    if (timezone.includes('(') && timezone.includes(')')) {
      return timezone.split('(')[0].trim();
    }
    
    if (timezone.includes('/')) {
      const location = timezone.split('/').pop() || timezone;
      return location.replace(/_/g, ' ');
    }
    
    const now = DateTime.now().setZone(ianaZone);
    return `${now.offsetNameShort}`;
  } catch (error) {
    console.error('Error formatting timezone display:', error);
    return timezone || '';
  }
};

/**
 * Format time in 12-hour format
 */
export const formatTime12Hour = (time: string): string => {
  try {
    if (!time) return '';
    
    const dt = DateTime.fromISO(`2000-01-01T${time}`);
    return dt.toFormat('h:mm a');
  } catch (error) {
    console.error('Error formatting 12-hour time:', error);
    return time;
  }
};

/**
 * Format time in user's timezone
 */
export const formatTimeInUserTimeZone = (
  time: string,
  timezone: string,
  format: string = 'h:mm a'
): string => {
  try {
    const ianaZone = ensureIANATimeZone(timezone);
    const dt = DateTime.fromISO(`2000-01-01T${time}`).setZone(ianaZone);
    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formatting user timezone:', error);
    return formatTime12Hour(time);
  }
};

/**
 * Convert date and time to UTC timestamp
 */
export const toUTCTimestamp = (
  date: string | Date,
  time: string,
  timezone: string
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  const dt = DateTime.fromISO(`${dateStr}T${time}`, { zone: ianaZone });
  return dt.toUTC().toISO();
};

/**
 * Convert UTC timestamp to local date/time
 */
export const fromUTCTimestamp = (
  timestamp: string,
  timezone: string
): Date => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.fromISO(timestamp).setZone(ianaZone).toJSDate();
};

/**
 * Get user's timezone
 */
export const getUserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'America/Chicago';
  }
};

/**
 * Format UTC time for user display
 */
export const formatUTCTimeForUser = (
  timestamp: string,
  timezone: string,
  format: string = 'h:mm a'
): string => {
  try {
    const ianaZone = ensureIANATimeZone(timezone);
    return DateTime.fromISO(timestamp).setZone(ianaZone).toFormat(format);
  } catch (error) {
    console.error('Error formatting UTC time for user:', error);
    return '';
  }
};

/**
 * Convert local time to UTC
 */
export const toUTC = (
  dateTime: string | Date,
  timezone: string
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dt = typeof dateTime === 'string' 
    ? DateTime.fromISO(dateTime, { zone: ianaZone })
    : DateTime.fromJSDate(dateTime, { zone: ianaZone });
  return dt.toUTC().toISO();
};

/**
 * Convert UTC to local time
 */
export const fromUTC = (
  utcDateTime: string,
  timezone: string
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.fromISO(utcDateTime).setZone(ianaZone).toISO();
};

/**
 * Format date to time in 12-hour format
 */
export const formatDateToTime12Hour = (date: Date): string => {
  return DateTime.fromJSDate(date).toFormat('h:mm a');
};

/**
 * Format with timezone
 */
export const formatWithTimeZone = (
  date: string | Date,
  timezone: string,
  format: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dt = typeof date === 'string'
    ? DateTime.fromISO(date, { zone: ianaZone })
    : DateTime.fromJSDate(date, { zone: ianaZone });
  return dt.toFormat(format);
};

/**
 * Create ISO datetime string
 */
export const createISODateTimeString = (
  date: string | Date,
  time: string,
  timezone: string
): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return DateTime.fromISO(`${dateStr}T${time}`, { zone: ianaZone }).toISO();
};
