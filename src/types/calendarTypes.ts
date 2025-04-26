
import { CalendarEvent } from './calendar';

// Database calendar event shape matches our Supabase table exactly
export interface DatabaseCalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  event_type: string;
  availability_type?: string;
  is_active: boolean;
  clinician_id: string;
  time_zone?: string;
  source_time_zone?: string;
  all_day?: boolean;
  recurrence_id?: string;
}

// Interface for transforming between DB and UI formats
export interface CalendarEventTransform {
  fromDatabase: (dbEvent: DatabaseCalendarEvent, timezone: string) => CalendarEvent;
  toDatabase: (event: CalendarEvent, timezone: string) => Omit<DatabaseCalendarEvent, 'id'>;
}
