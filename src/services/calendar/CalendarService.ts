
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AppointmentService } from './AppointmentService';
import { AvailabilityService } from './AvailabilityService';
import { DateTime } from 'luxon';

/**
 * Interface for GetCalendarEventsOptions
 */
interface GetCalendarEventsOptions {
  clinicianId: string;
  timeZone: string;
  startDate?: Date | string;
  endDate?: Date | string;
  includeAppointments?: boolean;
  includeAvailability?: boolean;
  includeInactive?: boolean;
}

/**
 * CalendarService
 * 
 * Handles all operations related to the calendar system, including:
 * - Getting calendar events
 * - Converting database records to CalendarEvent objects
 * - Managing event types and colors
 */
export class CalendarService {
  /**
   * Gets calendar events for a clinician
   * 
   * @param options - Options for getting calendar events
   * @returns An array of calendar events
   */
  static async getCalendarEvents(
    options: GetCalendarEventsOptions
  ): Promise<CalendarEvent[]> {
    try {
      const {
        clinicianId,
        timeZone,
        startDate,
        endDate,
        includeAppointments = true,
        includeAvailability = true,
        includeInactive = false
      } = options;
      
      // Validate timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      const events: CalendarEvent[] = [];
      
      // Add appointments if requested
      if (includeAppointments) {
        // Get appointments
        const appointments = await AppointmentService.getAppointments(
          clinicianId,
          validTimeZone,
          startDate,
          endDate
        );
        
        // Convert appointments to calendar events
        for (const appointment of appointments) {
          const appointmentEvent = AppointmentService.toCalendarEvent(appointment, validTimeZone);
          events.push(appointmentEvent);
        }
      }
      
      // Add availability if requested
      if (includeAvailability) {
        // Get availability blocks
        const availabilityBlocks = await AvailabilityService.getAvailability(
          clinicianId,
          validTimeZone,
          startDate,
          endDate,
          includeInactive
        );
        
        // Convert availability blocks to calendar events
        for (const block of availabilityBlocks) {
          const availabilityEvent = AvailabilityService.toCalendarEvent(block, validTimeZone);
          events.push(availabilityEvent);
        }
      }
      
      return events;
    } catch (error) {
      console.error('[CalendarService] Error getting calendar events:', error);
      throw error;
    }
  }
  
