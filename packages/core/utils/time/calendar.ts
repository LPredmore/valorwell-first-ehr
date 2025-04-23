
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';
import { fromUTCToTimezone } from './luxon';

export interface CalendarEventBase {
  id?: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  extendedProps?: {
    eventType?: string;
    description?: string;
    [key: string]: any;
  };
}

/**
 * Format event time for display with time zone indicator
 */
export const formatEventTime = (event: CalendarEventBase, userTimeZone: string): string => {
  const ianaZone = ensureIANATimeZone(userTimeZone);
  
  const startDateTime = typeof event.start === 'string' 
    ? DateTime.fromISO(event.start)
    : DateTime.fromJSDate(event.start);
    
  const endDateTime = typeof event.end === 'string'
    ? DateTime.fromISO(event.end)
    : DateTime.fromJSDate(event.end);
    
  const startInZone = startDateTime.setZone(ianaZone);
  const endInZone = endDateTime.setZone(ianaZone);
  
  return `${startInZone.toFormat('h:mm a')} - ${endInZone.toFormat('h:mm a')}`;
};

/**
 * Convert UTC date/time to user's timezone
 */
export const convertEventToUserTimeZone = (event: CalendarEventBase, userTimeZone: string): CalendarEventBase => {
  if (!event.start || !event.end) return event;
  
  const startInZone = fromUTCToTimezone(event.start.toString(), userTimeZone);
  const endInZone = fromUTCToTimezone(event.end.toString(), userTimeZone);
  
  return {
    ...event,
    start: startInZone.toJSDate(),
    end: endInZone.toJSDate(),
  };
};
