
// Helper functions for handling time zones

/**
 * Gets the user's local time zone
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'America/New_York'; // Default fallback
  }
}

/**
 * Formats a time zone string for display
 */
export function formatTimeZoneDisplay(timeZone: string): string {
  try {
    // Simple formatting - just extract the city name
    const parts = timeZone.split('/');
    return parts[parts.length - 1].replace('_', ' ');
  } catch (error) {
    return timeZone;
  }
}

/**
 * Ensures we have a valid IANA time zone string
 */
export function ensureIANATimeZone(timeZone: string): string {
  // List of common time zone names to IANA mappings
  const timeZoneMap: Record<string, string> = {
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'Eastern Time': 'America/New_York',
    'Central Time': 'America/Chicago',
    'Mountain Time': 'America/Denver',
    'Pacific Time': 'America/Los_Angeles',
    'Eastern Standard Time': 'America/New_York',
    'Central Standard Time': 'America/Chicago',
    'Mountain Standard Time': 'America/Denver',
    'Pacific Standard Time': 'America/Los_Angeles',
  };

  if (!timeZone) return getUserTimeZone();
  
  // Check if we need to map the time zone
  if (timeZoneMap[timeZone]) {
    return timeZoneMap[timeZone];
  }
  
  // If it looks like an IANA time zone, return it
  if (timeZone.includes('/')) {
    return timeZone;
  }
  
  // Default fallback
  return getUserTimeZone();
}

/**
 * Formats a time string in the user's time zone
 */
export function formatTimeInUserTimeZone(
  timeStr: string,
  timeZone: string,
  formatPattern: string = 'h:mm a'
): string {
  try {
    // Simple formatting for HH:MM time string
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr || 'Time unavailable';
  }
}

/**
 * Formats a time string to 12-hour format
 */
export function formatTime12Hour(timeStr: string): string | null {
  if (!timeStr) return null;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr;
  }
}
