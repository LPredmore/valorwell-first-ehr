
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { queryMonitor } from '@/utils/performance/queryMonitor';
import { formatAsUUID } from '@/utils/validation/uuidUtils';
import { generateMockCalendarEvents } from '@/utils/mockCalendarData';

/**
 * CalendarQueryService - Responsible for fetching calendar events from the database
 * or providing mock data when the database is not available
 */
export class CalendarQueryService {
  static useMockData = true; // Set to true to use mock data instead of real database
  
  /**
   * Get calendar events for a specific date range
   */
  static async getEventsInRange(
    clinicianId: string,
    startDate: Date,
    endDate: Date,
    timeZone: string,
    options: {
      includeAppointments?: boolean;
      includeAvailability?: boolean;
      includeTimeOff?: boolean;
      cacheTime?: number;
    } = {}
  ): Promise<CalendarEvent[]> {
    const endTimer = queryMonitor.startTimer('getCalendarEvents', { 
      source: 'CalendarQueryService',
      params: { 
        clinicianId, 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeZone,
        options
      }
    });
    
    try {
      // Use mock data if the flag is set
      if (this.useMockData) {
        console.log('[CalendarQueryService] Using mock data for calendar events');
        const events = generateMockCalendarEvents(
          clinicianId, 
          15, 
          timeZone,
          startDate,
          endDate
        );
        endTimer({ fromCache: false });
        return events;
      }
      
      console.log('[CalendarQueryService] Fetching calendar events from database');
      
      // Normalize clinician ID to UUID format
      const normalizedClinicianId = formatAsUUID(clinicianId, { strictMode: false });
      
      // Ensure we have a valid timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      const fetchStartTime = performance.now();
      
      // Format dates for database query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Perform the actual database query
      const { data, error } = await supabase
        .from('unified_calendar_view')
        .select('*')
        .eq('clinician_id', normalizedClinicianId)
        .gte('start_time', formattedStartDate)
        .lte('end_time', formattedEndDate);
      
      if (error) {
        console.error('[CalendarQueryService] Error fetching calendar events:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      console.log(`[CalendarQueryService] Fetched ${data?.length || 0} calendar events in ${performance.now() - fetchStartTime}ms`);
      
      // Transform database results to CalendarEvent objects and convert to user timezone
      const events = (data || []).map(dbEvent => {
        const event = calendarTransformer.fromDatabase(dbEvent, validTimeZone);
        return TimeZoneService.convertEventToUserTimeZone(event, validTimeZone);
      });
      
      endTimer({ fromCache: false });
      return events;
    } catch (error) {
      endTimer();
      console.error('[CalendarQueryService] Error in getEventsInRange:', error);
      
      // Fallback to mock data if there's an error
      console.log('[CalendarQueryService] Falling back to mock data due to error');
      const events = generateMockCalendarEvents(
        clinicianId, 
        15, 
        timeZone,
        startDate,
        endDate
      );
      return events;
    }
  }
}
