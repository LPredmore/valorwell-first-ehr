import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from './TimeZoneService';
import { AvailabilityService } from './AvailabilityService';
import { AppointmentService } from './AppointmentService';
import { TimeOffService } from './TimeOffService';
import { RecurrenceService } from './RecurrenceService';
import { CalendarError } from './CalendarErrorHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * CalendarService
 * 
 * A facade service that provides a unified interface to the calendar system.
 * This service delegates to specialized services for specific event types.
 */
export class CalendarService {
  /**
   * Gets all calendar events for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the events in
   * @param startDate - The start date of the range to get events for (optional)
   * @param endDate - The end date of the range to get events for (optional)
   * @returns An array of calendar events
   */
  static async getEvents(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Use the unified_calendar_view to get all events in one query
      const { data, error } = await supabase
        .from('unified_calendar_view')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (error) {
        throw new CalendarError(
          'Failed to get calendar events from unified view',
          'CALENDAR_DB_ERROR',
          { clinicianId, timeZone, startDate, endDate, error }
        );
      }
      
      // Filter by date range if provided
      let filteredData = data || [];
      if (startDate && endDate) {
        const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
        
        filteredData = filteredData.filter(event => {
          const eventEnd = new Date(event.end_time);
          const eventStart = new Date(event.start_time);
          return eventStart <= endDateObj && eventEnd >= startDateObj;
        });
      }
      
      // Convert to calendar events based on event_type
      return filteredData.map(event => {
        switch (event.event_type) {
          case 'availability':
            return this.convertToCalendarEvent(event, validTimeZone, 'availability');
          case 'appointment':
            return this.convertToCalendarEvent(event, validTimeZone, 'appointment');
          case 'time_off':
            return this.convertToCalendarEvent(event, validTimeZone, 'time_off');
          default:
            console.warn(`Unknown event type: ${event.event_type}`);
            return this.convertToCalendarEvent(event, validTimeZone, 'general');
        }
      });
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get calendar events',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets availability events for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the events in
   * @param startDate - The start date of the range to get events for (optional)
   * @param endDate - The end date of the range to get events for (optional)
   * @returns An array of calendar events
   */
  static async getAvailabilityEvents(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Get availability blocks
      const availabilityBlocks = await AvailabilityService.getAvailability(
        clinicianId,
        validTimeZone,
        startDate,
        endDate
      );
      
      // Convert to calendar events
      return availabilityBlocks.map(block => 
        AvailabilityService.toCalendarEvent(block, validTimeZone)
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get availability events',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets appointment events for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the events in
   * @param startDate - The start date of the range to get events for (optional)
   * @param endDate - The end date of the range to get events for (optional)
   * @returns An array of calendar events
   */
  static async getAppointmentEvents(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Get appointments
      const appointments = await AppointmentService.getAppointments(
        clinicianId,
        validTimeZone,
        startDate,
        endDate
      );
      
      // Convert to calendar events
      return appointments.map(appointment => 
        AppointmentService.toCalendarEvent(appointment, validTimeZone)
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get appointment events',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets time off events for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the events in
   * @param startDate - The start date of the range to get events for (optional)
   * @param endDate - The end date of the range to get events for (optional)
   * @returns An array of calendar events
   */
  static async getTimeOffEvents(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Get time off periods
      const timeOffPeriods = await TimeOffService.getTimeOff(
        clinicianId,
        validTimeZone,
        startDate,
        endDate
      );
      
      // Convert to calendar events
      return timeOffPeriods.map(timeOff => 
        TimeOffService.toCalendarEvent(timeOff, validTimeZone)
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get time off events',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a new calendar event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @returns The created calendar event
   */
  static async createEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      const eventType = event.extendedProps?.eventType as CalendarEventType || 'general';
      
      switch (eventType) {
        case 'availability':
          return await this.createAvailabilityEvent(event, validTimeZone);
        case 'appointment':
          return await this.createAppointmentEvent(event, validTimeZone);
        case 'time_off':
          return await this.createTimeOffEvent(event, validTimeZone);
        default:
          throw new CalendarError(
            `Unsupported event type: ${eventType}`,
            'CALENDAR_VALIDATION_ERROR',
            { event, timeZone: validTimeZone }
          );
      }
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create calendar event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a new availability event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @returns The created calendar event
   */
  private static async createAvailabilityEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      const clinicianId = event.extendedProps?.clinicianId || event.clinician_id;
      
      if (!clinicianId) {
        throw new CalendarError(
          'Clinician ID is required for availability events',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      const isRecurring = event.extendedProps?.isRecurring || false;
      let rrule: string | undefined;
      
      // Get the recurrence rule from the event
      if (event.extendedProps?.recurrenceId) {
        try {
          rrule = await RecurrenceService.getRecurrencePattern(event.extendedProps.recurrenceId);
        } catch (error) {
          console.error('Failed to get recurrence pattern:', error);
        }
      }
      
      if (isRecurring && !rrule) {
        throw new CalendarError(
          'Recurrence rule is required for recurring availability',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone, isRecurring }
        );
      }
      
      // Create availability block
      const availabilityBlock = await AvailabilityService.createAvailability(
        clinicianId,
        event.start,
        event.end,
        timeZone,
        isRecurring,
        rrule
      );
      
      // Convert back to calendar event
      return AvailabilityService.toCalendarEvent(availabilityBlock, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create availability event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a new appointment event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @returns The created calendar event
   */
  private static async createAppointmentEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      const clinicianId = event.extendedProps?.clinicianId || event.clinician_id;
      const clientId = event.extendedProps?.clientId;
      
      if (!clinicianId) {
        throw new CalendarError(
          'Clinician ID is required for appointment events',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      if (!clientId) {
        throw new CalendarError(
          'Client ID is required for appointment events',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      // Create appointment
      const appointment = await AppointmentService.createAppointment(
        clientId,
        clinicianId,
        event.start,
        event.end,
        event.title,
        timeZone,
        event.extendedProps?.description,
        event.extendedProps?.status
      );
      
      // Convert back to calendar event
      return AppointmentService.toCalendarEvent(appointment, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create appointment event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a new time off event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @returns The created calendar event
   */
  private static async createTimeOffEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      const clinicianId = event.extendedProps?.clinicianId || event.clinician_id;
      
      if (!clinicianId) {
        throw new CalendarError(
          'Clinician ID is required for time off events',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      // Create time off period
      const timeOff = await TimeOffService.createTimeOff(
        clinicianId,
        event.start,
        event.end,
        timeZone,
        event.title !== 'Time Off' ? event.title : undefined,
        event.allDay || false
      );
      
      // Convert back to calendar event
      return TimeOffService.toCalendarEvent(timeOff, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create time off event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Updates an existing calendar event
   * 
   * @param event - The calendar event to update
   * @param timeZone - The timezone of the event
   * @returns The updated calendar event
   */
  static async updateEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      if (!event.id) {
        throw new CalendarError(
          'Event ID is required for update',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      const eventType = event.extendedProps?.eventType as CalendarEventType || 'general';
      
      switch (eventType) {
        case 'availability':
          return await this.updateAvailabilityEvent(event, validTimeZone);
        case 'appointment':
          return await this.updateAppointmentEvent(event, validTimeZone);
        case 'time_off':
          return await this.updateTimeOffEvent(event, validTimeZone);
        default:
          throw new CalendarError(
            `Unsupported event type: ${eventType}`,
            'CALENDAR_VALIDATION_ERROR',
            { event, timeZone: validTimeZone }
          );
      }
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update calendar event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Updates an existing availability event
   * 
   * @param event - The calendar event to update
   * @param timeZone - The timezone of the event
   * @returns The updated calendar event
   */
  private static async updateAvailabilityEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      if (!event.id) {
        throw new CalendarError(
          'Event ID is required for update',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      // Prepare updates
      const updates: any = {
        time_zone: timeZone
      };
      
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
      
      if (event.extendedProps?.isActive !== undefined) {
        updates.is_active = event.extendedProps.isActive;
      }
      
      // Update availability block
      const availabilityBlock = await AvailabilityService.updateAvailability(
        event.id,
        updates
      );
      
      // Convert back to calendar event
      return AvailabilityService.toCalendarEvent(availabilityBlock, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update availability event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Updates an existing appointment event
   * 
   * @param event - The calendar event to update
   * @param timeZone - The timezone of the event
   * @returns The updated calendar event
   */
  private static async updateAppointmentEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      if (!event.id) {
        throw new CalendarError(
          'Event ID is required for update',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      // Prepare updates
      const updates: any = {
        time_zone: timeZone
      };
      
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
      
      if (event.extendedProps?.status) {
        updates.status = event.extendedProps.status;
      }
      
      if (event.extendedProps?.description) {
        updates.notes = event.extendedProps.description;
      }
      
      // Update appointment
      const appointment = await AppointmentService.updateAppointment(
        event.id,
        updates
      );
      
      // Convert back to calendar event
      return AppointmentService.toCalendarEvent(appointment, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update appointment event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Updates an existing time off event
   * 
   * @param event - The calendar event to update
   * @param timeZone - The timezone of the event
   * @returns The updated calendar event
   */
  private static async updateTimeOffEvent(
    event: CalendarEvent,
    timeZone: string
  ): Promise<CalendarEvent> {
    try {
      if (!event.id) {
        throw new CalendarError(
          'Event ID is required for update',
          'CALENDAR_VALIDATION_ERROR',
          { event, timeZone }
        );
      }
      
      // Prepare updates
      const updates: any = {
        time_zone: timeZone
      };
      
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
      
      if (event.title && event.title !== 'Time Off') {
        updates.reason = event.title;
      }
      
      if (event.allDay !== undefined) {
        updates.all_day = event.allDay;
      }
      
      // Update time off period
      const timeOff = await TimeOffService.updateTimeOff(
        event.id,
        updates
      );
      
      // Convert back to calendar event
      return TimeOffService.toCalendarEvent(timeOff, timeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update time off event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Deletes a calendar event
   * 
   * @param eventId - The ID of the event to delete
   * @param eventType - The type of the event
   * @returns True if the deletion was successful
   */
  static async deleteEvent(
    eventId: string,
    eventType: CalendarEventType
  ): Promise<boolean> {
    try {
      switch (eventType) {
        case 'availability':
          return await AvailabilityService.deleteAvailability(eventId);
        case 'appointment':
          return await AppointmentService.deleteAppointment(eventId);
        case 'time_off':
          return await TimeOffService.deleteTimeOff(eventId);
        default:
          throw new CalendarError(
            `Unsupported event type: ${eventType}`,
            'CALENDAR_VALIDATION_ERROR',
            { eventId, eventType }
          );
      }
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to delete calendar event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          eventId, 
          eventType, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates a recurring event
   * 
   * @param event - The calendar event to create
   * @param timeZone - The timezone of the event
   * @param frequency - The frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
   * @param interval - The interval (e.g., every 2 weeks)
   * @param count - The number of occurrences (optional)
   * @param endDate - The end date (optional)
   * @param byDay - The days of the week (e.g., ['MO', 'WE', 'FR']) (optional)
   * @returns The created calendar event
   */
  static async createRecurringEvent(
    event: CalendarEvent,
    timeZone: string,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    interval: number,
    count?: number,
    endDate?: Date | string,
    byDay?: string[]
  ): Promise<CalendarEvent> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Create RRule
      const rrule = RecurrenceService.createRRule(
        frequency,
        interval,
        event.start,
        endDate,
        count,
        byDay,
        undefined,
        undefined,
        validTimeZone
      );
      
      // Set recurrence properties
      event.extendedProps = {
        ...event.extendedProps,
        isRecurring: true
      };
      
      // Store the rrule for later use
      const recurrencePatternId = await RecurrenceService.createRecurrencePattern(rrule);
      if (event.extendedProps) {
        event.extendedProps.recurrenceId = recurrencePatternId;
      }
      
      // Create the event
      return await this.createEvent(event, validTimeZone);
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create recurring event',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          event, 
          timeZone, 
          frequency, 
          interval, 
          count, 
          endDate, 
          byDay, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates an exception for a recurring event
   * 
   * @param eventId - The ID of the recurring event
   * @param exceptionDate - The date of the exception
   * @param isCancelled - Whether the occurrence is cancelled
   * @param replacementEvent - The replacement event (optional)
   * @returns The ID of the created exception
   */
  static async createRecurrenceException(
    eventId: string,
    exceptionDate: Date | string,
    isCancelled: boolean = true,
    replacementEvent?: CalendarEvent
  ): Promise<string> {
    try {
      // Only availability blocks support exceptions in this implementation
      return await AvailabilityService.createException(
        eventId,
        exceptionDate,
        isCancelled,
        replacementEvent ? {
          clinician_id: replacementEvent.extendedProps?.clinicianId || replacementEvent.clinician_id || '',
          start_time: typeof replacementEvent.start === 'string' 
            ? replacementEvent.start 
            : replacementEvent.start.toISOString(),
          end_time: typeof replacementEvent.end === 'string' 
            ? replacementEvent.end 
            : replacementEvent.end.toISOString(),
          time_zone: replacementEvent.extendedProps?.timezone || 
                    replacementEvent.extendedProps?.sourceTimeZone || 
                    'UTC'
        } : undefined
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create recurrence exception',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          eventId, 
          exceptionDate, 
          isCancelled, 
          replacementEvent, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Converts a unified calendar view event to a calendar event
   *
   * @param event - The unified calendar view event
   * @param timeZone - The timezone to convert to
   * @param eventType - The type of event
   * @returns A calendar event
   */
  private static convertToCalendarEvent(
    event: any,
    timeZone: string,
    eventType: CalendarEventType
  ): CalendarEvent {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert start and end times to the user's timezone
      const start = TimeZoneService.convertTimeZone(
        event.start_time,
        event.time_zone || 'UTC',
        validTimeZone
      );
      
      const end = TimeZoneService.convertTimeZone(
        event.end_time,
        event.time_zone || 'UTC',
        validTimeZone
      );
      
      // Base calendar event properties
      const calendarEvent: CalendarEvent = {
        id: event.id,
        title: event.title || 'Event',
        start,
        end,
        allDay: event.all_day || false,
        extendedProps: {
          clinicianId: event.clinician_id,
          eventType: eventType,
          isActive: event.is_active,
          recurrenceId: event.recurrence_id,
          isRecurring: !!event.recurrence_id,
          sourceTable: event.source_table,
          timezone: validTimeZone,
          sourceTimeZone: event.time_zone || 'UTC'
        }
      };
      
      // Add event type specific properties
      switch (eventType) {
        case 'availability':
          calendarEvent.backgroundColor = '#4CAF50'; // Green
          calendarEvent.borderColor = '#388E3C';
          calendarEvent.textColor = '#FFFFFF';
          calendarEvent.extendedProps.isAvailability = true;
          break;
        case 'appointment':
          calendarEvent.backgroundColor = '#2196F3'; // Blue
          calendarEvent.borderColor = '#1976D2';
          calendarEvent.textColor = '#FFFFFF';
          calendarEvent.extendedProps.status = event.status;
          calendarEvent.extendedProps.clientId = event.client_id;
          calendarEvent.extendedProps.description = event.notes;
          calendarEvent.extendedProps.isAvailability = false;
          break;
        case 'time_off':
          calendarEvent.backgroundColor = '#FF9800'; // Orange
          calendarEvent.borderColor = '#F57C00';
          calendarEvent.textColor = '#FFFFFF';
          calendarEvent.extendedProps.description = event.reason;
          calendarEvent.extendedProps.isAvailability = false;
          break;
        default:
          calendarEvent.backgroundColor = '#9E9E9E'; // Grey
          calendarEvent.borderColor = '#757575';
          calendarEvent.textColor = '#FFFFFF';
          calendarEvent.extendedProps.isAvailability = false;
      }
      
      return calendarEvent;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert unified calendar view event to calendar event',
        'CALENDAR_CONVERSION_ERROR',
        { event, timeZone, eventType, originalError: error }
      );
    }
  }
}