  /**
   * Gets a single calendar event by ID
   * 
   * @param id - The ID of the event
   * @param timeZone - The timezone to return the event in
   * @returns The calendar event or null if not found
   */
  static async getCalendarEventById(
    id: string,
    timeZone: string
  ): Promise<CalendarEvent | null> {
    try {
      // Validate timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      // Try to get as an appointment
      const appointment = await AppointmentService.getAppointmentById(id);
      
      if (appointment) {
        return AppointmentService.toCalendarEvent(appointment, validTimeZone);
      }
      
      // Try to get as an availability block
      const availabilityBlock = await AvailabilityService.getAvailabilityById(id);
      
      if (availabilityBlock) {
        return AvailabilityService.toCalendarEvent(availabilityBlock, validTimeZone);
      }
      
      return null;
    } catch (error) {
      console.error('[CalendarService] Error getting calendar event by ID:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new calendar event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @returns The created calendar event
   */
  static async createCalendarEvent(
    event: Partial<CalendarEvent>,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      // Validate timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      if (!event.extendedProps?.eventType) {
        throw new Error('Event type is required');
      }
      
      if (event.extendedProps.eventType === 'appointment') {
        // Create appointment
        if (!event.extendedProps.clientId || !event.extendedProps.clinicianId) {
          throw new Error('Client ID and clinician ID are required for appointments');
        }
        
        if (!event.start || !event.end) {
          throw new Error('Start and end times are required for appointments');
        }
        
        const start = event.start instanceof Date ? event.start.toISOString() : event.start;
        const end = event.end instanceof Date ? event.end.toISOString() : event.end;
        
        const appointment = await AppointmentService.createAppointment(
          event.extendedProps.clientId,
          event.extendedProps.clinicianId,
          start,
          end,
          event.title || 'Appointment',
          validTimeZone,
          event.extendedProps.description
        );
        
        return AppointmentService.toCalendarEvent(appointment, validTimeZone);
      } else if (event.extendedProps.eventType === 'availability') {
        // Create availability
        if (!event.extendedProps.clinicianId) {
          throw new Error('Clinician ID is required for availability blocks');
        }
        
        if (!event.start || !event.end) {
          throw new Error('Start and end times are required for availability blocks');
        }
        
        const start = event.start instanceof Date ? event.start.toISOString() : event.start;
        const end = event.end instanceof Date ? event.end.toISOString() : event.end;
        
        const isRecurring = event.extendedProps.isRecurring || false;
        const rrule = event.extendedProps.rrule;
        
        const availabilityBlock = await AvailabilityService.createAvailability(
          event.extendedProps.clinicianId,
          start,
          end,
          validTimeZone,
          isRecurring,
          rrule
        );
        
        return AvailabilityService.toCalendarEvent(availabilityBlock, validTimeZone);
      } else {
        throw new Error(`Unsupported event type: ${event.extendedProps.eventType}`);
      }
    } catch (error) {
      console.error('[CalendarService] Error creating calendar event:', error);
      throw error;
    }
  }
  
  /**
   * Updates an existing calendar event
   * 
   * @param id - The ID of the event to update
   * @param event - The updates to apply
   * @param timeZone - The timezone of the event
   * @returns The updated calendar event
   */
  static async updateCalendarEvent(
    id: string,
    event: Partial<CalendarEvent>,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      // Validate timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      if (!event.extendedProps?.eventType) {
        // Try to determine event type from existing event
        const existingEvent = await this.getCalendarEventById(id, validTimeZone);
        
        if (!existingEvent) {
          throw new Error('Event not found');
        }
        
        event.extendedProps = {
          ...event.extendedProps,
          eventType: existingEvent.extendedProps?.eventType || 'general'
        };
      }
      
      if (event.extendedProps.eventType === 'appointment') {
        // Update appointment
        const updates: any = {};
        
        if (event.start) {
          updates.start_time = typeof event.start === 'string' 
            ? event.start 
            : event.start.toISOString();
        }
        
        if (event.end) {
          updates.end_time = typeof event.end === 'string' 
            ? event.end 
            : event.end.toISOString();
        }
        
        if (event.title) {
          updates.type = event.title;
        }
        
        if (event.extendedProps.description) {
          updates.notes = event.extendedProps.description;
        }
        
        if (event.extendedProps.status) {
          updates.status = event.extendedProps.status;
        }
        
        if (event.extendedProps.clientId) {
          updates.client_id = event.extendedProps.clientId;
        }
        
        if (event.extendedProps.clinicianId) {
          updates.clinician_id = event.extendedProps.clinicianId;
        }
        
        const appointment = await AppointmentService.updateAppointment(id, updates);
        return AppointmentService.toCalendarEvent(appointment, validTimeZone);
      } else if (event.extendedProps.eventType === 'availability') {
        // Update availability
        const updates: any = {};
        
        if (event.start) {
          updates.start_time = typeof event.start === 'string' 
            ? event.start 
            : event.start.toISOString();
        }
        
        if (event.end) {
          updates.end_time = typeof event.end === 'string' 
            ? event.end 
            : event.end.toISOString();
        }
        
        if (event.extendedProps.isActive !== undefined) {
          updates.is_active = event.extendedProps.isActive;
        }
        
        const availabilityBlock = await AvailabilityService.updateAvailability(id, updates);
        return AvailabilityService.toCalendarEvent(availabilityBlock, validTimeZone);
      } else {
        throw new Error(`Unsupported event type: ${event.extendedProps.eventType}`);
      }
    } catch (error) {
      console.error('[CalendarService] Error updating calendar event:', error);
      throw error;
    }
  }
  
  /**
   * Deletes a calendar event
   * 
   * @param id - The ID of the event to delete
   * @param eventType - The type of event (optional, will determine automatically if not provided)
   * @returns True if the deletion was successful
   */
  static async deleteCalendarEvent(
    id: string,
    eventType?: CalendarEventType
  ): Promise<boolean> {
    try {
      if (!eventType) {
        // Try to determine event type from existing event
        try {
          const appointment = await AppointmentService.getAppointmentById(id);
          if (appointment) {
            eventType = 'appointment';
          }
        } catch (error) {
          // Not an appointment, try availability
          try {
            const availabilityBlock = await AvailabilityService.getAvailabilityById(id);
            if (availabilityBlock) {
              eventType = 'availability';
            }
          } catch (innerError) {
            // Not an availability block either
            throw new Error('Event not found');
          }
        }
      }
      
      if (eventType === 'appointment') {
        return await AppointmentService.deleteAppointment(id);
      } else if (eventType === 'availability') {
        return await AvailabilityService.deleteAvailability(id);
      } else {
        throw new Error(`Unsupported event type: ${eventType}`);
      }
    } catch (error) {
      console.error('[CalendarService] Error deleting calendar event:', error);
      throw error;
    }
  }

  // Add compatibility methods to match test expectations
  static async getEvents(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    return this.getCalendarEvents({
      clinicianId,
      timeZone,
      startDate,
      endDate
    });
  }

  static async createEvent(
    event: Partial<CalendarEvent>, 
    timeZone: string
  ): Promise<CalendarEvent> {
    return this.createCalendarEvent(event, timeZone);
  }

  static async updateEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    if (!event.id) {
      throw new Error('Event ID is required for update');
    }
    return this.updateCalendarEvent(event.id, event, timeZone);
  }

  static async deleteEvent(
    id: string,
    eventType: CalendarEventType
  ): Promise<boolean> {
    return this.deleteCalendarEvent(id, eventType);
  }
}

export default CalendarService;
