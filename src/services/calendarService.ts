
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
import { dayNumberToCode } from '@/utils/rruleUtils';

/**
 * Service for handling calendar operations with iCalendar format
 */
export class CalendarService {
  
  /**
   * Fetch calendar events for a clinician
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
        exceptions?.forEach(exception => {
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
   * Add weekly availability for a clinician
   * @param clinicianId Clinician ID
   * @param dayIndex Day of week (0-6 for Sunday-Saturday)
   * @param startTime Start time (HH:MM format)
   * @param endTime End time (HH:MM format)
   * @param userTimeZone User's timezone
   * @returns Created calendar event
   */
  static async addWeeklyAvailability(
    clinicianId: string, 
    dayIndex: number, 
    startTime: string, 
    endTime: string,
    userTimeZone: string
  ): Promise<ICalendarEvent> {
    try {
      // Create a new event for today with the specified times
      const today = new Date();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
      
      // Create start and end times for today as reference points
      const startISO = `${format(today, 'yyyy-MM-dd')}T${startTime}:00`;
      const endISO = `${format(today, 'yyyy-MM-dd')}T${endTime}:00`;
      
      // Create the event
      const event: ICalendarEvent = {
        id: '', // Will be generated
        clinicianId,
        title: `Available - ${dayName}`,
        startTime: startISO,
        endTime: endISO,
        allDay: false,
        eventType: 'availability',
        recurrenceRule: {
          id: '', // Will be generated
          eventId: '', // Will be set after event creation
          rrule: `FREQ=WEEKLY;BYDAY=${dayNumberToCode(dayIndex)}`
        }
      };
      
      // Create the event
      return await this.createEvent(event, userTimeZone);
    } catch (error) {
      console.error('Error adding weekly availability:', error);
      throw error;
    }
  }
  
