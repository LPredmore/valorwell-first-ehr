
import { ICalendarEvent, CalendarEvent, CalendarEventType } from '@/types/calendar';

// Google Calendar API scopes required for our application
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Google Calendar API configuration
export const GOOGLE_API_CONFIG = {
  clientId: '', // Will be set from environment variable
  apiKey: '', // Will be set from environment variable
  scope: GOOGLE_SCOPES.join(' '),
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

// Google Calendar event interfaces matching the API response
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string } | { date: string };
  end: { dateTime: string; timeZone: string } | { date: string };
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
export function convertToGoogleEvent(event: ICalendarEvent, userTimeZone: string): Partial<GoogleCalendarEvent> {
  // Determine if the event is all day
  const isAllDay = event.allDay;
  
  // Create the Google Calendar event object
  const googleEvent: Partial<GoogleCalendarEvent> = {
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

  // Set start and end times based on all-day status
  if (isAllDay) {
    // For all-day events, use date format
    const startDate = event.startTime.split('T')[0];
    const endDate = event.endTime.split('T')[0];
    
    googleEvent.start = { date: startDate };
    googleEvent.end = { date: endDate };
  } else {
    // For time-specific events, use dateTime format
    googleEvent.start = {
      dateTime: event.startTime,
      timeZone: userTimeZone
    };
    googleEvent.end = {
      dateTime: event.endTime,
      timeZone: userTimeZone
    };
  }

  // Handle recurrence if available
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
  // Check if this is an all day event
  const isAllDay = !!(googleEvent.start.date || googleEvent.end.date);
  
  // Determine the event type based on extended properties or default to 'appointment'
  const eventType: CalendarEventType = (googleEvent.extendedProperties?.private?.eventType as CalendarEventType) || 'appointment';
  
  // Extract start and end times
  let startTime: string;
  let endTime: string;
  
  if (isAllDay) {
    startTime = `${googleEvent.start.date}T00:00:00`;
    endTime = `${googleEvent.end.date}T23:59:59`;
  } else {
    // Using dateTime for time-specific events
    startTime = googleEvent.start.dateTime!;
    endTime = googleEvent.end.dateTime!;
  }
  
  // Create our calendar event
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
  
  // Handle recurrence if available
  if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
    localEvent.recurrenceRule = {
      id: `google-recur-${googleEvent.id}`,
      eventId: localEvent.id,
      rrule: googleEvent.recurrence[0]
    };
  }
  
  // If this is an instance of a recurring event
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
  const startTime = typeof event.start === 'string' ? 
    event.start : 
    typeof event.startTime === 'string' ? 
      event.startTime : 
      (event.start as Date).toISOString();
  
  const endTime = typeof event.end === 'string' ? 
    event.end : 
    typeof event.endTime === 'string' ? 
      event.endTime : 
      (event.end as Date).toISOString();
  
  return `${startTime.split('T')[1].substring(0, 5)} - ${endTime.split('T')[1].substring(0, 5)}`;
}
