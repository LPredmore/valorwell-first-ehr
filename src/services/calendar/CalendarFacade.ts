
/**
 * Calendar Facade
 * 
 * Provides a simplified interface for calendar operations,
 * hiding the complexity of the underlying services
 */
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { CalendarService } from './CalendarService';
import { CalendarHealthService } from './CalendarHealthService';
import { TimeZoneService } from '@/utils/timeZoneService';

export class CalendarFacade {
  /**
   * Get all calendar events for a clinician in a date range
   */
  static async getEvents(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone?: string
  ): Promise<CalendarEvent[]> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    const events = await CalendarService.getCalendarEvents({
      clinicianId,
      timeZone: validTimeZone,
      startDate,
      endDate
    });
    
    return events;
  }
  
  /**
   * Create a new calendar event
   */
  static async createEvent(
    event: CalendarEvent,
    timezone?: string
  ): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Validate event timing
    CalendarHealthService.validateEventTiming(event, validTimeZone);
    
    const result = await CalendarService.createCalendarEvent(event, validTimeZone);
    return result;
  }
  
  /**
   * Update an existing calendar event
   */
  static async updateEvent(
    event: CalendarEvent,
    timezone?: string
  ): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Validate event timing
    CalendarHealthService.validateEventTiming(event, validTimeZone);
    
    if (!event.id) {
      throw new Error('Event ID is required for update');
    }
    
    const result = await CalendarService.updateCalendarEvent(event.id, event, validTimeZone);
    return result;
  }
  
  /**
   * Delete a calendar event
   */
  static async deleteEvent(
    eventId: string,
    eventType: CalendarEventType
  ): Promise<boolean> {
    return CalendarService.deleteCalendarEvent(eventId, eventType);
  }
  
  /**
   * Run diagnostic tests on the calendar data
   */
  static async runDiagnostics(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone?: string
  ) {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Get events for diagnostic
    const events = await this.getEvents(clinicianId, startDate, endDate, validTimeZone);
    
    // Generate diagnostic report
    return CalendarHealthService.generateDiagnosticReport(events, validTimeZone);
  }
}

export default CalendarFacade;
