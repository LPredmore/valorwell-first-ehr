
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { DateTime } from 'luxon';
import { CalendarError } from './CalendarErrorHandler';

/**
 * Calendar Health Service
 * 
 * Service to check for issues with calendar events
 * and provide diagnostic information
 */
export class CalendarHealthService {
  /**
   * Check an event for common issues
   * @param event The calendar event to check
   * @param timezone The timezone for the check
   * @returns Object with check results
   */
  static checkEvent(event: CalendarEvent, timezone: string): { 
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Validate basic properties
    if (!event.title) {
      issues.push('Event is missing a title');
    }
    
    if (!event.start) {
      issues.push('Event is missing a start time');
    }
    
    if (!event.end) {
      issues.push('Event is missing an end time');
    }
    
    // Check start and end times
    if (event.start && event.end) {
      const start = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start, { zone: timezone })
        : DateTime.fromJSDate(event.start, { zone: timezone });
        
      const end = typeof event.end === 'string'
        ? DateTime.fromISO(event.end, { zone: timezone })
        : DateTime.fromJSDate(event.end, { zone: timezone });
      
      if (!start.isValid) {
        issues.push(`Invalid start time: ${start.invalidReason}`);
      }
      
      if (!end.isValid) {
        issues.push(`Invalid end time: ${end.invalidReason}`);
      }
      
      if (start.isValid && end.isValid && start >= end) {
        issues.push('Event ends before or at the same time it starts');
      }
    }
    
    // Check for missing clinician ID
    if (!event.extendedProps?.clinicianId && !event.clinician_id) {
      issues.push('Event is missing a clinician ID');
    }
    
    // Check for valid event type
    const eventType = event.extendedProps?.eventType || event.type;
    if (!eventType) {
      issues.push('Event is missing a type');
    } else if (!['appointment', 'availability', 'time_off', 'general'].includes(eventType)) {
      issues.push(`Unknown event type: ${eventType}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Check for overlapping events
   * @param events Array of events to check
   * @param timezone Timezone for the check
   * @returns Array of overlapping event pairs
   */
  static checkForOverlaps(events: CalendarEvent[], timezone: string): { 
    overlaps: { event1: CalendarEvent, event2: CalendarEvent }[];
  } {
    const overlaps: { event1: CalendarEvent, event2: CalendarEvent }[] = [];
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Only check appointment events (not availability or time off)
    const appointmentEvents = events.filter(event => {
      const eventType = event.extendedProps?.eventType || event.type;
      return eventType === 'appointment';
    });
    
    // Check each pair of events for overlap
    for (let i = 0; i < appointmentEvents.length; i++) {
      const event1 = appointmentEvents[i];
      
      for (let j = i + 1; j < appointmentEvents.length; j++) {
        const event2 = appointmentEvents[j];
        
        // Convert to DateTime objects
        const start1 = typeof event1.start === 'string'
          ? DateTime.fromISO(event1.start, { zone: validTimeZone })
          : DateTime.fromJSDate(event1.start, { zone: validTimeZone });
          
        const end1 = typeof event1.end === 'string'
          ? DateTime.fromISO(event1.end, { zone: validTimeZone })
          : DateTime.fromJSDate(event1.end, { zone: validTimeZone });
          
        const start2 = typeof event2.start === 'string'
          ? DateTime.fromISO(event2.start, { zone: validTimeZone })
          : DateTime.fromJSDate(event2.start, { zone: validTimeZone });
          
        const end2 = typeof event2.end === 'string'
          ? DateTime.fromISO(event2.end, { zone: validTimeZone })
          : DateTime.fromJSDate(event2.end, { zone: validTimeZone });
        
        // Check for overlap: not (end1 <= start2 or end2 <= start1)
        if (!(end1 <= start2 || end2 <= start1)) {
          overlaps.push({ event1, event2 });
        }
      }
    }
    
    return { overlaps };
  }
  
  /**
   * Check for timing issues in a calendar event
   * @param event The calendar event to check
   * @param timezone The timezone for the check
   * @throws CalendarError if any timing issue is found
   */
  static validateEventTiming(event: CalendarEvent, timezone: string): void {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    if (!event.start || !event.end) {
      throw new CalendarError(
        'Event must have both start and end times',
        'INVALID_TIME_RANGE'
      );
    }
    
    // Convert to DateTime objects
    const start = typeof event.start === 'string'
      ? DateTime.fromISO(event.start, { zone: validTimeZone })
      : DateTime.fromJSDate(event.start, { zone: validTimeZone });
      
    const end = typeof event.end === 'string'
      ? DateTime.fromISO(event.end, { zone: validTimeZone })
      : DateTime.fromJSDate(event.end, { zone: validTimeZone });
    
    // Check validity of date objects
    if (!start.isValid) {
      throw new CalendarError(
        `Invalid start time: ${start.invalidReason}`,
        'INVALID_TIME_RANGE'
      );
    }
    
    if (!end.isValid) {
      throw new CalendarError(
        `Invalid end time: ${end.invalidReason}`,
        'INVALID_TIME_RANGE'
      );
    }
    
    // Ensure start is before end
    if (start >= end) {
      throw new CalendarError(
        'Event end time must be after start time',
        'INVALID_TIME_RANGE'
      );
    }
  }
  
  /**
   * Generate a diagnostic report for calendar data
   * @param events Array of events to diagnose
   * @param timezone Timezone for the diagnosis
   * @returns Diagnostic report object
   */
  static generateDiagnosticReport(events: CalendarEvent[], timezone: string) {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    const eventCount = events.length;
    const eventsByType: Record<string, number> = {};
    const invalidEvents: { event: CalendarEvent, issues: string[] }[] = [];
    
    // Analyze events
    for (const event of events) {
      // Count by type
      const eventType = event.extendedProps?.eventType || event.type || 'unknown';
      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
      
      // Check for validity
      const { isValid, issues } = this.checkEvent(event, validTimeZone);
      if (!isValid) {
        invalidEvents.push({ event, issues });
      }
    }
    
    // Check for overlaps
    const { overlaps } = this.checkForOverlaps(events, validTimeZone);
    
    return {
      eventCount,
      eventsByType,
      invalidEvents,
      overlapCount: overlaps.length,
      overlaps,
      timezone: validTimeZone
    };
  }
}

export default CalendarHealthService;
