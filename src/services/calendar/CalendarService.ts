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
  id: string; // Changed from optional to required
  clinician_id: string;
  start_time: string;
  end_time: string;
  availability_type?: string;
  time_zone?: string;
  all_day?: boolean; // Added all_day property
  // Add other required properties
}

// Define Appointment interface if needed
interface Appointment {
  id: string; // Changed from optional to required
  clinician_id: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  title?: string;
  client_name?: string;
  all_day?: boolean;
  appointment_type?: string;
  time_zone?: string;
  // Add other required properties
}

// Define TimeOff interface if needed
interface TimeOff {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone?: string;
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
      const events: CalendarEvent[] = availabilityBlocks.map(block => this.convertAvailabilityToCalendarEvent(block, timezone));
      
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
      const events: CalendarEvent[] = appointments.map(appt => this.convertAppointmentToCalendarEvent(appt, timezone));
      
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
        clientName: appt.client_name,
        allDay: appt.all_day || false,
        appointmentType: appt.appointment_type,
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
      title: block.availability_type || 'Available',
      start: new Date(block.start_time),
      end: new Date(block.end_time),
      extendedProps: {
        clinicianId: block.clinician_id,
        eventType: 'availability',
        allDay: block.all_day || false,
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
      title: 'Time Off',
      start: new Date(timeOff.start_time),
      end: new Date(timeOff.end_time),
      extendedProps: {
        clinicianId: timeOff.clinician_id,
        eventType: 'time_off',
        sourceTimeZone: timeOff.time_zone || timezone
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
        case 'appointment': {
          const appointmentData = this.prepareAppointmentData(event, validTimeZone);
          result = await AppointmentService.createAppointment(event.id, { 
            ...appointmentData,
            time_zone: validTimeZone
          });
          break;
        }
        case 'availability': {
          const availabilityData = this.prepareAvailabilityData(event, validTimeZone);
          result = await AvailabilityService.createAvailability(event.id, { 
            ...availabilityData,
            time_zone: validTimeZone
          });
          break;
        }
        case 'time_off': {
          const timeOffData = this.prepareTimeOffData(event, validTimeZone);
          result = await TimeOffService.createTimeOff(event.id, { 
            ...timeOffData,
            time_zone: validTimeZone
          });
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
  static prepareAppointmentData(event: CalendarEvent, timezone: string): any {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const appointmentData = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      client_id: event.extendedProps?.clientId,
      title: event.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      all_day: event.allDay || false,
      appointment_type: event.extendedProps?.appointmentType,
      time_zone: timezone
    };
    
    return appointmentData;
  }
  
  /**
   * Prepare availability data for saving
   */
  static prepareAvailabilityData(event: CalendarEvent, timezone: string): any {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const availabilityData = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      all_day: event.allDay || false,
      availability_type: event.title,
      time_zone: timezone
    };
    
    return availabilityData;
  }
  
  /**
   * Prepare time off data for saving
   */
  static prepareTimeOffData(event: CalendarEvent, timezone: string): any {
    // Ensure we have valid dates
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    const timeOffData = {
      id: event.id,
      clinician_id: event.extendedProps?.clinicianId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: event.title,
      all_day: event.allDay || false,
      time_zone: timezone
    };
    
    return timeOffData;
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
    const eventType = event.extendedProps?.eventType || event.type || 'general';
    let backgroundColor = '#6b7280'; // Default gray
    
    switch (eventType) {
      case 'appointment':
        backgroundColor = '#4f46e5'; // Indigo
        break;
      case 'availability':
        backgroundColor = '#10b981'; // Green
        break;
      case 'time_off':
        backgroundColor = '#f59e0b'; // Amber
        break;
    }
    
    return {
      ...event,
      backgroundColor,
      borderColor: backgroundColor,
      textColor: '#ffffff'
    };
  }
  
  /**
   * Generate mock calendar events for testing
   */
  static generateMockEvents(clinicianId: string, timezone: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Generate some mock appointments
    for (let i = 0; i < 3; i++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(today.getDate() + i + 1);
      appointmentDate.setHours(10 + i, 0, 0);
      
      const appointmentEnd = new Date(appointmentDate);
      appointmentEnd.setHours(appointmentEnd.getHours() + 1);
      
      const mockAppointment = {
        id: `mock-appt-${i}`,
        title: `Mock Appointment ${i + 1}`,
        start_time: appointmentDate.toISOString(),
        end_time: appointmentEnd.toISOString(),
        client_name: `Test Client ${i + 1}`,
        client_id: `client-${i}`,
        clinician_id: clinicianId,
        time_zone: timezone
      };
      
      events.push(this.convertAppointmentToCalendarEvent(mockAppointment, timezone));
    }
    
    // Generate some mock availability blocks
    for (let day = 0; day < 7; day++) {
      const availabilityDate = new Date();
      availabilityDate.setDate(today.getDate() - currentDay + day);
      availabilityDate.setHours(9, 0, 0);
      
      const availabilityEnd = new Date(availabilityDate);
      availabilityEnd.setHours(17, 0, 0);
      
      const mockAvailability = {
        id: `mock-avail-${day}`,
        clinician_id: clinicianId,
        start_time: availabilityDate.toISOString(),
        end_time: availabilityEnd.toISOString(),
        availability_type: 'Regular Hours',
        all_day: false,
        time_zone: timezone
      };
      
      events.push(this.convertAvailabilityToCalendarEvent(mockAvailability, timezone));
    }
    
    // Generate a mock time off event
    const timeOffDate = new Date();
    timeOffDate.setDate(today.getDate() + 7);
    timeOffDate.setHours(0, 0, 0);
    
    const timeOffEnd = new Date(timeOffDate);
    timeOffEnd.setDate(timeOffEnd.getDate() + 1);
    
    const mockTimeOff = {
      id: 'mock-timeoff-1',
      clinician_id: clinicianId,
      start_time: timeOffDate.toISOString(),
      end_time: timeOffEnd.toISOString(),
      time_zone: timezone
    };
    
    events.push(this.convertTimeOffToCalendarEvent(mockTimeOff, timezone));
    
    // Apply colors and return
    return events.map(event => this.applyEventColors(event));
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
          result = await AppointmentService.updateAppointment(
            event.id, 
            { 
              ...event, 
              time_zone: validTimeZone,
              appointmentData: this.prepareAppointmentData(event, validTimeZone)
            }
          );
          break;
        case 'availability':
          result = await AvailabilityService.updateAvailability(
            event.id, 
            { 
              ...event, 
              time_zone: validTimeZone,
              availabilityData: this.prepareAvailabilityData(event, validTimeZone)
            }
          );
          break;
        case 'time_off':
          result = await TimeOffService.updateTimeOff(
            event.id, 
            { 
              ...event, 
              time_zone: validTimeZone,
              timeOffData: this.prepareTimeOffData(event, validTimeZone)
            }
          );
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
          const appointment = await AppointmentService.getAppointmentById(eventId);
          result = this.convertAppointmentToCalendarEvent(appointment, validTimeZone);
          break;
        case 'availability':
          const availability = await AvailabilityService.getAvailabilityById(eventId);
          result = this.convertAvailabilityToCalendarEvent(availability, validTimeZone);
          break;
        case 'time_off':
          const timeOff = await TimeOffService.getTimeOffById(eventId);
          result = this.convertTimeOffToCalendarEvent(timeOff, validTimeZone);
          break;
        default:
          throw CalendarErrorHandler.createError(`Unknown event type: ${eventType}`, 'INVALID_EVENT_TYPE');
      }
      
      if (!result) {
        throw CalendarErrorHandler.createError(`Event not found: ${eventId}`, 'NOT_FOUND');
      }
      
      return this.applyEventColors(result);
    } catch (error) {
      console.error('[CalendarService] Error getting event:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Create a calendar event from raw data
   */
  static createEventFromData(data: any, type: string): CalendarEvent {
    switch (type) {
      case 'appointment':
        return this.appointmentToCalendarEvent(data);
      case 'availability':
        return this.availabilityBlockToCalendarEvent(data);
      case 'time_off':
        return this.timeOffToCalendarEvent(data);
      default:
        throw new Error(`Unsupported event type: ${type}`);
    }
  }
  
  /**
   * Update an appointment
   */
  static async updateAppointment(appointmentId: string, updates: Partial<Appointment>, timeZone?: string): Promise<CalendarEvent> {
    const updatedData = {
      ...updates,
      time_zone: timeZone || updates.time_zone
    };
    
    // In a real implementation, we would update the database here
    const mockAppointment = { ...this.getMockAppointment(appointmentId), ...updatedData };
    return this.appointmentToCalendarEvent(mockAppointment);
  }
  
  /**
   * Update an availability block
   */
  static async updateAvailabilityBlock(blockId: string, updates: Partial<AvailabilityBlock>, timeZone?: string): Promise<CalendarEvent> {
    const updatedData = {
      ...updates,
      time_zone: timeZone || updates.time_zone
    };
    
    // In a real implementation, we would update the database here
    const mockBlock = { ...this.getMockAvailabilityBlock(blockId), ...updatedData };
    return this.availabilityBlockToCalendarEvent(mockBlock);
  }
  
  /**
   * Update a time off
   */
  static async updateTimeOff(timeOffId: string, updates: Partial<{ start_time: string; end_time: string; reason: string; all_day: boolean; time_zone: string; clinician_id: string; }>, timeZone?: string): Promise<CalendarEvent> {
    const updatedData = {
      ...updates,
      time_zone: timeZone || updates.time_zone
    };
    
    // In a real implementation, we would update the database here
    const mockTimeOff = { ...this.getMockTimeOff(timeOffId), ...updatedData };
    return this.timeOffToCalendarEvent(mockTimeOff);
  }
}

export default CalendarService;
