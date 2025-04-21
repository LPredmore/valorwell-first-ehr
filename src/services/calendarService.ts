import { supabase } from '@/integrations/supabase/client';
import { 
  ICalendarEvent, 
  CalendarEvent, 
  CalendarEventType,
  RecurrenceRule,
  CalendarException 
} from '@/types/calendar';
import { format } from 'date-fns';
import { dayNumberToCode } from '@/utils/rruleUtils';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

export class CalendarService {
  static async getEvents(
    clinicianId: string, 
    userTimeZone: string,
    start?: Date,
    end?: Date
  ): Promise<CalendarEvent[]> {
    try {
      if (!clinicianId) {
        console.error("[CalendarService] No clinician ID provided");
        return [];
      }

      userTimeZone = ensureIANATimeZone(userTimeZone);
      console.log(`[CalendarService] Fetching events with params:`, {
        clinicianId,
        userTimeZone,
        startDate: start?.toISOString(),
        endDate: end?.toISOString()
      });

      // Check if clinician exists first
      const { data: clinician, error: clinicianError } = await supabase
        .from('clinicians')
        .select('id')
        .eq('id', clinicianId)
        .single();
        
      if (clinicianError) {
        console.error("[CalendarService] Error checking clinician:", clinicianError);
        throw clinicianError;
      }
      
      if (!clinician) {
        console.error("[CalendarService] Clinician not found:", clinicianId);
        return [];
      }
      
      // Add date range filters if provided
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          recurrence_rules (*)
        `)
        .eq('clinician_id', clinicianId);
        
      if (start) {
        query = query.gte('start_time', start.toISOString());
      }
      
      if (end) {
        query = query.lte('start_time', end.toISOString());
      }
      
      // Execute the query
      const { data: events, error } = await query;
      
      if (error) {
        console.error("[CalendarService] Error fetching calendar events:", error);
        throw error;
      }

      console.log(`[CalendarService] Raw events fetched:`, events);
      
      // Fetch exceptions if needed
      const eventsWithRecurrence = events?.filter(event => event.recurrence_rules && event.recurrence_rules.length > 0);
      
      if (eventsWithRecurrence && eventsWithRecurrence.length > 0) {
        console.log(`[CalendarService] Found ${eventsWithRecurrence.length} recurring events`);
        
        const recurrenceIds = eventsWithRecurrence.map(event => event.id);
        
        const { data: exceptions, error: exceptionsError } = await supabase
          .from('calendar_exceptions')
          .select('*')
          .in('recurrence_event_id', recurrenceIds);
          
        if (exceptionsError) {
          console.error("[CalendarService] Error fetching calendar exceptions:", exceptionsError);
          throw exceptionsError;
        }
        
        // Map exceptions to their events
        const exceptionsMap = new Map();
        exceptions?.forEach(exception => {
          if (!exceptionsMap.has(exception.recurrence_event_id)) {
            exceptionsMap.set(exception.recurrence_event_id, []);
          }
          exceptionsMap.get(exception.recurrence_event_id).push(exception);
        });
        
        // Add exceptions to events
        events?.forEach(event => {
          if (exceptionsMap.has(event.id)) {
            event.exceptions = exceptionsMap.get(event.id);
          }
        });
        
        console.log('[CalendarService] Added exceptions to events:', events);
      }
      
      // Convert to CalendarEvent format
      const calendarEvents = this.convertToCalendarEvents(events || [], userTimeZone);
      console.log(`[CalendarService] Converted ${calendarEvents.length} calendar events`);
      
      return calendarEvents;
    } catch (error) {
      console.error('[CalendarService] Error in getEvents:', error);
      throw error;
    }
  }

  static async createEvent(event: ICalendarEvent, userTimeZone: string): Promise<ICalendarEvent> {
    try {
      console.log('Creating calendar event:', JSON.stringify(event, null, 2));
      userTimeZone = ensureIANATimeZone(userTimeZone);
      
      // Convert times to UTC format for storage and match DB schema
      const utcEvent = {
        title: event.title,
        description: event.description,
        start_time: new Date(event.startTime).toISOString(),
        end_time: new Date(event.endTime).toISOString(),
        clinician_id: event.clinicianId,
        event_type: event.eventType,
        all_day: event.allDay // Match DB column name
      };
      
      console.log('Formatted DB event:', utcEvent);
      
      // Insert the event
      const { data: createdEvent, error } = await supabase
        .from('calendar_events')
        .insert(utcEvent)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting event:', error);
        throw error;
      }
      
      console.log('Created event in DB:', createdEvent);
      
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
          
        if (ruleError) {
          console.error('Error creating recurrence rule:', ruleError);
          throw ruleError;
        }
        
        createdEvent.recurrence_rule = createdRule;
      }
      
      // Convert back to ICalendarEvent format
      return {
        id: createdEvent.id,
        clinicianId: createdEvent.clinician_id,
        title: createdEvent.title,
        description: createdEvent.description,
        startTime: new Date(createdEvent.start_time).toISOString(),
        endTime: new Date(createdEvent.end_time).toISOString(),
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

  static async updateEvent(event: ICalendarEvent, userTimeZone: string): Promise<ICalendarEvent> {
    try {
      userTimeZone = ensureIANATimeZone(userTimeZone);
      console.log('Updating calendar event:', JSON.stringify(event, null, 2));
      
      // Convert times to UTC format for storage
      const utcEvent = {
        title: event.title,
        description: event.description,
        start_time: new Date(event.startTime).toISOString(),
        end_time: new Date(event.endTime).toISOString(),
        event_type: event.eventType,
        all_day: event.allDay
      };
      
      // Update the event
      const { data: updatedEvent, error } = await supabase
        .from('calendar_events')
        .update(utcEvent)
        .eq('id', event.id)
        .select(`*, recurrence_rules(*)`)
        .single();
      
      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }
      
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
            
          if (ruleError) {
            console.error('Error updating recurrence rule:', ruleError);
            throw ruleError;
          }
          
          updatedEvent.recurrence_rules = [updatedRule];
        } else {
          // Create new rule
          const { data: createdRule, error: ruleError } = await supabase
            .from('recurrence_rules')
            .insert(recurrenceData)
            .select()
            .single();
            
          if (ruleError) {
            console.error('Error creating recurrence rule:', ruleError);
            throw ruleError;
          }
          
          updatedEvent.recurrence_rules = [createdRule];
        }
      }
      
      // Convert back to ICalendarEvent format
      return {
        id: updatedEvent.id,
        clinicianId: updatedEvent.clinician_id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        startTime: new Date(updatedEvent.start_time).toISOString(),
        endTime: new Date(updatedEvent.end_time).toISOString(),
        allDay: updatedEvent.all_day,
        eventType: updatedEvent.event_type as CalendarEventType,
        recurrenceId: updatedEvent.recurrence_id,
        recurrenceRule: updatedEvent.recurrence_rules && updatedEvent.recurrence_rules.length > 0 ? {
          id: updatedEvent.recurrence_rules[0].id,
          eventId: updatedEvent.recurrence_rules[0].event_id,
          rrule: updatedEvent.recurrence_rules[0].rrule
        } : undefined
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      console.log(`Deleting calendar event with ID: ${eventId}`);
      
      // Delete the event (cascade will handle recurrence rules)
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
      
      console.log(`Successfully deleted event: ${eventId}`);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

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
      
      if (error) {
        console.error('Error adding calendar exception:', error);
        throw error;
      }
      
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

  private static convertToCalendarEvents(events: any[], userTimeZone: string): CalendarEvent[] {
    try {
      userTimeZone = ensureIANATimeZone(userTimeZone);
      console.log('[CalendarService] Converting events with timezone:', userTimeZone);
      
      return events.map(event => {
        console.log('[CalendarService] Converting event:', event);
        
        // Convert times to Date objects
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        
        // Create the base calendar event
        const calendarEvent: CalendarEvent = {
          id: event.id,
          title: event.title,
          start: startTime,
          end: endTime,
          allDay: event.all_day,
          extendedProps: {
            eventType: event.event_type,
            isAvailability: event.event_type === 'availability',
            description: event.description
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
          console.log('[CalendarService] Adding recurrence rule:', event.recurrence_rules[0]);
          const rule = event.recurrence_rules[0];
          calendarEvent.rrule = rule.rrule;
          
          calendarEvent.extendedProps!.recurrenceRule = {
            id: rule.id,
            eventId: rule.event_id,
            rrule: rule.rrule
          };
        }
        
        // Add exceptions if available
        if (event.exceptions && event.exceptions.length > 0) {
          console.log('[CalendarService] Adding exceptions:', event.exceptions);
          calendarEvent.extendedProps!.exceptions = event.exceptions.map((exception: any) => ({
            id: exception.id,
            recurrenceEventId: exception.recurrence_event_id,
            exceptionDate: exception.exception_date,
            isCancelled: exception.is_cancelled,
            replacementEventId: exception.replacement_event_id
          }));
        }
        
        console.log('[CalendarService] Converted calendar event:', calendarEvent);
        return calendarEvent;
      });
    } catch (error) {
      console.error('[CalendarService] Error converting events:', error);
      throw error;
    }
  }

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

  private static async migrateSingleDayAvailability(): Promise<void> {
    try {
      console.log("Starting single day availability migration");
      
      // Check if the single_day_availability table exists
      const { count, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name', { count: 'exact', head: true })
        .eq('table_schema', 'public')
        .eq('table_name', 'single_day_availability');
      
      if (checkError) {
        console.error('Error checking for single_day_availability table:', checkError);
        return;
      }
      
      if (count === 0) {
        console.log('single_day_availability table does not exist, skipping migration');
        return;
      }
      
      // Get single day availability records
      const { data: singleDayAvail, error } = await supabase
        .from('single_day_availability')
        .select('*');
      
      if (error) {
        console.error('Error fetching single day availability:', error);
        return;
      }
      
      if (!singleDayAvail || singleDayAvail.length === 0) {
        console.log("No single day availability records to migrate");
        return;
      }
      
      console.log(`Found ${singleDayAvail.length} single day availability records to migrate`);
      
      // Process each record
      for (const record of singleDayAvail) {
        try {
          // Format date and times
          const dateStr = record.availability_date || record.date;
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
          console.error(`Error processing single day availability record ${record.id}:`, recordError);
        }
      }
    } catch (error) {
      console.error('Error in migrateSingleDayAvailability:', error);
      throw error;
    }
  }

  private static async migrateTimeBlocks(): Promise<void> {
    try {
      console.log("Starting time blocks migration");
      
      // Check if the time_blocks table exists
      const { count, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name', { count: 'exact', head: true })
        .eq('table_schema', 'public')
        .eq('table_name', 'time_blocks');
      
      if (checkError) {
        console.error('Error checking for time_blocks table:', checkError);
        return;
      }
      
      if (count === 0) {
        console.log('time_blocks table does not exist, skipping migration');
        return;
      }
      
      // Get time block records
      const { data: timeBlocks, error } = await supabase
        .from('time_blocks')
        .select('*');
      
      if (error) {
        console.error('Error fetching time blocks:', error);
        return;
      }
      
      if (!timeBlocks || timeBlocks.length === 0) {
        console.log("No time block records to migrate");
        return;
      }
      
      console.log(`Found ${timeBlocks.length} time block records to migrate`);
      
      // Process each record
      for (const record of timeBlocks) {
        try {
          // Format date and times
          const dateStr = record.block_date;
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
            title: `Time Off${record.reason ? `: ${record.reason}` : ''}`,
            description: record.reason || 'Time off block',
            start_time: startDateTime,
            end_time: endDateTime,
            all_day: false,
            event_type: 'time_off',
            clinician_id: record.clinician_id
          };
          
          // Insert the event
          const { error: eventError } = await supabase
            .from('calendar_events')
            .insert(eventData);
          
          if (eventError) {
            console.error(`Error creating calendar event from time block record ${record.id}:`, eventError);
            continue;
          }
          
          console.log(`Migrated time block for ${dateStr}`);
        } catch (recordError) {
          console.error(`Error processing time block record ${record.id}:`, recordError);
        }
      }
    } catch (error) {
      console.error('Error in migrateTimeBlocks:', error);
      throw error;
    }
  }
}
