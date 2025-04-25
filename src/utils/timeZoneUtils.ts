
import { DateTime } from 'luxon';

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
 * @param timeZone Timezone string that might be in various formats
 * @returns IANA format timezone string
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  if (!timeZone) {
    console.log('No timezone provided, using system default');
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  if (timeZone.includes('/')) {
    return timeZone;
  }
  
  if (TIME_ZONE_MAP[timeZone]) {
    return TIME_ZONE_MAP[timeZone];
  }
  
  try {
    console.log(`Unable to map timezone "${timeZone}" to IANA format, using system default`);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting system timezone, using America/Chicago as fallback:', error);
    return 'America/Chicago';
  }
};

/**
 * Format timezone for display
 * @param timezone IANA timezone string
 * @returns User-friendly display name
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
    
    // Get timezone abbreviation
    const now = DateTime.now().setZone(ianaZone);
    return `${now.offsetNameShort}`;
  } catch (error) {
    console.error('Error formatting timezone display:', error);
    return timezone || '';
  }
};

/**
 * Check if a timezone string is valid
 * @param timezone Timezone string to check
 * @returns Boolean indicating if timezone is valid
 */
export const isValidTimeZone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get current offset for a timezone (in hours)
 * @param timezone IANA timezone string
 * @returns Offset in hours (e.g., -5, 2)
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const ianaZone = ensureIANATimeZone(timezone);
    const now = DateTime.now().setZone(ianaZone);
    return now.offset / 60;
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
};