  /**
   * Convert database events to FullCalendar events
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
            const days: Record<string, string> = {
              'SU': '0',
              'MO': '1',
              'TU': '2',
              'WE': '3',
              'TH': '4',
              'FR': '5',
              'SA': '6'
            };
            calendarEvent.extendedProps!.availabilityBlock.dayOfWeek = days[dayCode] || '0';
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
      // First migrate from the availability table
      await this.migrateWeeklyAvailability();
      
      // Then migrate from single day availability
      await this.migrateSingleDayAvailability();
      
      // Finally migrate time blocks
      await this.migrateTimeBlocks();
      
      console.log("Successfully completed all availability migrations");
    } catch (error) {
      console.error('Error migrating availability data:', error);
      throw error;
    }
  }
  
  /**
   * Migrate weekly availability from the old table to the calendar_events table
   */
  private static async migrateWeeklyAvailability(): Promise<void> {
    try {
      console.log("Starting weekly availability migration");
      // Get all weekly availability records
      const { data: availability, error } = await supabase
        .from('availability')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      if (!availability || availability.length === 0) {
        console.log("No weekly availability records to migrate");
        return;
      }
      
      console.log(`Found ${availability.length} weekly availability records to migrate`);
      
      // Default timezone for conversion
      const defaultTimeZone = 'America/Chicago';
      
      // Process each availability record
      for (const record of availability) {
        try {
          // Convert day_of_week to number if needed
          let dayIndex: number;
          if (typeof record.day_of_week === 'string') {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            dayIndex = dayNames.indexOf(record.day_of_week.toLowerCase());
            if (dayIndex < 0) {
              // Try numeric string
              dayIndex = parseInt(record.day_of_week, 10);
              if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
                console.warn(`Invalid day_of_week: ${record.day_of_week}, skipping record`);
                continue;
              }
            }
          } else {
            dayIndex = record.day_of_week;
          }
          
          // Create a daycode from the day index
          const dayCode = dayNumberToCode(dayIndex);
          
          // Basic validation for time formats
          if (!record.start_time || !record.end_time) {
            console.warn(`Missing start or end time for record: ${record.id}, skipping`);
            continue;
          }
          
          // Format start and end times
          let startTime = record.start_time;
          let endTime = record.end_time;
          
          if (typeof startTime === 'string' && !startTime.includes(':')) {
            startTime = `${startTime}:00`;
          }
          if (typeof endTime === 'string' && !endTime.includes(':')) {
            endTime = `${endTime}:00`;
          }
          
          // Create a reference date for today
          const today = new Date();
          const startDateTime = `${format(today, 'yyyy-MM-dd')}T${startTime}`;
          const endDateTime = `${format(today, 'yyyy-MM-dd')}T${endTime}`;
          
          // Create the calendar event
          const eventData = {
            title: `Available - ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex]}`,
            description: `Weekly availability`,
            start_time: startDateTime,
            end_time: endDateTime,
            all_day: false,
            event_type: 'availability',
            clinician_id: record.clinician_id
          };
          
          // Insert the event
          const { data: newEvent, error: eventError } = await supabase
            .from('calendar_events')
            .insert(eventData)
            .select()
            .single();
          
          if (eventError) {
            console.error(`Error creating calendar event from availability record ${record.id}:`, eventError);
            continue;
          }
          
          // Create the recurrence rule
          const recurrenceData = {
            event_id: newEvent.id,
            rrule: `FREQ=WEEKLY;BYDAY=${dayCode}`
          };
          
          const { error: ruleError } = await supabase
            .from('recurrence_rules')
            .insert(recurrenceData);
            
          if (ruleError) {
            console.error(`Error creating recurrence rule for event ${newEvent.id}:`, ruleError);
          }
          
          console.log(`Migrated weekly availability for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex]}`);
        } catch (recordError) {
          console.error(`Error processing availability record ${record.id}:`, recordError);
        }
      }
      
      console.log("Completed weekly availability migration");
    } catch (error) {
      console.error('Error in migrateWeeklyAvailability:', error);
      throw error;
    }
  }
  
  /**
   * Migrate single day availability to calendar_events table
   */
  private static async migrateSingleDayAvailability(): Promise<void> {
    try {
      console.log("Starting single day availability migration");
      
      // Check if the single_day_availability table exists
      const { data: singleDayAvail, error } = await supabase
        .from('single_day_availability')
        .select('*');
      
      if (!error && singleDayAvail && singleDayAvail.length > 0) {
        console.log(`Found ${singleDayAvail.length} single day availability records to migrate`);
        
        // Process each record
        for (const record of singleDayAvail) {
          try {
            // Format date and times
            const dateStr = record.availability_date;
            const startTime = record.start_time;
            const endTime = record.end_time;
            
            if (!dateStr || !startTime || !endTime) {
              console.warn(`Missing date or time data for record: ${record.id}, skipping`);
              continue;
            }
            
            // Create ISO datetime strings
            const startDateTime = `${dateStr}T${startTime}`;
            const endDateTime = `${dateStr}T${endTime}`;
            
            // Create the calendar event
            const eventData = {
              title: `Available - ${dateStr}`,
              description: `Single day availability`,
              start_time: startDateTime,
              end_time: endDateTime,
              all_day: false,
              event_type: 'availability',
              clinician_id: record.clinician_id
            };
            
            // Insert the event
            const { error: eventError } = await supabase
              .from('calendar_events')
              .insert(eventData);
            
            if (eventError) {
              console.error(`Error creating calendar event from single day record ${record.id}:`, eventError);
              continue;
            }
            
            console.log(`Migrated single day availability for ${dateStr}`);
          } catch (recordError) {
            console.error(`Error processing single day record ${record.id}:`, recordError);
          }
        }
      } else {
        console.log("No single day availability records found or table doesn't exist");
      }
      
      // Check alternate table name
      const { data: altData, error: altError } = await supabase
        .from('availability_single_date')
        .select('*');
        
      if (!altError && altData && altData.length > 0) {
        console.log(`Found ${altData.length} alternate single day records to migrate`);
        
        // Process each record
        for (const record of altData) {
          try {
            // Format date and times
            const dateStr = record.date;
            const startTime = record.start_time;
            const endTime = record.end_time;
            
            if (!dateStr || !startTime || !endTime) {
              console.warn(`Missing date or time data for alternate record: ${record.id}, skipping`);
              continue;
            }
            
            // Create ISO datetime strings
            const startDateTime = `${dateStr}T${startTime}`;
            const endDateTime = `${dateStr}T${endTime}`;
            
            // Create the calendar event
            const eventData = {
              title: `Available - ${dateStr}`,
              description: `Single day availability`,
              start_time: startDateTime,
              end_time: endDateTime,
              all_day: false,
              event_type: 'availability',
              clinician_id: record.clinician_id
            };
            
            // Insert the event
            const { error: eventError } = await supabase
              .from('calendar_events')
              .insert(eventData);
            
            if (eventError) {
              console.error(`Error creating calendar event from alt record ${record.id}:`, eventError);
              continue;
            }
            
            console.log(`Migrated alt single day availability for ${dateStr}`);
          } catch (recordError) {
            console.error(`Error processing alt single day record ${record.id}:`, recordError);
          }
        }
      }
      
      console.log("Completed single day availability migration");
    } catch (error) {
      console.error('Error in migrateSingleDayAvailability:', error);
      throw error;
    }
  }
  
  /**
   * Migrate time blocks to calendar_events table as time_off events
   */
  private static async migrateTimeBlocks(): Promise<void> {
    try {
      console.log("Starting time blocks migration");
      
      // Get all time blocks
      const { data: timeBlocks, error } = await supabase
        .from('time_blocks')
        .select('*');
      
      if (error) {
        console.log("Error fetching time blocks or table doesn't exist:", error);
        return;
      }
      
      if (!timeBlocks || timeBlocks.length === 0) {
        console.log("No time blocks to migrate");
        return;
      }
      
      console.log(`Found ${timeBlocks.length} time blocks to migrate`);
      
      // Process each time block
      for (const block of timeBlocks) {
        try {
          // Format date and times
          const dateStr = block.block_date;
          const startTime = block.start_time;
          const endTime = block.end_time;
          
          if (!dateStr || !startTime || !endTime) {
            console.warn(`Missing date or time data for time block: ${block.id}, skipping`);
            continue;
          }
          
          // Create ISO datetime strings
          const startDateTime = `${dateStr}T${startTime}`;
          const endDateTime = `${dateStr}T${endTime}`;
          
          // Create the calendar event
          const eventData = {
            title: block.reason || `Time Off - ${dateStr}`,
            description: block.reason || 'Time off',
            start_time: startDateTime,
            end_time: endDateTime,
            all_day: false,
            event_type: 'time_off',
            clinician_id: block.clinician_id
          };
          
          // Insert the event
          const { error: eventError } = await supabase
            .from('calendar_events')
            .insert(eventData);
          
          if (eventError) {
            console.error(`Error creating calendar event from time block ${block.id}:`, eventError);
            continue;
          }
          
          console.log(`Migrated time block for ${dateStr}`);
        } catch (blockError) {
          console.error(`Error processing time block ${block.id}:`, blockError);
        }
      }
      
      console.log("Completed time blocks migration");
    } catch (error) {
      console.error('Error in migrateTimeBlocks:', error);
      throw error;
    }
  }
}
