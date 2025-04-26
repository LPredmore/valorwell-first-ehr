
/**
 * CalendarFacade - Simplified interface to the calendar services
 * Acts as a migration path for existing code to use the new service structure
 */

import { CalendarEvent } from '@/types/calendar';
import { CalendarQueryService } from './CalendarQueryService';
import { CalendarMutationService } from './CalendarMutationService';
import { CalendarErrorHandler } from './CalendarErrorHandler';

/**
 * CalendarFacade provides a simplified interface to calendar services
 * This helps with the migration from the monolithic CalendarService
 */
export class CalendarService {
  // Query operations
  static getEvents(
    clinicianId: string,
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    return CalendarQueryService.getEvents(clinicianId, timezone, startDate, endDate);
  }

  static getAllEvents(clinicianId: string, timezone: string): Promise<CalendarEvent[]> {
    return CalendarQueryService.getAllEvents(clinicianId, timezone);
  }

  static getEventsInRange(
    clinicianId: string, 
    startDate: Date | string, 
    endDate: Date | string, 
    timezone: string
  ): Promise<CalendarEvent[]> {
    return CalendarQueryService.getEventsInRange(clinicianId, startDate, endDate, timezone);
  }

  static getEventsForDate(
    clinicianId: string, 
    date: Date | string, 
    timezone: string
  ): Promise<CalendarEvent[]> {
    return CalendarQueryService.getEventsForDate(clinicianId, date, timezone);
  }

  // Mutation operations
  static createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    return CalendarMutationService.createEvent(event, timezone);
  }

  static updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    return CalendarMutationService.updateEvent(event, timezone);
  }

  static deleteEvent(eventId: string): Promise<boolean> {
    return CalendarMutationService.deleteEvent(eventId);
  }

  // Error handling
  static formatError(error: unknown): string {
    return CalendarErrorHandler.getUserFriendlyMessage(error);
  }
}

// Re-export everything from the specialized services
export { CalendarQueryService } from './CalendarQueryService';
export { CalendarMutationService } from './CalendarMutationService';
export { CalendarErrorHandler, CalendarError, type CalendarErrorCode } from './CalendarErrorHandler';
