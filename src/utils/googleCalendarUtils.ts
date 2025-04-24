
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';

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

// Define interface for Google API credentials
export interface GoogleApiCredentials {
  clientId: string;
  apiKey: string;
}

// Cache for credentials to avoid unnecessary function calls
let cachedCredentials: GoogleApiCredentials | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Function to fetch Google API credentials from Edge Function
export async function fetchGoogleCredentials(): Promise<GoogleApiCredentials> {
  // Check if we have valid cached credentials
  const now = Date.now();
  if (cachedCredentials && now - lastFetchTime < CACHE_DURATION) {
    return cachedCredentials;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-google-credentials', {
      method: 'GET',
    });

    if (error) {
      console.error('Error fetching Google credentials:', error);
      throw new Error(`Failed to fetch Google credentials: ${error.message}`);
    }

    if (!data || !data.clientId || !data.apiKey) {
      throw new Error('Received invalid Google credentials from server');
    }

    // Update cache
    cachedCredentials = {
      clientId: data.clientId,
      apiKey: data.apiKey,
    };
    lastFetchTime = now;

    return cachedCredentials;
  } catch (error) {
    console.error('Error in fetchGoogleCredentials:', error);
    throw error;
  }
}

// Export configuration builder function for better error handling in components
export async function getGoogleApiConfig() {
  const credentials = await fetchGoogleCredentials();
  
  return {
    clientId: credentials.clientId,
    apiKey: credentials.apiKey,
    scope: GOOGLE_SCOPES.join(' '),
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  };
}

// Note: Client secret is intentionally not included here as it should never be used in the browser

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
