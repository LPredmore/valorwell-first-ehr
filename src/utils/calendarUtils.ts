
import { CalendarEvent } from '@/types/calendar';
import { DateTime } from 'luxon';
import { parseISO } from 'date-fns';

export const formatEventTimeToUserTimeZone = (event: CalendarEvent, userTimeZone: string): CalendarEvent => {
  if (!event.start || !event.end) return event;

  const startDt = DateTime.fromISO(event.start.toString(), { zone: 'UTC' });
  const endDt = DateTime.fromISO(event.end.toString(), { zone: 'UTC' });

  return {
    ...event,
    start: startDt.setZone(userTimeZone).toISO(),
    end: endDt.setZone(userTimeZone).toISO(),
  };
};

export const convertTimeToUserTimeZone = (time: string, fromTimeZone: string, toTimeZone: string): string => {
  const dt = DateTime.fromISO(time, { zone: fromTimeZone });
  return dt.setZone(toTimeZone).toFormat('HH:mm:ss');
};

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch (e) {
    return false;
  }
};
