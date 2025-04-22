
import { CalendarEvent, CalendarEventType } from '@/types/calendar';

// Update TimeCalendarType to make timeZone required when using dateTime
export type TimeCalendarType = {
  date?: string;
  dateTime?: string;
  timeZone: string;
};

// Update Google Calendar API scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Get environment variables for Google Calendar API
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Log for debugging
console.log('Google Client ID available:', !!GOOGLE_CLIENT_ID);

export const GOOGLE_API_CONFIG = {
  clientId: GOOGLE_CLIENT_ID || '',
  apiKey: GOOGLE_API_KEY || '',
  scope: GOOGLE_SCOPES.join(' '),
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: TimeCalendarType;
  end: TimeCalendarType;
  recurrence?: string[];
  recurringEventId?: string;
  status: string;
  extendedProperties?: {
    private?: {
      eventType?: string;
      clinicianId?: string;
      localEventId?: string;
    };
  };
}

export function convertToGoogleEvent(event: CalendarEvent, userTimeZone: string): { start: TimeCalendarType; end: TimeCalendarType; [key: string]: any } {
  const isAllDay = event.allDay;
  const startTime = event.start?.toString() || '';
  const endTime = event.end?.toString() || '';

  const googleEvent: any = {
    summary: event.title,
    description: event.extendedProps?.description || '',
    extendedProperties: {
      private: {
        eventType: event.extendedProps?.eventType,
        clinicianId: event.extendedProps?.appointment?.clinician_id,
        localEventId: event.id
      }
    }
  };

  if (isAllDay) {
    const startDate = startTime.split('T')[0];
    const endDate = endTime.split('T')[0];
    googleEvent.start = { date: startDate, timeZone: userTimeZone };
    googleEvent.end = { date: endDate, timeZone: userTimeZone };
  } else {
    googleEvent.start = {
      dateTime: startTime,
      timeZone: userTimeZone
    };
    googleEvent.end = {
      dateTime: endTime,
      timeZone: userTimeZone
    };
  }

  return googleEvent;
}

export function convertFromGoogleEvent(
  googleEvent: GoogleCalendarEvent,
  clinicianId: string,
  userTimeZone: string
): CalendarEvent {
  const startHasDate = 'date' in googleEvent.start;
  const endHasDate = 'date' in googleEvent.end;
  const isAllDay = !!(startHasDate || endHasDate);
  const eventType = (googleEvent.extendedProperties?.private?.eventType as CalendarEventType) || 'appointment';

  let startTime: string;
  let endTime: string;

  if (isAllDay) {
    startTime = `${startHasDate ? (googleEvent.start as {date: string}).date : ''}T00:00:00`;
    endTime = `${endHasDate ? (googleEvent.end as {date: string}).date : ''}T23:59:59`;
  } else {
    startTime = (googleEvent.start as {dateTime: string}).dateTime;
    endTime = (googleEvent.end as {dateTime: string}).dateTime;
  }

  return {
    id: googleEvent.extendedProperties?.private?.localEventId || `google-${googleEvent.id}`,
    title: googleEvent.summary,
    start: startTime,
    end: endTime,
    allDay: isAllDay,
    extendedProps: {
      eventType,
      description: googleEvent.description,
      googleEventId: googleEvent.id
    }
  };
}

export function isGoogleSyncedEvent(event: CalendarEvent): boolean {
  return !!(
    event.id?.toString().startsWith('google-') ||
    event.extendedProps?.googleEventId
  );
}

export function formatEventTime(event: CalendarEvent): string {
  const startTime = typeof event.start === 'string' ? event.start :
                   event.start instanceof Date ? event.start.toISOString() : '';
  const endTime = typeof event.end === 'string' ? event.end :
                 event.end instanceof Date ? event.end.toISOString() : '';
                 
  return `${startTime.split('T')[1]?.substring(0, 5) ?? ''} - ${endTime.split('T')[1]?.substring(0, 5) ?? ''}`;
}
