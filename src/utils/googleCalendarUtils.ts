import { ICalendarEvent, CalendarEvent, CalendarEventType } from '@/types/calendar';

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

// Update Google Calendar API configuration
export const GOOGLE_API_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  scope: GOOGLE_SCOPES.join(' '),
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

// Google Calendar event interfaces matching the API response
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

// Convert our calendar event to Google Calendar event format
export function convertToGoogleEvent(event: ICalendarEvent, userTimeZone: string): { start: TimeCalendarType; end: TimeCalendarType; [key: string]: any } {
  const isAllDay = event.allDay;

  // Compose the base Google event format
  const googleEvent: any = {
    summary: event.title,
    description: event.description || '',
    extendedProperties: {
      private: {
        eventType: event.eventType,
        clinicianId: event.clinicianId,
        localEventId: event.id
      }
    }
  };

  if (isAllDay) {
    const startDate = event.startTime.split('T')[0];
    const endDate = event.endTime.split('T')[0];
    googleEvent.start = { date: startDate, timeZone: userTimeZone };
    googleEvent.end = { date: endDate, timeZone: userTimeZone };
  } else {
    googleEvent.start = {
      dateTime: event.startTime,
      timeZone: userTimeZone
    };
    googleEvent.end = {
      dateTime: event.endTime,
      timeZone: userTimeZone
    };
  }

  if (event.recurrenceRule && event.recurrenceRule.rrule) {
    googleEvent.recurrence = [event.recurrenceRule.rrule];
  }

  return googleEvent;
}

// Convert Google Calendar event to our event format
export function convertFromGoogleEvent(
  googleEvent: GoogleCalendarEvent,
  clinicianId: string,
  userTimeZone: string
): ICalendarEvent {
  // Check if this is an all day event (date exists)
  const startHasDate = 'date' in googleEvent.start;
  const endHasDate = 'date' in googleEvent.end;
  const isAllDay = !!(startHasDate || endHasDate);

  // Determine event type
  const eventType: CalendarEventType = (googleEvent.extendedProperties?.private?.eventType as CalendarEventType) || 'appointment';

  // Extract start and end times
  let startTime: string;
  let endTime: string;

  if (isAllDay) {
    // Use fallback time strings to ensure valid ISO datetimes
    startTime = `${startHasDate ? (googleEvent.start as {date: string}).date : ''}T00:00:00`;
    endTime = `${endHasDate ? (googleEvent.end as {date: string}).date : ''}T23:59:59`;
  } else {
    // Use dateTime fields
    startTime = (googleEvent.start as {dateTime: string}).dateTime;
    endTime = (googleEvent.end as {dateTime: string}).dateTime;
  }
  
  // Compose our internal event
  const localEvent: ICalendarEvent = {
    id: googleEvent.extendedProperties?.private?.localEventId || `google-${googleEvent.id}`,
    clinicianId: googleEvent.extendedProperties?.private?.clinicianId || clinicianId,
    title: googleEvent.summary,
    description: googleEvent.description,
    startTime,
    endTime,
    allDay: isAllDay,
    eventType,
  };

  if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
    localEvent.recurrenceRule = {
      id: `google-recur-${googleEvent.id}`,
      eventId: localEvent.id,
      rrule: googleEvent.recurrence[0]
    };
  }

  if (googleEvent.recurringEventId) {
    localEvent.recurrenceId = `google-${googleEvent.recurringEventId}`;
  }

  return localEvent;
}

// Helper to determine if an event has been synced with Google Calendar
export function isGoogleSyncedEvent(event: CalendarEvent): boolean {
  return !!(
    event.id?.toString().startsWith('google-') ||
    event.extendedProps?.googleEventId
  );
}

// Format an event's times for display
export function formatEventTime(event: CalendarEvent | ICalendarEvent): string {
  let startTime: string;
  let endTime: string;
  if ('start' in event && event.start) {
    // FullCalendar event
    if (typeof event.start === 'string') {
      startTime = event.start;
    } else if (event.start instanceof Date) {
      startTime = event.start.toISOString();
    } else {
      startTime = '';
    }
  } else if ('startTime' in event && event.startTime) {
    startTime = event.startTime;
  } else {
    startTime = '';
  }
  if ('end' in event && event.end) {
    if (typeof event.end === 'string') {
      endTime = event.end;
    } else if (event.end instanceof Date) {
      endTime = event.end.toISOString();
    } else {
      endTime = '';
    }
  } else if ('endTime' in event && event.endTime) {
    endTime = event.endTime;
  } else {
    endTime = '';
  }
  return `${startTime.split('T')[1]?.substring(0, 5) ?? ''} - ${endTime.split('T')[1]?.substring(0, 5) ?? ''}`;
}
