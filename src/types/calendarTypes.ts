
import { CalendarEvent } from './calendar';

/**
 * Database calendar event shape matches our Supabase table exactly
 * This ensures type safety when interacting with the database
 */
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
  created_at?: string;
  updated_at?: string;
  google_event_id?: string;
  display_color?: string;
}

/**
 * Type for transformation errors that can occur when converting between DB and UI formats
 */
export interface TransformationError {
  message: string;
  code: string;
  context?: Record<string, any>;
}

/**
 * Interface for transforming between DB and UI formats
 * This ensures consistent transformation across the application
 */
export interface CalendarEventTransform {
  /**
   * Transform a database event to a calendar event for UI
   * @param dbEvent The database event to transform
   * @param timezone The timezone to use for the transformation
   * @returns A calendar event ready for UI display
   * @throws TransformationError if the transformation fails
   */
  fromDatabase: (dbEvent: DatabaseCalendarEvent, timezone: string) => CalendarEvent;
  
  /**
   * Transform a calendar event from UI to database format
   * @param event The calendar event to transform
   * @param timezone The timezone to use for the transformation
   * @returns A database event ready for storage
   * @throws TransformationError if the transformation fails
   */
  toDatabase: (event: CalendarEvent, timezone: string) => Omit<DatabaseCalendarEvent, 'id'>;
}
