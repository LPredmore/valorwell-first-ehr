
/**
 * CalendarMutationService - Responsible for all calendar event write operations
 * Currently implemented as a mock service until database tables are recreated
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { queryMonitor } from '@/utils/performance/queryMonitor';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

export class CalendarMutationService {
  static useMockData = true; // Set to true to use mock data

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
      
      // If using mock data, simulate a successful creation
      if (this.useMockData) {
        const mockEvent = {
          ...event,
          id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          extendedProps: {
            ...(event.extendedProps || {}),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
        
        console.log('[CalendarMutationService] Mock created event:', mockEvent);
        endTimer({ fromCache: false });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return TimeZoneService.convertEventToUserTimeZone(mockEvent, validTimeZone);
      }
      
      // Real database implementation
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

      const result = data ? calendarTransformer.fromDatabase(data, validTimeZone) : null;
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
      
      // If using mock data, simulate a successful update
      if (this.useMockData) {
        const mockEvent = {
          ...event,
          extendedProps: {
            ...(event.extendedProps || {}),
            updatedAt: new Date().toISOString(),
          }
        };
        
        console.log('[CalendarMutationService] Mock updated event:', mockEvent);
        endTimer({ fromCache: false });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return TimeZoneService.convertEventToUserTimeZone(mockEvent, validTimeZone);
      }
      
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

      const result = data ? calendarTransformer.fromDatabase(data, validTimeZone) : null;
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
      
      // If using mock data, simulate a successful deletion
      if (this.useMockData) {
        console.log('[CalendarMutationService] Mock deleted event:', eventId);
        endTimer({ fromCache: false });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return true;
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
}
