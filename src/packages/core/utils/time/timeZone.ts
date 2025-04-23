
import { format } from 'date-fns';

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
  if (timeZone && timeZone.includes('/')) {
    return timeZone;
  }
  
  if (timeZone && TIME_ZONE_MAP[timeZone]) {
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
 * Format time for display with time zone indicator
 */
export const formatTimeWithTimeZone = (
  time: string,
  timeZone: string,
  includeTimeZone: boolean = true
): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    if (!includeTimeZone) return timeStr;
    
    const timeZoneName = timeZone.split('/').pop()?.replace('_', ' ') || timeZone;
    return `${timeStr} (${timeZoneName})`;
  } catch (error) {
    console.error('Error formatting time with timezone:', error);
    return time;
  }
};
