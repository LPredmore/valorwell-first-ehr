
/**
 * CalendarQueryService - Responsible for all calendar event read operations
 * Handles fetching events from the database and transforming them into usable formats
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { formatAsUUID, isValidUUID } from '@/utils/validation/uuidUtils';
import { debugUuidValidation, trackCalendarApi } from '@/utils/calendarDebugUtils';

export class CalendarQueryService {
  /**
   * Get calendar events for a specific clinician and time range
   */
  static async getEvents(
    clinicianId: string,
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      debugUuidValidation(clinicianId, 'CalendarQueryService.getEvents', {
        timezone: validTimeZone,
        startDate,
        endDate
      });
      
      trackCalendarApi('request', {
        endpoint: 'getEvents',
        clinicianId,
        timezone: validTimeZone,
        startDate,
        endDate
      });
      
      console.log('[CalendarQueryService] Getting events for clinician:', {
        clinicianId,
        timezone: validTimeZone,
        startDate,
        endDate
      });
      
      // Try to format the clinician ID if it's not a valid UUID
      let validatedClinicianId = clinicianId;
      if (!isValidUUID(clinicianId)) {
        console.warn(`[CalendarQueryService] Clinician ID is not a valid UUID: "${clinicianId}"`);
        const formattedId = formatAsUUID(clinicianId);
        if (isValidUUID(formattedId)) {
          console.info(`[CalendarQueryService] Formatted clinician ID: "${clinicianId}" → "${formattedId}"`);
          validatedClinicianId = formattedId;
        } else {
          console.error(`[CalendarQueryService] Failed to format clinician ID as UUID: "${clinicianId}"`);
          return [];  // Early return if we can't get a valid UUID
        }
      }

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', validatedClinicianId)
        .eq('is_active', true);

      if (startDate && endDate) {
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        query = query.gte('start_time', startISO).lte('end_time', endISO);
      }

      const { data, error } = await query;

      if (error) {
        trackCalendarApi('error', {
          endpoint: 'getEvents',
          clinicianId: validatedClinicianId,
          error
        });
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];
      
      trackCalendarApi('success', {
        endpoint: 'getEvents',
        clinicianId: validatedClinicianId,
        resultCount: transformedEvents.length
      });

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEvents:', error);
      trackCalendarApi('error', {
        endpoint: 'getEvents',
        clinicianId,
        error
      });
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get all calendar events for a clinician
   */
  static async getAllEvents(
    clinicianId: string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      debugUuidValidation(clinicianId, 'CalendarQueryService.getAllEvents');
      
      trackCalendarApi('request', {
        endpoint: 'getAllEvents',
        clinicianId,
        timezone: validTimeZone
      });
      
      console.log('[CalendarQueryService] Getting all events for clinician:', clinicianId);
      
      // Try to format the clinician ID if it's not a valid UUID
      let validatedClinicianId = clinicianId;
      if (!isValidUUID(clinicianId)) {
        console.warn(`[CalendarQueryService] Clinician ID is not a valid UUID: "${clinicianId}"`);
        const formattedId = formatAsUUID(clinicianId);
        if (isValidUUID(formattedId)) {
          console.info(`[CalendarQueryService] Formatted clinician ID: "${clinicianId}" → "${formattedId}"`);
          validatedClinicianId = formattedId;
        } else {
          console.error(`[CalendarQueryService] Failed to format clinician ID as UUID: "${clinicianId}"`);
          return [];  // Early return if we can't get a valid UUID
        }
      }
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', validatedClinicianId)
        .eq('is_active', true);

      if (error) {
        trackCalendarApi('error', {
          endpoint: 'getAllEvents',
          clinicianId: validatedClinicianId,
          error
        });
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];
      
      trackCalendarApi('success', {
        endpoint: 'getAllEvents',
        clinicianId: validatedClinicianId,
        resultCount: transformedEvents.length
      });

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getAllEvents:', error);
      trackCalendarApi('error', {
        endpoint: 'getAllEvents',
        clinicianId,
        error
      });
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get calendar events within a specific date range
   */
  static async getEventsInRange(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      debugUuidValidation(clinicianId, 'CalendarQueryService.getEventsInRange', {
        startDate,
        endDate,
        timezone: validTimeZone
      });
      
      trackCalendarApi('request', {
        endpoint: 'getEventsInRange',
        clinicianId,
        startDate,
        endDate,
        timezone: validTimeZone
      });
      
      console.log('[CalendarQueryService] Getting events in range for clinician:', {
        clinicianId,
        startDate,
        endDate,
        timezone: validTimeZone
      });
      
      // Try to format the clinician ID if it's not a valid UUID
      let validatedClinicianId = clinicianId;
      if (!isValidUUID(clinicianId)) {
        console.warn(`[CalendarQueryService] Clinician ID is not a valid UUID: "${clinicianId}"`);
        const formattedId = formatAsUUID(clinicianId);
        if (isValidUUID(formattedId)) {
          console.info(`[CalendarQueryService] Formatted clinician ID: "${clinicianId}" → "${formattedId}"`);
          validatedClinicianId = formattedId;
        } else {
          console.error(`[CalendarQueryService] Failed to format clinician ID as UUID: "${clinicianId}"`);
          return [];  // Early return if we can't get a valid UUID
        }
      }

      const startDateISO = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const endDateISO = typeof endDate === 'string' ? endDate : endDate.toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', validatedClinicianId)
        .gte('end_time', startDateISO)
        .lte('start_time', endDateISO)
        .eq('is_active', true);

      if (error) {
        trackCalendarApi('error', {
          endpoint: 'getEventsInRange',
          clinicianId: validatedClinicianId,
          error
        });
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];
      
      trackCalendarApi('success', {
        endpoint: 'getEventsInRange',
        clinicianId: validatedClinicianId,
        resultCount: transformedEvents.length
      });

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsInRange:', error);
      trackCalendarApi('error', {
        endpoint: 'getEventsInRange',
        clinicianId,
        error
      });
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get calendar events for a specific date
   */
  static async getEventsForDate(
    clinicianId: string,
    date: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      debugUuidValidation(clinicianId, 'CalendarQueryService.getEventsForDate', {
        date,
        timezone: validTimeZone
      });
      
      trackCalendarApi('request', {
        endpoint: 'getEventsForDate',
        clinicianId,
        date,
        timezone: validTimeZone
      });
      
      console.log('[CalendarQueryService] Getting events for date for clinician:', {
        clinicianId,
        date,
        timezone: validTimeZone
      });
      
      // Try to format the clinician ID if it's not a valid UUID
      let validatedClinicianId = clinicianId;
      if (!isValidUUID(clinicianId)) {
        console.warn(`[CalendarQueryService] Clinician ID is not a valid UUID: "${clinicianId}"`);
        const formattedId = formatAsUUID(clinicianId);
        if (isValidUUID(formattedId)) {
          console.info(`[CalendarQueryService] Formatted clinician ID: "${clinicianId}" → "${formattedId}"`);
          validatedClinicianId = formattedId;
        } else {
          console.error(`[CalendarQueryService] Failed to format clinician ID as UUID: "${clinicianId}"`);
          return [];  // Early return if we can't get a valid UUID
        }
      }

      const dateISO = typeof date === 'string' ? date : date.toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', validatedClinicianId)
        .gte('end_time', dateISO)
        .lte('start_time', dateISO)
        .eq('is_active', true);

      if (error) {
        trackCalendarApi('error', {
          endpoint: 'getEventsForDate',
          clinicianId: validatedClinicianId,
          error
        });
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];
      
      trackCalendarApi('success', {
        endpoint: 'getEventsForDate',
        clinicianId: validatedClinicianId,
        resultCount: transformedEvents.length
      });

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsForDate:', error);
      trackCalendarApi('error', {
        endpoint: 'getEventsForDate',
        clinicianId,
        error
      });
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
