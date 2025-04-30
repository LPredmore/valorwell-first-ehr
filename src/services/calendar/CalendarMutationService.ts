
/**
 * CalendarMutationService - Responsible for all calendar event write operations
 * Handles creating, updating, and deleting events
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { queryMonitor } from '@/utils/performance/queryMonitor';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

export class CalendarMutationService {
  /**
   * Create a new calendar event
   */
  static async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    const endTimer = queryMonitor.startTimer('createCalendarEvent', { 
      source: 'CalendarMutationService',
      params: { eventType: event.extendedProps?.eventType }
    });
    
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      // Ensure clinician ID is properly formatted
      if (dbEvent.clinician_id) {
        dbEvent.clinician_id = formatAsUUID(dbEvent.clinician_id, { 
          strictMode: true,
          logLevel: 'warn'
        });
      }

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

      const result = data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
      endTimer({ fromCache: false });
      return result;
    } catch (error) {
      endTimer();
      console.error('[CalendarMutationService] Error in createEvent:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    const endTimer = queryMonitor.startTimer('updateCalendarEvent', { 
      source: 'CalendarMutationService',
      params: { eventId: event.id }
    });
    
    try {
      if (!event.id) {
        throw CalendarErrorHandler.createError(
          'Event ID is required for update operations',
          'VALIDATION_ERROR'
        );
      }
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      // Ensure clinician ID is properly formatted
      if (dbEvent.clinician_id) {
        dbEvent.clinician_id = formatAsUUID(dbEvent.clinician_id, { 
          strictMode: true,
          logLevel: 'warn'
        });
      }

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

      const result = data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
      endTimer({ fromCache: false });
      return result;
    } catch (error) {
      endTimer();
      console.error('[CalendarMutationService] Error in updateEvent:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    const endTimer = queryMonitor.startTimer('deleteCalendarEvent', { 
      source: 'CalendarMutationService',
      params: { eventId }
    });
    
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

      endTimer({ fromCache: false });
      return true;
    } catch (error) {
      endTimer();
      console.error('[CalendarMutationService] Error in deleteEvent:', error);
      
      // We don't re-throw here as delete failures can often be ignored
      // but we do return false to indicate failure
      return false;
    }
  }
  
  /**
   * Run a calendar health check
   */
  static async checkCalendarHealth(): Promise<{
    status: string;
    issues_found: boolean;
    details: Record<string, any>;
  }> {
    const endTimer = queryMonitor.startTimer('checkCalendarHealth', { 
      source: 'CalendarMutationService' 
    });
    
    try {
      console.log('[CalendarMutationService] Running calendar health check');
      
      const { data, error } = await supabase
        .rpc('check_calendar_data_health');

      if (error) {
        console.error('[CalendarMutationService] Error running health check:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      endTimer({ fromCache: false });
      return data;
    } catch (error) {
      endTimer();
      console.error('[CalendarMutationService] Error in checkCalendarHealth:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
