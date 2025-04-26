import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { CalendarEvent } from '@/types/calendar';
import { DateTime } from 'luxon';

/**
 * CalendarService: Unified service for calendar operations
 * This service abstracts the data access logic and provides a clean API
 * for calendar-related operations, regardless of the underlying storage
 */
export class CalendarService {
  /**
   * Get all calendar events for a clinician, with proper timezone handling
   * @param clinicianId UUID of the clinician
   * @param userTimeZone IANA timezone string of the user
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   */
  static async getEvents(
    clinicianId: string,
    userTimeZone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      console.log('[CalendarService] Fetching calendar events:', { 
        clinicianId,
        userTimeZone,
        startDate,
        endDate
      });

      const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
      
      // Try using the unified view first
      const query = supabase
        .from('unified_calendar_view')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      // Apply date range filter if provided
      if (startDate) {
        const startISO = TimeZoneService.formatDateTime(startDate, "yyyy-MM-dd'T'HH:mm:ssZZ", userTimeZone);
        query.gte('start_time', startISO);
      }
      
      if (endDate) {
        const endISO = TimeZoneService.formatDateTime(endDate, "yyyy-MM-dd'T'HH:mm:ssZZ", userTimeZone);
        query.lte('start_time', endISO);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[CalendarService] Error fetching from unified view:', error);
        throw new Error('Unable to fetch calendar events. Please try again.');
      }
      
      // Transform database records to CalendarEvent objects
      const events = data.map(event => this.mapDbEventToCalendarEvent(event, validTimeZone));
      
      console.log(`[CalendarService] Fetched ${events.length} events for clinician ${clinicianId}`);
      return events;
      
    } catch (error) {
      console.error('[CalendarService] Error in getEvents:', error);
      throw error;
    }
  }
  
  /**
   * Create a new calendar event
   * @param event Calendar event to create
   * @param userTimeZone IANA timezone string of the user
   */
  static async createEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    try {
      console.log('[CalendarService] Creating calendar event:', { event, userTimeZone });
      
      // Determine the source table based on event type
      if (event.extendedProps?.eventType === 'availability') {
        return this.createAvailabilityEvent(event, userTimeZone);
      } else if (event.extendedProps?.eventType === 'appointment') {
        return this.createAppointmentEvent(event, userTimeZone);
      } else if (event.extendedProps?.eventType === 'time_off') {
        return this.createTimeOffEvent(event, userTimeZone);
      } else {
        // Default to calendar_events table with generic type
        return this.createGenericEvent(event, userTimeZone);
      }
      
    } catch (error) {
      console.error('[CalendarService] Error in createEvent:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing calendar event
   * @param event Calendar event to update
   * @param userTimeZone IANA timezone string of the user
   */
  static async updateEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    try {
      if (!event.id) {
        throw new Error('Event ID is required for update');
      }
      
      console.log('[CalendarService] Updating calendar event:', { 
        id: event.id,
        userTimeZone 
      });
      
      // Determine which table to update based on the source or event type
      const sourceTable = event.extendedProps?.sourceTable || this.determineSourceTable(event);
      
      if (sourceTable === 'appointments') {
        return this.updateAppointmentEvent(event, userTimeZone);
      } else if (sourceTable === 'time_off') {
        return this.updateTimeOffEvent(event, userTimeZone);
      } else {
        // Default to calendar_events table
        return this.updateGenericEvent(event, userTimeZone);
      }
      
    } catch (error) {
      console.error('[CalendarService] Error in updateEvent:', error);
      throw error;
    }
  }
  
  /**
   * Delete a calendar event
   * @param eventId ID of the event to delete
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      console.log('[CalendarService] Deleting calendar event:', eventId);
      
      // First, determine which table the event belongs to
      const { data, error } = await supabase
        .from('unified_calendar_view')
        .select('source_table')
        .eq('id', eventId)
        .single();
        
      if (error) {
        console.error('[CalendarService] Error finding event source table:', error);
        throw error;
      }
      
      const sourceTable = data?.source_table;
      
      if (!sourceTable) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      // Delete from the appropriate table
      const { error: deleteError } = await supabase
        .from(sourceTable)
        .delete()
        .eq('id', eventId);
        
      if (deleteError) {
        console.error('[CalendarService] Error deleting event:', deleteError);
        throw deleteError;
      }
      
      return true;
      
    } catch (error) {
      console.error('[CalendarService] Error in deleteEvent:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to create an availability event
   */
  private static async createAvailabilityEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (!event.extendedProps?.clinicianId) {
      throw new Error('Clinician ID is required for availability events');
    }
    
    // Convert the event times to UTC for storage
    const startDateTime = event.start instanceof Date 
      ? DateTime.fromJSDate(event.start) 
      : TimeZoneService.parseWithZone(event.start as string, validTimeZone);
      
    const endDateTime = event.end instanceof Date 
      ? DateTime.fromJSDate(event.end) 
      : TimeZoneService.parseWithZone(event.end as string, validTimeZone);
    
    const startUtc = TimeZoneService.toUTC(startDateTime);
    const endUtc = TimeZoneService.toUTC(endDateTime);
    
    // Create the calendar_events record
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        clinician_id: event.extendedProps.clinicianId,
        event_type: 'availability',
        title: event.title,
        start_time: startUtc.toISO(),
        end_time: endUtc.toISO(),
        all_day: event.allDay || false,
        is_active: true,
        description: event.extendedProps?.description
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error creating availability event:', error);
      throw error;
    }
    
    return this.mapDbEventToCalendarEvent(data, validTimeZone);
  }
  
  /**
   * Helper method to create an appointment event
   */
  private static async createAppointmentEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (!event.extendedProps?.clinicianId) {
      throw new Error('Clinician ID is required for appointment events');
    }
    
    if (!event.extendedProps?.clientId) {
      throw new Error('Client ID is required for appointment events');
    }
    
    // Convert the event times to the user's timezone
    const startDateTime = event.start instanceof Date 
      ? DateTime.fromJSDate(event.start).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.start as string, validTimeZone);
      
    const endDateTime = event.end instanceof Date 
      ? DateTime.fromJSDate(event.end).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.end as string, validTimeZone);
    
    // Create the appointment record
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        clinician_id: event.extendedProps.clinicianId,
        client_id: event.extendedProps.clientId,
        date: startDateTime.toFormat('yyyy-MM-dd'),
        start_time: startDateTime.toFormat('HH:mm:ss'),
        end_time: endDateTime.toFormat('HH:mm:ss'),
        type: event.title,
        status: 'scheduled',
        source_time_zone: validTimeZone,
        appointment_datetime: startDateTime.toISO(),
        appointment_end_datetime: endDateTime.toISO()
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error creating appointment event:', error);
      throw error;
    }
    
    // Map the db record to a calendar event
    return {
      id: data.id,
      title: data.type,
      start: startDateTime.toJSDate(),
      end: endDateTime.toJSDate(),
      allDay: false,
      extendedProps: {
        eventType: 'appointment',
        clinicianId: data.clinician_id,
        clientId: data.client_id,
        status: data.status,
        sourceTable: 'appointments'
      }
    };
  }
  
  /**
   * Helper method to create a time off event
   */
  private static async createTimeOffEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (!event.extendedProps?.clinicianId) {
      throw new Error('Clinician ID is required for time off events');
    }
    
    // Convert the event times to the user's timezone
    const startDateTime = event.start instanceof Date 
      ? DateTime.fromJSDate(event.start).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.start as string, validTimeZone);
      
    const endDateTime = event.end instanceof Date 
      ? DateTime.fromJSDate(event.end).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.end as string, validTimeZone);
    
    // Create the time_off record
    const { data, error } = await supabase
      .from('time_off')
      .insert({
        clinician_id: event.extendedProps.clinicianId,
        date: startDateTime.toFormat('yyyy-MM-dd'),
        start_time: startDateTime.toFormat('HH:mm:ss'),
        end_time: endDateTime.toFormat('HH:mm:ss'),
        reason: event.title || 'Time Off',
        all_day: event.allDay || false
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error creating time off event:', error);
      throw error;
    }
    
    // Map the db record to a calendar event
    return {
      id: data.id,
      title: data.reason,
      start: startDateTime.toJSDate(),
      end: endDateTime.toJSDate(),
      allDay: data.all_day,
      extendedProps: {
        eventType: 'time_off',
        clinicianId: data.clinician_id,
        sourceTable: 'time_off'
      }
    };
  }
  
  /**
   * Helper method to create a generic calendar event
   */
  private static async createGenericEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (!event.extendedProps?.clinicianId) {
      throw new Error('Clinician ID is required for calendar events');
    }
    
    // Convert the event times to UTC for storage
    const startUtc = TimeZoneService.convertDateTime(
      event.start as Date|string, 
      validTimeZone, 
      'UTC'
    );
    
    const endUtc = TimeZoneService.convertDateTime(
      event.end as Date|string, 
      validTimeZone, 
      'UTC'
    );
    
    // Create the calendar_events record
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        clinician_id: event.extendedProps.clinicianId,
        event_type: event.extendedProps?.eventType || 'general',
        title: event.title,
        start_time: startUtc.toISO(),
        end_time: endUtc.toISO(),
        all_day: event.allDay || false,
        description: event.extendedProps?.description,
        is_active: true
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error creating generic event:', error);
      throw error;
    }
    
    return this.mapDbEventToCalendarEvent(data, validTimeZone);
  }
  
  /**
   * Helper method to update an appointment event
   */
  private static async updateAppointmentEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    // Convert the event times to the user's timezone
    const startDateTime = event.start instanceof Date 
      ? DateTime.fromJSDate(event.start).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.start as string, validTimeZone);
      
    const endDateTime = event.end instanceof Date 
      ? DateTime.fromJSDate(event.end).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.end as string, validTimeZone);
    
    // Prepare update data
    const updateData: any = {
      date: startDateTime.toFormat('yyyy-MM-dd'),
      start_time: startDateTime.toFormat('HH:mm:ss'),
      end_time: endDateTime.toFormat('HH:mm:ss'),
      appointment_datetime: startDateTime.toISO(),
      appointment_end_datetime: endDateTime.toISO()
    };
    
    // Add optional fields if provided
    if (event.title) {
      updateData.type = event.title;
    }
    
    if (event.extendedProps?.status) {
      updateData.status = event.extendedProps.status;
    }
    
    // Update the appointment record
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', event.id)
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error updating appointment event:', error);
      throw error;
    }
    
    // Map the db record to a calendar event
    return {
      id: data.id,
      title: data.type,
      start: startDateTime.toJSDate(),
      end: endDateTime.toJSDate(),
      allDay: false,
      extendedProps: {
        eventType: 'appointment',
        clinicianId: data.clinician_id,
        clientId: data.client_id,
        status: data.status,
        sourceTable: 'appointments'
      }
    };
  }
  
  /**
   * Helper method to update a time off event
   */
  private static async updateTimeOffEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    // Convert the event times to the user's timezone
    const startDateTime = event.start instanceof Date 
      ? DateTime.fromJSDate(event.start).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.start as string, validTimeZone);
      
    const endDateTime = event.end instanceof Date 
      ? DateTime.fromJSDate(event.end).setZone(validTimeZone)
      : TimeZoneService.parseWithZone(event.end as string, validTimeZone);
    
    // Prepare update data
    const updateData: any = {
      date: startDateTime.toFormat('yyyy-MM-dd'),
      start_time: startDateTime.toFormat('HH:mm:ss'),
      end_time: endDateTime.toFormat('HH:mm:ss')
    };
    
    // Add optional fields if provided
    if (event.title) {
      updateData.reason = event.title;
    }
    
    if (event.allDay !== undefined) {
      updateData.all_day = event.allDay;
    }
    
    // Update the time_off record
    const { data, error } = await supabase
      .from('time_off')
      .update(updateData)
      .eq('id', event.id)
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error updating time off event:', error);
      throw error;
    }
    
    // Map the db record to a calendar event
    return {
      id: data.id,
      title: data.reason,
      start: startDateTime.toJSDate(),
      end: endDateTime.toJSDate(),
      allDay: data.all_day,
      extendedProps: {
        eventType: 'time_off',
        clinicianId: data.clinician_id,
        sourceTable: 'time_off'
      }
    };
  }
  
  /**
   * Helper method to update a generic calendar event
   */
  private static async updateGenericEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    // Convert the event times to UTC for storage
    const startUtc = TimeZoneService.convertDateTime(
      event.start as Date|string, 
      validTimeZone, 
      'UTC'
    );
    
    const endUtc = TimeZoneService.convertDateTime(
      event.end as Date|string, 
      validTimeZone, 
      'UTC'
    );
    
    // Prepare update data
    const updateData: any = {
      start_time: startUtc.toISO(),
      end_time: endUtc.toISO()
    };
    
    // Add optional fields if provided
    if (event.title) {
      updateData.title = event.title;
    }
    
    if (event.allDay !== undefined) {
      updateData.all_day = event.allDay;
    }
    
    if (event.extendedProps?.description) {
      updateData.description = event.extendedProps.description;
    }
    
    // Update the calendar_events record
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', event.id)
      .select()
      .single();
      
    if (error) {
      console.error('[CalendarService] Error updating generic event:', error);
      throw error;
    }
    
    return this.mapDbEventToCalendarEvent(data, validTimeZone);
  }
  
  /**
   * Helper method to map a database record to a CalendarEvent
   */
  private static mapDbEventToCalendarEvent(dbEvent: any, userTimeZone: string): CalendarEvent {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    // Convert UTC times to user timezone
    let startDate, endDate;
    
    // Process start time
    if (dbEvent.start_time) {
      const startDt = DateTime.fromISO(dbEvent.start_time);
      startDate = startDt.setZone(validTimeZone).toJSDate();
    } else {
      // Fallback to combining date and time (for appointment or time_off)
      const dateStr = dbEvent.date || new Date().toISOString().split('T')[0];
      const timeStr = dbEvent.start_time || '00:00:00';
      const startDt = DateTime.fromSQL(`${dateStr} ${timeStr}`, { zone: validTimeZone });
      startDate = startDt.toJSDate();
    }
    
    // Process end time
    if (dbEvent.end_time) {
      const endDt = DateTime.fromISO(dbEvent.end_time);
      endDate = endDt.setZone(validTimeZone).toJSDate();
    } else {
      // Fallback to combining date and time (for appointment or time_off)
      const dateStr = dbEvent.date || new Date().toISOString().split('T')[0];
      const timeStr = dbEvent.end_time || '00:00:00';
      const endDt = DateTime.fromSQL(`${dateStr} ${timeStr}`, { zone: validTimeZone });
      endDate = endDt.toJSDate();
    }
    
    // Create base event object
    const event: CalendarEvent = {
      id: dbEvent.id,
      title: dbEvent.title || dbEvent.type || dbEvent.reason || 'Event',
      start: startDate,
      end: endDate,
      allDay: dbEvent.all_day || false,
      extendedProps: {
        eventType: dbEvent.event_type,
        clinicianId: dbEvent.clinician_id,
        description: dbEvent.description,
        isAvailability: dbEvent.event_type === 'availability',
        sourceTable: dbEvent.source_table
      }
    };
    
    // Add appointment-specific properties
    if (dbEvent.event_type === 'appointment' || dbEvent.source_table === 'appointments') {
      event.extendedProps = {
        ...event.extendedProps,
        clientId: dbEvent.client_id,
        status: dbEvent.status
      };
    }
    
    // Add availability-specific properties
    if (dbEvent.event_type === 'availability') {
      event.extendedProps = {
        ...event.extendedProps,
        isRecurring: !!dbEvent.recurrence_id,
        recurrenceId: dbEvent.recurrence_id,
        isActive: dbEvent.is_active
      };
      
      // Add CSS classes for styling
      if (dbEvent.recurrence_id) {
        event.classNames = ['availability-slot', 'recurring-availability'];
      } else {
        event.classNames = ['availability-slot', 'single-availability'];
      }
    }
    
    return event;
  }
  
  /**
   * Helper method to determine the source table for an event
   */
  private static determineSourceTable(event: CalendarEvent): string {
    const eventType = event.extendedProps?.eventType;
    
    if (eventType === 'appointment') {
      return 'appointments';
    } else if (eventType === 'time_off') {
      return 'time_off';
    } else {
      return 'calendar_events';
    }
  }
}
