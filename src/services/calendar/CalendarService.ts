import { DateTime } from 'luxon';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarError, CalendarErrorHandler } from './CalendarErrorHandler';
import { AppointmentService } from './AppointmentService';
import { AvailabilityService } from './AvailabilityService';
import { TimeOffService } from './TimeOffService';
import { formatAsUUID, ensureUUID } from '@/utils/validation/uuidUtils';

// Define AvailabilityBlock interface if needed
interface AvailabilityBlock {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  availability_type?: string;
  time_zone?: string;
  // Add other required properties
}

// Define Appointment interface if needed
interface Appointment {
  id: string;
  clinician_id: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  // Add other required properties
}

/**
 * Calendar Service
 * 
 * Main service for calendar operations, orchestrating between different event type services
 */
export class CalendarService {
  /**
   * Get calendar events for a clinician in a date range
   */
  static async getEvents(
    clinicianId: string,
    timezone: string,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      console.log('[CalendarService] Getting events:', { clinicianId, timezone, startDate, endDate });
      
      // Format clinician ID
      const formattedClinicianId = formatAsUUID(clinicianId, { logLevel: 'warn' });
      
      // Ensure valid timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Prepare results array
      const events: CalendarEvent[] = [];
      
      // Fetch different event types concurrently
      const [availability, appointments, timeOff] = await Promise.all([
        this.getAvailabilityEvents(formattedClinicianId, validTimeZone, startDate, endDate)
          .catch(error => {
            console.error('[CalendarService] Error fetching availability:', error);
            return [] as CalendarEvent[];
          }),
        this.getAppointmentEvents(formattedClinicianId, validTimeZone, startDate, endDate)
          .catch(error => {
            console.error('[CalendarService] Error fetching appointments:', error);
            return [] as CalendarEvent[];
          }),
        this.getTimeOffEvents(formattedClinicianId, validTimeZone, startDate, endDate)
          .catch(error => {
            console.error('[CalendarService] Error fetching time off:', error);
            return [] as CalendarEvent[];
          })
      ]);
      
      // Add all events to results array
      events.push(...availability);
      events.push(...appointments);
      events.push(...timeOff);
      
      console.log(`[CalendarService] Found ${events.length} events`);
      
      return events;
    } catch (error) {
      console.error('[CalendarService] Error getting events:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get availability events for a clinician
   */
  static async getAvailabilityEvents(
    clinicianId: string,
    timezone: string,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      // Convert AvailabilityBlock[] to CalendarEvent[]
      const rawEvents = await AvailabilityService.getAvailability(clinicianId, timezone, startDate, endDate);
      
      // Ensure rawEvents is an array (defensive programming)
      const availabilityBlocks = Array.isArray(rawEvents) ? rawEvents : [];
      
      // Convert each availability block to a calendar event
      const events: CalendarEvent[] = availabilityBlocks.map(block => ({
        id: block.id,
        title: block.availability_type || 'Available',
        start: block.start_time,
        end: block.end_time,
        extendedProps: {
          clinicianId: block.clinician_id,
          eventType: 'availability',
          sourceTimeZone: block.time_zone || timezone
        }
      }));
      
      // Apply colors to events
      return events.map(event => {
        return this.applyEventColors(event);
      });
    } catch (error) {
      console.error('[CalendarService] Error in getAvailabilityEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get appointment events for a clinician
   */
  static async getAppointmentEvents(
    clinicianId: string,
    timezone: string,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      // Convert Appointment[] to CalendarEvent[]
      const rawAppointments = await AppointmentService.getAppointments(clinicianId, timezone, startDate, endDate);
      
      // Ensure rawAppointments is an array (defensive programming)
      const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
      
      // Convert each appointment to a calendar event
      const events: CalendarEvent[] = appointments.map(appt => ({
        id: appt.id,
        title: 'Appointment',
        start: appt.start_time,
        end: appt.end_time,
        extendedProps: {
          clinicianId: appt.clinician_id,
          clientId: appt.client_id,
          eventType: 'appointment'
        }
      }));
      
      // Apply colors to events
      return events.map(event => {
        return this.applyEventColors(event);
      });
    } catch (error) {
      console.error('[CalendarService] Error in getAppointmentEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get time off events for a clinician
   */
  static async getTimeOffEvents(
    clinicianId: string,
    timezone: string,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      const events = await TimeOffService.getTimeOff(clinicianId, timezone, startDate, endDate);
      
      // Apply colors to events
      return events.map(event => {
        event = this.applyEventColors(event);
        
        // Ensure extendedProps.clinicianId exists
        if (!event.extendedProps) {
          event.extendedProps = {};
        }
        
        if (!event.extendedProps.clinicianId) {
          event.extendedProps.clinicianId = clinicianId;
        }
        
        return event;
      });
    } catch (error) {
      console.error('[CalendarService] Error in getTimeOffEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Create a new calendar event
   */
  static async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent> {
    try {
      console.log('[CalendarService] Creating event:', event);
      
      // Ensure the timezone is valid
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Determine event type and call appropriate service
      const eventType = event.extendedProps?.eventType || event.type;
      
      if (event.extendedProps?.clinicianId) {
        event.extendedProps.clinicianId = formatAsUUID(event.extendedProps.clinicianId, { logLevel: 'warn' });
      }
      
      let result: CalendarEvent | null;
      
      switch (eventType) {
        case 'appointment':
          result = await AppointmentService.createAppointment(event, validTimeZone);
          break;
        case 'availability':
          result = await AvailabilityService.createAvailability(event, validTimeZone);
          break;
        case 'time_off':
          result = await TimeOffService.createTimeOff(event, validTimeZone);
          break;
        default:
          throw CalendarErrorHandler.createError(`Unknown event type: ${eventType}`, 'INVALID_EVENT_TYPE');
      }
      
      if (!result) {
        throw CalendarErrorHandler.createError('Failed to create event', 'CALENDAR_ERROR');
      }
      
      return this.applyEventColors(result);
    } catch (error) {
      console.error('[CalendarService] Error creating event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Update an existing calendar event
   */
  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent> {
    try {
      console.log('[CalendarService] Updating event:', event);
      
      if (!event.id) {
        throw CalendarErrorHandler.createError('Event ID is required for update', 'INVALID_PARAMS');
      }
      
      // Ensure the timezone is valid
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Determine event type and call appropriate service
      const eventType = event.extendedProps?.eventType || event.type;
      
      if (event.extendedProps?.clinicianId) {
        event.extendedProps.clinicianId = formatAsUUID(event.extendedProps.clinicianId, { logLevel: 'warn' });
      }
      
      let result: CalendarEvent | null;
      
      switch (eventType) {
        case 'appointment':
          result = await AppointmentService.updateAppointment(event, validTimeZone);
          break;
        case 'availability':
          result = await AvailabilityService.updateAvailability(event, validTimeZone);
          break;
        case 'time_off':
          result = await TimeOffService.updateTimeOff(event, validTimeZone);
          break;
        default:
          throw CalendarErrorHandler.createError(`Unknown event type: ${eventType}`, 'INVALID_EVENT_TYPE');
      }
      
      if (!result) {
        throw CalendarErrorHandler.createError('Failed to update event', 'CALENDAR_ERROR');
      }
      
      return this.applyEventColors(result);
    } catch (error) {
      console.error('[CalendarService] Error updating event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Delete a calendar event
   */
  static async deleteEvent(eventId: string, eventType: CalendarEventType): Promise<boolean> {
    try {
      console.log('[CalendarService] Deleting event:', { eventId, eventType });
      
      if (!eventId) {
        throw CalendarErrorHandler.createError('Event ID is required for delete', 'INVALID_PARAMS');
      }
      
      let result: boolean;
      
      switch (eventType) {
        case 'appointment':
          result = await AppointmentService.deleteAppointment(eventId);
          break;
        case 'availability':
          result = await AvailabilityService.deleteAvailability(eventId);
          break;
        case 'time_off':
          result = await TimeOffService.deleteTimeOff(eventId);
          break;
        default:
          throw CalendarErrorHandler.createError(`Unknown event type: ${eventType}`, 'INVALID_EVENT_TYPE');
      }
      
      return result;
    } catch (error) {
      console.error('[CalendarService] Error deleting event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get a single event by ID
   */
  static async getEvent(eventId: string, eventType: CalendarEventType, timezone: string): Promise<CalendarEvent> {
    try {
      console.log('[CalendarService] Getting event:', { eventId, eventType });
      
      if (!eventId) {
        throw CalendarErrorHandler.createError('Event ID is required', 'INVALID_PARAMS');
      }
      
      // Ensure valid timezone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      let result: CalendarEvent | null;
      
      switch (eventType) {
        case 'appointment':
          result = await AppointmentService.getAppointmentById(eventId, validTimeZone);
          break;
        case 'availability':
          result = await AvailabilityService.getAvailabilityById(eventId, validTimeZone);
          break;
        case 'time_off':
          result = await TimeOffService.getTimeOffById(eventId, validTimeZone);
          break;
        default:
          throw CalendarErrorHandler.createError(`Unknown event type: ${eventType}`, 'INVALID_EVENT_TYPE');
      }
      
      if (!result) {
        throw CalendarErrorHandler.createError(`Event not found: ${eventId}`, 'EVENT_NOT_FOUND');
      }
      
      return this.applyEventColors(result);
    } catch (error) {
      console.error('[CalendarService] Error getting event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Determine event color based on type
   */
  static getEventColor(eventType: CalendarEventType, status?: string): { backgroundColor: string, borderColor: string, textColor: string } {
    let backgroundColor: string;
    let borderColor: string;
    let textColor = '#ffffff';
    
    // Handle cancelled events
    if (status === 'cancelled') {
      backgroundColor = '#f87171';  // Red
      borderColor = '#ef4444';  // Darker red
      return { backgroundColor, borderColor, textColor };
    }
    
    switch (eventType) {
      case 'appointment':
        backgroundColor = '#4f46e5';  // Indigo
        borderColor = '#4338ca';  // Darker indigo
        break;
      case 'availability':
        backgroundColor = '#10b981';  // Green
        borderColor = '#059669';  // Darker green
        textColor = '#ffffff';
        break;
      case 'time_off':
        backgroundColor = '#f59e0b';  // Amber
        borderColor = '#d97706';  // Darker amber
        break;
      default:
        backgroundColor = '#6b7280';  // Gray
        borderColor = '#4b5563';  // Darker gray
    }
    
    return { backgroundColor, borderColor, textColor };
  }
  
  /**
   * Apply event colors based on type
   */
  static applyEventColors(event: CalendarEvent): CalendarEvent {
    const eventType = event.extendedProps?.eventType as CalendarEventType || 'general';
    const status = event.extendedProps?.status;
    
    const colors = this.getEventColor(eventType, status);
    
    event.backgroundColor = colors.backgroundColor;
    event.borderColor = colors.borderColor;
    event.textColor = colors.textColor;
    
    return event;
  }
}

export default CalendarService;
