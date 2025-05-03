import { DateTime } from 'luxon';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarError, CalendarErrorHandler } from './CalendarErrorHandler';
import { AppointmentService } from './AppointmentService';
import { AvailabilityService } from './AvailabilityService';
import { TimeOffService } from './TimeOffService';
import { formatAsUUID, ensureUUID } from '@/utils/validation/uuidUtils';

// Define AvailabilityBlock interface with required id property
interface AvailabilityBlock {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  availability_type?: "recurring" | "single";
  time_zone?: string;
  allDay?: boolean;
  all_day?: boolean;
  title?: string;
}

// Define Appointment interface with required id property
interface Appointment {
  id: string;
  clinician_id: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  title?: string;
  clientName?: string;
  client_name?: string;
  allDay?: boolean;
  all_day?: boolean;
  appointmentType?: string;
  appointment_type?: string;
  time_zone?: string;
}

// Define TimeOff interface with required properties
interface TimeOff {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone?: string;
  reason?: string;
  allDay?: boolean;
  all_day?: boolean;
  title?: string;
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
      
      console.log('[CalendarService] Converting availability blocks to events:', availabilityBlocks);
      
      // Convert each availability block to a calendar event
      const events: CalendarEvent[] = availabilityBlocks.map(block => {
        // Ensure block has required id property
        const validBlock: AvailabilityBlock = {
          id: block.id || `temp-${new Date().getTime()}`,
          clinician_id: block.clinician_id,
          start_time: block.start_time,
          end_time: block.end_time,
          availability_type: block.availability_type,
          time_zone: block.time_zone,
          allDay: block.allDay || block.all_day,
          title: block.title
        };
        return this.convertAvailabilityToCalendarEvent(validBlock, timezone);
      });
      
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
      
      console.log('[CalendarService] Converting appointments to events:', appointments);
      
      // Convert each appointment to a calendar event
      const events: CalendarEvent[] = appointments.map(appt => {
        // Ensure appointment has required id property
        const validAppointment: Appointment = {
          id: appt.id || `temp-${new Date().getTime()}`,
          clinician_id: appt.clinician_id,
          client_id: appt.client_id,
          start_time: appt.start_time,
          end_time: appt.end_time,
          title: appt.title,
          clientName: appt.clientName || appt.client_name,
          allDay: appt.allDay || appt.all_day,
          appointmentType: appt.appointmentType || appt.appointment_type,
          time_zone: appt.time_zone
        };
        return this.convertAppointmentToCalendarEvent(validAppointment, timezone);
      });
      
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
   * Convert an Appointment to CalendarEvent
   */
  static convertAppointmentToCalendarEvent(appt: Appointment, timezone: string): CalendarEvent {
    return {
      id: appt.id,
      title: appt.title || 'Appointment',
      start: new Date(appt.start_time),
      end: new Date(appt.end_time),
      extendedProps: {
        clinicianId: appt.clinician_id,
        clientId: appt.client_id,
        eventType: 'appointment',
        clientName: appt.clientName || appt.client_name,
        allDay: appt.allDay || appt.all_day || false,
        appointmentType: appt.appointmentType || appt.appointment_type,
        sourceTimeZone: appt.time_zone || timezone
      }
    };
  }
  
  /**
   * Convert an AvailabilityBlock to CalendarEvent
   */
  static convertAvailabilityToCalendarEvent(block: AvailabilityBlock, timezone: string): CalendarEvent {
    return {
      id: block.id,
      title: block.title || block.availability_type || 'Available',
      start: new Date(block.start_time),
      end: new Date(block.end_time),
      extendedProps: {
        clinicianId: block.clinician_id,
        eventType: 'availability',
        allDay: block.allDay || block.all_day || false,
        sourceTimeZone: block.time_zone || timezone
      }
    };
  }
  
