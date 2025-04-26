
/**
 * CalendarMutationService - Responsible for all calendar event write operations
 * Handles creating, updating, and deleting events
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';

export class CalendarMutationService {
  /**
   * Create a new calendar event
   */
  static async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      console.log('[CalendarMutationService] Creating event:', {
        event: dbEvent,
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([dbEvent])
        .select()
        .single();

      if (error) {
        console.error('[CalendarMutationService] Error creating event:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
    } catch (error) {
      console.error('[CalendarMutationService] Error in createEvent:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      if (!event.id) {
        throw CalendarErrorHandler.createError(
          'Event ID is required for update operations',
          'VALIDATION_ERROR'
        );
      }
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      console.log('[CalendarMutationService] Updating event:', {
        id: event.id,
        event: dbEvent,
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .update(dbEvent)
        .eq('id', event.id)
        .select()
        .single();

      if (error) {
        console.error('[CalendarMutationService] Error updating event:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
    } catch (error) {
      console.error('[CalendarMutationService] Error in updateEvent:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      if (!eventId) {
        throw CalendarErrorHandler.createError(
          'Event ID is required for delete operations',
          'VALIDATION_ERROR'
        );
      }
      
      console.log('[CalendarMutationService] Deleting event:', eventId);
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('[CalendarMutationService] Error deleting event:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return true;
    } catch (error) {
      console.error('[CalendarMutationService] Error in deleteEvent:', error);
      
      // We don't re-throw here as delete failures can often be ignored
      // but we do return false to indicate failure
      return false;
    }
  }
}
