
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
import { formatAsUUID, isValidUUID, couldBeUUID } from '@/utils/validation/uuidUtils';
import { debugUuidValidation, trackCalendarApi } from '@/utils/calendarDebugUtils';

export class CalendarQueryService {
  /**
   * Validates and formats a clinician ID for database operations
   * 
   * @param id - The clinician ID to validate and format
   * @returns The formatted clinician ID or null if invalid
   */
  /**
   * Validates and formats a clinician ID for database operations
   * Enhanced with better UUID format handling and fallback mechanism
   *
   * @param id - The clinician ID to validate and format
   * @returns The formatted clinician ID or a fallback deterministic UUID if validation fails
   */
  private static validateClinicianId(id: string | null | undefined): string | null {
    if (!id) {
      console.warn('[CalendarQueryService] Empty clinician ID provided');
      return null;
    }
    
    const idStr = String(id).trim();
    
    try {
      // Check if it's already a valid UUID
      if (isValidUUID(idStr, { lenient: true, logLevel: 'debug' })) {
        return idStr;
      }
      
      // If not valid but could be a UUID, try to format it with more lenient options
      if (couldBeUUID(idStr)) {
        const formatted = formatAsUUID(idStr, {
          strictMode: false,  // Less strict to handle more formats
          logLevel: 'info'
        });
        
        if (isValidUUID(formatted, { lenient: true })) {
          console.info(`[CalendarQueryService] Formatted clinician ID: "${idStr}" → "${formatted}"`);
          return formatted;
        }
      }
      
      // If we still don't have a valid UUID, create a deterministic one as fallback
      console.warn(`[CalendarQueryService] Unable to validate clinician ID: "${idStr}", creating deterministic UUID`);
      
      // Create a deterministic UUID based on the input string
      const hashCode = (s: string) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
          h = Math.imul(31, h) + s.charCodeAt(i) | 0;
        }
        return h;
      };
      
      const hash = Math.abs(hashCode(idStr)).toString(16).padStart(8, '0');
      const deterministicUUID =
        hash.substring(0, 8) + '-' +
        hash.substring(0, 4) + '-' +
        '4' + hash.substring(0, 3) + '-' +
        '8' + hash.substring(0, 3) + '-' +
        hash.substring(0, 12).padEnd(12, '0');
      
      console.warn(`[CalendarQueryService] Created deterministic UUID: "${idStr}" → "${deterministicUUID}"`);
      return deterministicUUID;
    } catch (error) {
      // Catch any unexpected errors during validation
      console.error('[CalendarQueryService] Error validating clinician ID:', {
        id: idStr,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return null to indicate validation failure
      return null;
    }
  }

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
      
      // Validate and format the clinician ID with enhanced error handling
      const validatedClinicianId = this.validateClinicianId(clinicianId);
      if (!validatedClinicianId) {
        console.error(`[CalendarQueryService] Failed to validate clinician ID: "${clinicianId}"`);
        trackCalendarApi('error', {
          endpoint: 'getEvents',
          clinicianId,
          error: 'Invalid clinician ID format'
        });
        return [];
      }

      let query = supabase
        .from('unified_calendar_view')
        .select('*')
        .eq('clinician_id', validatedClinicianId)
        .eq('is_active', true);

      if (startDate && endDate) {
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        query = query.gte('end_time', startISO).lte('start_time', endISO);
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
      console.error('[CalendarQueryService] Error in getEvents:', {
        clinicianId,
        timezone,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      trackCalendarApi('error', {
        endpoint: 'getEvents',
        clinicianId,
        error,
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown Error'
        }
      });
      
      // Use the error handler but don't throw to prevent application crashes
      const formattedError = CalendarErrorHandler.formatError(error);
      console.error('[CalendarQueryService] Formatted error:', formattedError);
      return [];
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
      
      // Validate and format the clinician ID with enhanced error handling
      const validatedClinicianId = this.validateClinicianId(clinicianId);
      if (!validatedClinicianId) {
        console.error(`[CalendarQueryService] Failed to validate clinician ID: "${clinicianId}"`);
        trackCalendarApi('error', {
          endpoint: 'getAllEvents',
          clinicianId,
          error: 'Invalid clinician ID format'
        });
        return [];
      }
      
      const { data, error } = await supabase
        .from('unified_calendar_view')
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
      console.error('[CalendarQueryService] Error in getAllEvents:', {
        clinicianId,
        timezone,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      trackCalendarApi('error', {
        endpoint: 'getAllEvents',
        clinicianId,
        error,
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown Error'
        }
      });
      
      // Use the error handler but don't throw to prevent application crashes
      const formattedError = CalendarErrorHandler.formatError(error);
      console.error('[CalendarQueryService] Formatted error:', formattedError);
      return [];
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
      
      // Validate and format the clinician ID with enhanced error handling
      const validatedClinicianId = this.validateClinicianId(clinicianId);
      if (!validatedClinicianId) {
        console.error(`[CalendarQueryService] Failed to validate clinician ID: "${clinicianId}"`);
        trackCalendarApi('error', {
          endpoint: 'getEventsInRange',
          clinicianId,
          error: 'Invalid clinician ID format'
        });
        return [];
      }

      const startDateISO = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const endDateISO = typeof endDate === 'string' ? endDate : endDate.toISOString();

      const { data, error } = await supabase
        .from('unified_calendar_view')
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
      console.error('[CalendarQueryService] Error in getEventsInRange:', {
        clinicianId,
        startDate,
        endDate,
        timezone,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      trackCalendarApi('error', {
        endpoint: 'getEventsInRange',
        clinicianId,
        error,
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown Error'
        }
      });
      
      // Use the error handler but don't throw to prevent application crashes
      const formattedError = CalendarErrorHandler.formatError(error);
      console.error('[CalendarQueryService] Formatted error:', formattedError);
      return [];
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
      
      // Validate and format the clinician ID with enhanced error handling
      const validatedClinicianId = this.validateClinicianId(clinicianId);
      if (!validatedClinicianId) {
        console.error(`[CalendarQueryService] Failed to validate clinician ID: "${clinicianId}"`);
        trackCalendarApi('error', {
          endpoint: 'getEventsForDate',
          clinicianId,
          error: 'Invalid clinician ID format'
        });
        return [];
      }

      const dateISO = typeof date === 'string' ? date : date.toISOString();

      const { data, error } = await supabase
        .from('unified_calendar_view')
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
      console.error('[CalendarQueryService] Error in getEventsForDate:', {
        clinicianId,
        date,
        timezone,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      trackCalendarApi('error', {
        endpoint: 'getEventsForDate',
        clinicianId,
        error,
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown Error'
        }
      });
      
      // Use the error handler but don't throw to prevent application crashes
      const formattedError = CalendarErrorHandler.formatError(error);
      console.error('[CalendarQueryService] Formatted error:', formattedError);
      return [];
    }
  }
}