  /**
   * Convert a TimeOff to CalendarEvent
   */
  static convertTimeOffToCalendarEvent(timeOff: TimeOff, timezone: string): CalendarEvent {
    return {
      id: timeOff.id,
      title: timeOff.title || timeOff.reason || 'Time Off',
      start: new Date(timeOff.start_time),
      end: new Date(timeOff.end_time),
      extendedProps: {
        clinicianId: timeOff.clinician_id,
        eventType: 'time_off',
        sourceTimeZone: timeOff.time_zone || timezone,
        allDay: timeOff.allDay || timeOff.all_day || false
      }
    };
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
      const timeOffEvents = await TimeOffService.getTimeOff(clinicianId, timezone, startDate, endDate);
      
      console.log('[CalendarService] Converting time off to events:', timeOffEvents);
      
      // Map raw time off events to calendar events
      const events: CalendarEvent[] = timeOffEvents.map(event => {
        // If it's already a CalendarEvent, just apply colors
        if (event.title && event.start && event.end) {
          return this.applyEventColors(event as CalendarEvent);
        }
        
        // Otherwise, convert from TimeOff type
        const timeOff: TimeOff = {
          id: event.id || `temp-${new Date().getTime()}`,
          clinician_id: event.clinician_id || clinicianId,
          start_time: event.start_time || (typeof event.start === 'string' ? event.start : event.start?.toISOString()),
          end_time: event.end_time || (typeof event.end === 'string' ? event.end : event.end?.toISOString()),
          reason: event.reason || event.title,
          allDay: event.allDay || event.all_day,
          time_zone: event.time_zone || timezone
        };
        
        return this.applyEventColors(this.convertTimeOffToCalendarEvent(timeOff, timezone));
      });
      
      return events;
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
        case 'appointment': {
          const appointmentData = this.prepareAppointmentData(event, validTimeZone);
          result = await AppointmentService.createAppointment(appointmentData);
          break;
        }
        case 'availability': {
          const availabilityData = this.prepareAvailabilityData(event, validTimeZone);
          result = await AvailabilityService.createAvailability(availabilityData);
          break;
        }
        case 'time_off': {
          const timeOffData = this.prepareTimeOffData(event, validTimeZone);
          result = await TimeOffService.createTimeOff(timeOffData);
          break;
        }
        default:
          throw CalendarErrorHandler.formatError(
            new Error(`Unsupported event type: ${eventType}`)
          );
      }
      
      if (!result) {
        throw CalendarErrorHandler.formatError(
          new Error('Failed to create event, service returned null')
        );
      }
      
