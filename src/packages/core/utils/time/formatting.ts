
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';

export const formatDateTime = (
  dateTime: DateTime,
  formatStr: string = "h:mm a"
): string => {
  return dateTime.toFormat(formatStr);
};

export const formatEventTime = (startDateTime: DateTime, endDateTime: DateTime): string => {
  return `${startDateTime.toFormat('h:mm a')} - ${endDateTime.toFormat('h:mm a')}`;
};

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
    
    return timezone;
  } catch (error) {
    console.error('Error formatting time zone display:', error, timezone);
    return timezone || '';
  }
};
