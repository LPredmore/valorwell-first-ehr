import { supabase } from '@/integrations/supabase/client';
import { 
  ICalendarEvent, 
  CalendarEvent, 
  CalendarEventType,
  RecurrenceRule,
  CalendarException 
} from '@/types/calendar';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, format } from 'date-fns';

/**
 * Service for handling calendar operations with iCalendar format
 */
export class CalendarService {
  
  /**
   * Fetch calendar events for a clinician
   * @param clinicianId The ID of the clinician
   * @param userTimeZone The user's timezone
   * @param start Optional start date
   * @param end Optional end date
   */
  static async getEvents(
    clinicianId: string, 
    userTimeZone: string,
    start?: Date,
    end?: Date
  ): Promise<CalendarEvent[]> {
    try {
      // Fetch base events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          recurrence_rules (*)
        `)
        .eq('clinician_id', clinicianId);
      
      if (error) throw error;
      
      // Fetch exceptions if needed
      const eventsWithRecurrence = events.filter(event => event.recurrence_rules && event.recurrence_rules.length > 0);
      
      if (eventsWithRecurrence.length > 0) {
        const recurrenceIds = eventsWithRecurrence.map(event => event.id);
        
        const { data: exceptions, error: exceptionsError } = await supabase
          .from('calendar_exceptions')
          .select('*')
          .in('recurrence_event_id', recurrenceIds);
          
        if (exceptionsError) throw exceptionsError;
        
        // Map exceptions to their events
        const exceptionsMap = new Map();
        exceptions.forEach(exception => {
          if (!exceptionsMap.has(exception.recurrence_event_id)) {
            exceptionsMap.set(exception.recurrence_event_id, []);
          }
          exceptionsMap.get(exception.recurrence_event_id).push(exception);
        });
        
        // Add exceptions to events
        events.forEach(event => {
          if (exceptionsMap.has(event.id)) {
            event.exceptions = exceptionsMap.get(event.id);
          }
        });
      }
      
      // Convert to CalendarEvent format
      return this.convertToCalendarEvents(events, userTimeZone);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }
  
  /**
   * Create a new calendar event
   * @param event The event to create
   * @param userTimeZone The user's timezone
   */
  static async createEvent(event: ICalendarEvent, userTimeZone: string): Promise<ICalendarEvent> {
    try {
      // Convert times from user timezone to UTC
      const utcEvent = {
        ...event,
        start_time: fromZonedTime(parseISO(event.startTime), userTimeZone).toISOString(),
        end_time: fromZonedTime(parseISO(event.endTime), userTimeZone).toISOString(),
        clinician_id: event.clinicianId,
        event_type: event.eventType
      };
      
      delete utcEvent.startTime;
      delete utcEvent.endTime;
      delete utcEvent.clinicianId;
      delete utcEvent.eventType;
      delete utcEvent.recurrenceRule;
      
      // Insert the event
      const { data: createdEvent, error } = await supabase
        .from('calendar_events')
        .insert(utcEvent)
        .select()
        .single();
      
      if (error) throw error;
      
      // If there's a recurrence rule, create it
      if (event.recurrenceRule) {
        const recurrenceData = {
          event_id: createdEvent.id,
          rrule: event.recurrenceRule.rrule
        };
        
        const { data: createdRule, error: ruleError } = await supabase
          .from('recurrence_rules')
          .insert(recurrenceData)
          .select()
          .single();
          
        if (ruleError) throw ruleError;
        
        createdEvent.recurrence_rule = createdRule;
      }
      
      // Convert back to ICalendarEvent format
      return {
        id: createdEvent.id,
        clinicianId: createdEvent.clinician_id,
        title: createdEvent.title,
        description: createdEvent.description,
        startTime: toZonedTime(createdEvent.start_time, userTimeZone).toISOString(),
        endTime: toZonedTime(createdEvent.end_time, userTimeZone).toISOString(),
        allDay: createdEvent.all_day,
        eventType: createdEvent.event_type as CalendarEventType,
        recurrenceId: createdEvent.recurrence_id,
        recurrenceRule: createdEvent.recurrence_rule ? {
          id: createdEvent.recurrence_rule.id,
          eventId: createdEvent.recurrence_rule.event_id,
          rrule: createdEvent.recurrence_rule.rrule
        } : undefined
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing calendar event
   * @param event The event to update
   * @param userTimeZone The user's timezone
   */
  static async updateEvent(event: ICalendarEvent, userTimeZone: string): Promise<ICalendarEvent> {
    try {
      // Convert times from user timezone to UTC
      const utcEvent = {
        ...event,
        start_time: fromZonedTime(parseISO(event.startTime), userTimeZone).toISOString(),
        end_time: fromZonedTime(parseISO(event.endTime), userTimeZone).toISOString(),
        clinician_id: event.clinicianId,
        event_type: event.eventType
      };
      
      delete utcEvent.startTime;
      delete utcEvent.endTime;
      delete utcEvent.clinicianId;
      delete utcEvent.eventType;
      delete utcEvent.recurrenceRule;
      
      // Update the event
      const { data: updatedEvent, error } = await supabase
        .from('calendar_events')
        .update(utcEvent)
        .eq('id', event.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // If there's a recurrence rule, update or create it
      if (event.recurrenceRule) {
        const recurrenceData = {
          event_id: event.id,
          rrule: event.recurrenceRule.rrule
        };
        
        // Check if rule exists
        const { data: existingRule } = await supabase
          .from('recurrence_rules')
          .select()
          .eq('event_id', event.id)
          .maybeSingle();
          
        if (existingRule) {
          // Update existing rule
          const { data: updatedRule, error: ruleError } = await supabase
            .from('recurrence_rules')
            .update({ rrule: event.recurrenceRule.rrule })
            .eq('id', existingRule.id)
            .select()
            .single();
            
          if (ruleError) throw ruleError;
          
          updatedEvent.recurrence_rule = updatedRule;
        } else {
          // Create new rule
          const { data: createdRule, error: ruleError } = await supabase
            .from('recurrence_rules')
            .insert(recurrenceData)
            .select()
            .single();
            
          if (ruleError) throw ruleError;
          
          updatedEvent.recurrence_rule = createdRule;
        }
      }
      
      // Convert back to ICalendarEvent format
      return {
        id: updatedEvent.id,
        clinicianId: updatedEvent.clinician_id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        startTime: toZonedTime(updatedEvent.start_time, userTimeZone).toISOString(),
        endTime: toZonedTime(updatedEvent.end_time, userTimeZone).toISOString(),
        allDay: updatedEvent.all_day,
        eventType: updatedEvent.event_type as CalendarEventType,
        recurrenceId: updatedEvent.recurrence_id,
        recurrenceRule: updatedEvent.recurrence_rule ? {
          id: updatedEvent.recurrence_rule.id,
          eventId: updatedEvent.recurrence_rule.event_id,
          rrule: updatedEvent.recurrence_rule.rrule
        } : undefined
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }
  
  /**
   * Delete a calendar event
   * @param eventId The ID of the event to delete
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      // Delete the event (cascade will handle recurrence rules)
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }
  
  /**
   * Add an exception to a recurring event
   * @param exception The exception to add
   */
  static async addException(exception: CalendarException): Promise<CalendarException> {
    try {
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .insert({
          recurrence_event_id: exception.recurrenceEventId,
          exception_date: exception.exceptionDate,
          is_cancelled: exception.isCancelled,
          replacement_event_id: exception.replacementEventId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        recurrenceEventId: data.recurrence_event_id,
        exceptionDate: data.exception_date,
        isCancelled: data.is_cancelled,
        replacementEventId: data.replacement_event_id
      };
    } catch (error) {
      console.error('Error adding calendar exception:', error);
      throw error;
    }
  }
  
  /**
   * Convert database events to FullCalendar events
   * @param events The events from the database
   * @param userTimeZone The user's timezone
   */
  private static convertToCalendarEvents(events: any[], userTimeZone: string): CalendarEvent[] {
    return events.map(event => {
      // Convert times from UTC to user timezone
      const startTime = toZonedTime(event.start_time, userTimeZone);
      const endTime = toZonedTime(event.end_time, userTimeZone);
      
      // Create the base calendar event
      const calendarEvent: CalendarEvent = {
        id: event.id,
        title: event.title,
        start: startTime,
        end: endTime,
        allDay: event.all_day,
        extendedProps: {
          eventType: event.event_type,
          isAvailability: event.event_type === 'availability'
        }
      };
      
      // Set color based on event type
      switch (event.event_type) {
        case 'availability':
          calendarEvent.backgroundColor = 'rgba(76, 175, 80, 0.3)';
          calendarEvent.borderColor = '#4CAF50';
          calendarEvent.textColor = '#1B5E20';
          calendarEvent.display = 'block';
          break;
        case 'time_off':
          calendarEvent.backgroundColor = 'rgba(244, 67, 54, 0.3)';
          calendarEvent.borderColor = '#F44336';
          calendarEvent.textColor = '#B71C1C';
          calendarEvent.display = 'block';
          break;
        case 'appointment':
          // Keep default colors
          break;
      }
      
      // Add recurrence information if available
      if (event.recurrence_rules && event.recurrence_rules.length > 0) {
        const rule = event.recurrence_rules[0];
        calendarEvent.rrule = rule.rrule;
        
        calendarEvent.extendedProps!.recurrenceRule = {
          id: rule.id,
          eventId: rule.event_id,
          rrule: rule.rrule
        };
      }
      
      // Add legacy format for backward compatibility
      if (event.event_type === 'availability') {
        calendarEvent.extendedProps!.availabilityBlock = {
          id: event.id,
          type: event.recurrence_rules && event.recurrence_rules.length > 0 ? 'weekly' : 'single_day',
          startTime: format(startTime, 'HH:mm'),
          endTime: format(endTime, 'HH:mm')
        };
        
        // Add day of week for weekly recurrence
        if (event.recurrence_rules && event.recurrence_rules.length > 0) {
          const rrule = event.recurrence_rules[0].rrule;
          const match = rrule.match(/BYDAY=([A-Z]{2})/);
          if (match) {
            const dayCode = match[1];
            const days = {
              'SU': 'sunday',
              'MO': 'monday',
              'TU': 'tuesday',
              'WE': 'wednesday',
              'TH': 'thursday',
              'FR': 'friday',
              'SA': 'saturday'
            };
            calendarEvent.extendedProps!.availabilityBlock.dayOfWeek = days[dayCode as keyof typeof days];
          }
        } else {
          // For single day
          calendarEvent.extendedProps!.availabilityBlock.date = format(startTime, 'yyyy-MM-dd');
        }
      } else if (event.event_type === 'time_off') {
        calendarEvent.extendedProps!.availabilityBlock = {
          id: event.id,
          type: 'time_block',
          date: format(startTime, 'yyyy-MM-dd'),
          startTime: format(startTime, 'HH:mm'),
          endTime: format(endTime, 'HH:mm'),
          reason: event.description
        };
      }
      
      return calendarEvent;
    });
  }
  
  /**
   * Run the migration from old format to new format
   */
  static async migrateData(): Promise<void> {
    try {
      const { error } = await supabase.rpc('migrate_existing_availability');
      if (error) throw error;
    } catch (error) {
      console.error('Error migrating availability data:', error);
      throw error;
    }
  }
}