      return result;
    } catch (error) {
      console.error('[CalendarService] Error creating event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Prepare appointment data for saving
   */
  static prepareAppointmentData(event: CalendarEvent, timezone: string): Partial<Appointment> {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const appointmentData: Partial<Appointment> = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      client_id: event.extendedProps?.clientId,
      title: event.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      allDay: event.allDay || false,
      appointmentType: event.extendedProps?.appointmentType,
      time_zone: timezone
    };
    
    return appointmentData;
  }
  
  /**
   * Prepare availability data for saving
   */
  static prepareAvailabilityData(event: CalendarEvent, timezone: string): Partial<AvailabilityBlock> {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const availabilityData: Partial<AvailabilityBlock> = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      allDay: event.allDay || false,
      availability_type: "single", // Default to single availability
      time_zone: timezone
    };
    
    return availabilityData;
  }
  
  /**
   * Prepare time off data for saving
   */
  static prepareTimeOffData(event: CalendarEvent, timezone: string): Partial<TimeOff> {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const timeOffData: Partial<TimeOff> = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: event.title,
      allDay: event.allDay || false,
      time_zone: timezone
    };
    
    return timeOffData;
  }
  
  /**
   * Update an existing calendar event
   */
  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent> {
    try {
      console.log('[CalendarService] Updating event:', event);
      
      if (!event.id) {
        throw CalendarErrorHandler.formatError(
          new Error('Event ID is required for updates')
        );
      }
      
      // Ensure the timezone is valid
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Determine event type and call appropriate service
      const eventType = event.extendedProps?.eventType || event.type;
      
      let result: CalendarEvent | null;
      
      switch (eventType) {
        case 'appointment': {
          const appointmentData = this.prepareAppointmentData(event, validTimeZone);
          result = await AppointmentService.updateAppointment(event.id, appointmentData);
          break;
        }
        case 'availability': {
          const availabilityData = this.prepareAvailabilityData(event, validTimeZone);
          result = await AvailabilityService.updateAvailability(event.id, availabilityData);
          break;
        }
        case 'time_off': {
          const timeOffData = this.prepareTimeOffData(event, validTimeZone);
          result = await TimeOffService.updateTimeOff(event.id, timeOffData);
          break;
        }
        default:
          throw CalendarErrorHandler.formatError(
            new Error(`Unsupported event type: ${eventType}`)
          );
      }
      
      if (!result) {
        throw CalendarErrorHandler.formatError(
          new Error('Failed to update event, service returned null')
        );
      }
      
      return result;
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
        throw CalendarErrorHandler.formatError(
          new Error('Event ID is required for deletion')
        );
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
          throw CalendarErrorHandler.formatError(
            new Error(`Unsupported event type: ${eventType}`)
          );
      }
      
      if (!result) {
        console.warn(`[CalendarService] Delete operation for ${eventType} with ID ${eventId} returned false`);
      }
      
      return result;
    } catch (error) {
      console.error('[CalendarService] Error deleting event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Apply event colors based on event type
   */
  static applyEventColors(event: CalendarEvent): CalendarEvent {
    // Add default styles based on the event type
    const eventType = event.extendedProps?.eventType || '';
    
    // Create a clone of the event to avoid modifying the original
    const styledEvent: CalendarEvent = { ...event };
    
    switch (eventType) {
      case 'appointment':
        styledEvent.backgroundColor = '#4f46e5'; // Indigo
        styledEvent.textColor = '#ffffff';
        styledEvent.borderColor = '#4338ca';
        break;
      case 'availability':
        styledEvent.backgroundColor = '#22c55e'; // Green
        styledEvent.textColor = '#ffffff';
        styledEvent.borderColor = '#16a34a';
        break;
      case 'time_off':
        styledEvent.backgroundColor = '#ef4444'; // Red
        styledEvent.textColor = '#ffffff';
        styledEvent.borderColor = '#dc2626';
        break;
      default:
        styledEvent.backgroundColor = '#6b7280'; // Gray
        styledEvent.textColor = '#ffffff';
        styledEvent.borderColor = '#4b5563';
    }
    
    return styledEvent;
  }
  
  /**
   * Get mock data for testing
   */
  static getMockEvents(count: number = 10): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    // Generate mock events of different types
    for (let i = 0; i < count; i++) {
      const eventType = i % 3 === 0 ? 'appointment' : i % 3 === 1 ? 'availability' : 'time_off';
      
      if (eventType === 'appointment') {
        const mockAppointment = this.getMockAppointment();
        events.push(this.convertAppointmentToCalendarEvent(mockAppointment, 'UTC'));
      } else if (eventType === 'availability') {
        const mockAvailability = this.getMockAvailabilityBlock();
        events.push(this.convertAvailabilityToCalendarEvent(mockAvailability, 'UTC'));
      } else {
        const mockTimeOff = this.getMockTimeOff();
        events.push(this.convertTimeOffToCalendarEvent(mockTimeOff, 'UTC'));
      }
    }
    
    return events.map(event => this.applyEventColors(event));
  }
  
  /**
   * Generate a mock appointment
   */
  static getMockAppointment(): Appointment {
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 48));
    startTime.setMinutes(0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    return {
      id: `appt-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
      clinician_id: 'mock-clinician-id',
      client_id: 'mock-client-id',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      title: 'Mock Appointment',
      clientName: 'Mock Client',
      allDay: false,
      appointmentType: 'Initial Consultation',
      time_zone: 'UTC'
    };
  }
  
  /**
   * Generate a mock availability block
   */
  static getMockAvailabilityBlock(): AvailabilityBlock {
    const now = new Date();
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 7));
    startTime.setHours(9);
    startTime.setMinutes(0);
    
    const endTime = new Date(startTime);
    endTime.setHours(17);
    endTime.setMinutes(0);
    
    return {
      id: `avail-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
      clinician_id: 'mock-clinician-id',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      availability_type: 'Standard Hours',
      time_zone: 'UTC',
      allDay: false
    };
  }
  
  /**
   * Generate mock time off
   */
  static getMockTimeOff(): TimeOff {
    const now = new Date();
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 14) + 7);
    startTime.setHours(0);
    startTime.setMinutes(0);
    
    const endTime = new Date(startTime);
    endTime.setHours(23);
    endTime.setMinutes(59);
    
    return {
      id: `timeoff-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
      clinician_id: 'mock-clinician-id',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      reason: 'Vacation Day',
      time_zone: 'UTC',
      allDay: true
    };
  }
}

export default CalendarService;
