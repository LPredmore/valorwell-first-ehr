import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from './TimeZoneService';
import { AvailabilityService } from './AvailabilityService';
import { AppointmentService } from './AppointmentService';
import { TimeOffService } from './TimeOffService';
import { RecurrenceService } from './RecurrenceService';
import { CalendarError } from './CalendarErrorHandler';

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
      
      // Get events from each service in parallel
      const [availability, appointments, timeOff] = await Promise.all([
        this.getAvailabilityEvents(clinicianId, validTimeZone, startDate, endDate),
        this.getAppointmentEvents(clinicianId, validTimeZone, startDate, endDate),
        this.getTimeOffEvents(clinicianId, validTimeZone, startDate, endDate)
      ]);
      
      // Combine all events
      return [...availability, ...appointments, ...timeOff];
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
}