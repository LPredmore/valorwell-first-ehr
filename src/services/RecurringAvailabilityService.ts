import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { ensureClinicianID } from '@/utils/validation/clinicianUtils';
import { RecurrenceService } from './RecurrenceService';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';

/**
 * RecurringAvailabilityService - Handles creation and management of recurring availability slots
 * Uses the centralized RecurrenceService for recurrence pattern handling
 */
export class RecurringAvailabilityService {
  /**
   * Create a recurring availability slot
   * @param clinicianId The ID of the clinician
   * @param startTime The start time of the availability slot
   * @param endTime The end time of the availability slot
   * @param timezone The timezone of the availability slot
   * @param recurrenceRule The recurrence rule string (RRULE format)
   * @param specificDate Optional specific date for the first occurrence
   * @returns The created availability slot
   */
  static async createRecurringAvailability(
    clinicianId: string,
    startTime: string,
    endTime: string,
    timezone: string,
    recurrenceRule: string,
    specificDate?: string
  ): Promise<any> {
    try {
      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Parse the start and end times
      let startDt = TimeZoneService.parseWithZone(startTime, validTimeZone);
      let endDt = TimeZoneService.parseWithZone(endTime, validTimeZone);
      
      // If a specific date is provided, use it for the start and end dates
      if (specificDate) {
        const datePart = specificDate.split('T')[0];
        startDt = TimeZoneService.createDateTime(datePart, startTime, validTimeZone);
        endDt = TimeZoneService.createDateTime(datePart, endTime, validTimeZone);
      }
      
      if (!startDt.isValid || !endDt.isValid) {
        throw new Error(`Invalid datetime: ${!startDt.isValid ? startDt.invalidReason : endDt.invalidReason}`);
      }

      console.log('[RecurringAvailabilityService] Creating recurring availability:', {
        clinicianId: validClinicianId,
        startDt: startDt.toISO(),
        endDt: endDt.toISO(),
        timezone: validTimeZone,
        recurrenceRule,
        specificDate
      });

      // Create the calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          clinician_id: validClinicianId,
          event_type: 'availability',
          availability_type: 'recurring',
          title: 'Available',
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          is_active: true,
          time_zone: validTimeZone
        }])
        .select('id');

      if (error) {
        if (error.message.includes('overlapping availability')) {
          throw new Error('This recurring schedule overlaps with existing availability slots.');
        }
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from calendar event creation');
      }

      const eventId = data[0].id;
      
      try {
        // Use the RecurrenceService to create the recurrence rule
        // Parse the recurrence rule to extract frequency and other parameters
        const byDay = recurrenceRule.includes('BYDAY=') 
          ? recurrenceRule.split('BYDAY=')[1].split(';')[0].split(',')
          : [];
          
        const frequency = recurrenceRule.includes('FREQ=')
          ? recurrenceRule.split('FREQ=')[1].split(';')[0] as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
          : 'WEEKLY';
          
        const interval = recurrenceRule.includes('INTERVAL=')
          ? parseInt(recurrenceRule.split('INTERVAL=')[1].split(';')[0])
          : 1;
          
        const count = recurrenceRule.includes('COUNT=')
          ? parseInt(recurrenceRule.split('COUNT=')[1].split(';')[0])
          : undefined;
          
        const until = recurrenceRule.includes('UNTIL=')
          ? recurrenceRule.split('UNTIL=')[1].split(';')[0]
          : undefined;
        
        // Create the recurrence rule using the RecurrenceService
        const recurrenceData = await RecurrenceService.createRecurrenceRule(eventId, {
          frequency,
          interval,
          byDay,
          count,
          until,
          startDate: startDt.toJSDate(),
          timezone: validTimeZone
        });
        
        // The recurrence_id is automatically updated by the database trigger
        // But we'll update it here as well for backward compatibility
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ recurrence_id: recurrenceData.id })
          .eq('id', eventId);
          
        if (updateError) {
          console.error('[RecurringAvailabilityService] Error updating recurrence_id:', updateError);
          // We don't throw here to avoid rolling back the whole transaction
          // The event is still created, just not properly linked to recurrence
        }
        
        return { success: true, data };
      } catch (recurrenceError) {
        // Rollback the calendar event since recurrence rule failed
        await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId);
        
        throw new Error(`Failed to create recurrence rule: ${recurrenceError instanceof Error ? recurrenceError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Update a recurring availability slot
   * @param eventId The ID of the event to update
   * @param startTime The new start time
   * @param endTime The new end time
   * @param timezone The timezone
   * @param recurrenceRule The new recurrence rule
   * @returns The updated availability slot
   */
  static async updateRecurringAvailability(
    eventId: string,
    startTime: string,
    endTime: string,
    timezone: string,
    recurrenceRule: string
  ): Promise<any> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Parse the start and end times
      let startDt = TimeZoneService.parseWithZone(startTime, validTimeZone);
      let endDt = TimeZoneService.parseWithZone(endTime, validTimeZone);
      
      if (!startDt.isValid || !endDt.isValid) {
        throw new Error(`Invalid datetime: ${!startDt.isValid ? startDt.invalidReason : endDt.invalidReason}`);
      }

      console.log('[RecurringAvailabilityService] Updating recurring availability:', {
        eventId,
        startDt: startDt.toISO(),
        endDt: endDt.toISO(),
        timezone: validTimeZone,
        recurrenceRule
      });

      // Get the current event to check if it exists and get the recurrence_id
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .select('recurrence_id, clinician_id')
        .eq('id', eventId)
        .single();
        
      if (eventError) {
        throw CalendarErrorHandler.handleDatabaseError(eventError);
      }
      
      if (!eventData) {
        throw new Error('Event not found');
      }
      
      // Update the calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          time_zone: validTimeZone
        })
        .eq('id', eventId)
        .select('*');

      if (error) {
        if (error.message.includes('overlapping availability')) {
          throw new Error('This recurring schedule overlaps with existing availability slots.');
        }
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from calendar event update');
      }
      
      // If there's a recurrence_id, update the recurrence rule
      if (eventData.recurrence_id) {
        try {
          // Parse the recurrence rule to extract frequency and other parameters
          const byDay = recurrenceRule.includes('BYDAY=') 
            ? recurrenceRule.split('BYDAY=')[1].split(';')[0].split(',')
            : [];
            
          const frequency = recurrenceRule.includes('FREQ=')
            ? recurrenceRule.split('FREQ=')[1].split(';')[0] as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
            : 'WEEKLY';
            
          const interval = recurrenceRule.includes('INTERVAL=')
            ? parseInt(recurrenceRule.split('INTERVAL=')[1].split(';')[0])
            : 1;
            
          const count = recurrenceRule.includes('COUNT=')
            ? parseInt(recurrenceRule.split('COUNT=')[1].split(';')[0])
            : undefined;
            
          const until = recurrenceRule.includes('UNTIL=')
            ? recurrenceRule.split('UNTIL=')[1].split(';')[0]
            : undefined;
          
          // Update the recurrence rule using the RecurrenceService
          await RecurrenceService.updateRecurrenceRule(eventData.recurrence_id, {
            frequency,
            interval,
            byDay,
            count,
            until,
            startDate: startDt.toJSDate(),
            timezone: validTimeZone
          });
        } catch (recurrenceError) {
          console.error('[RecurringAvailabilityService] Error updating recurrence rule:', recurrenceError);
          throw new Error(`Failed to update recurrence rule: ${recurrenceError instanceof Error ? recurrenceError.message : 'Unknown error'}`);
        }
      } else {
        // If there's no recurrence_id, create a new recurrence rule
        try {
          // Parse the recurrence rule to extract frequency and other parameters
          const byDay = recurrenceRule.includes('BYDAY=') 
            ? recurrenceRule.split('BYDAY=')[1].split(';')[0].split(',')
            : [];
            
          const frequency = recurrenceRule.includes('FREQ=')
            ? recurrenceRule.split('FREQ=')[1].split(';')[0] as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
            : 'WEEKLY';
            
          const interval = recurrenceRule.includes('INTERVAL=')
            ? parseInt(recurrenceRule.split('INTERVAL=')[1].split(';')[0])
            : 1;
            
          const count = recurrenceRule.includes('COUNT=')
            ? parseInt(recurrenceRule.split('COUNT=')[1].split(';')[0])
            : undefined;
            
          const until = recurrenceRule.includes('UNTIL=')
            ? recurrenceRule.split('UNTIL=')[1].split(';')[0]
            : undefined;
          
          // Create the recurrence rule using the RecurrenceService
          const recurrenceData = await RecurrenceService.createRecurrenceRule(eventId, {
            frequency,
            interval,
            byDay,
            count,
            until,
            startDate: startDt.toJSDate(),
            timezone: validTimeZone
          });
          
          // Update the calendar event with the recurrence_id
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update({ recurrence_id: recurrenceData.id })
            .eq('id', eventId);
            
          if (updateError) {
            console.error('[RecurringAvailabilityService] Error updating recurrence_id:', updateError);
          }
        } catch (recurrenceError) {
          console.error('[RecurringAvailabilityService] Error creating recurrence rule:', recurrenceError);
          throw new Error(`Failed to create recurrence rule: ${recurrenceError instanceof Error ? recurrenceError.message : 'Unknown error'}`);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error updating recurring availability:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Delete a recurring availability slot
   * @param eventId The ID of the event to delete
   * @returns Success status
   */
  static async deleteRecurringAvailability(eventId: string): Promise<any> {
    try {
      // Get the event to check if it exists and get the recurrence_id
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .select('recurrence_id')
        .eq('id', eventId)
        .single();
        
      if (eventError) {
        throw CalendarErrorHandler.handleDatabaseError(eventError);
      }
      
      if (!eventData) {
        throw new Error('Event not found');
      }
      
      // Delete the calendar event
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      // If there's a recurrence_id, delete the recurrence rule
      if (eventData.recurrence_id) {
        try {
          await RecurrenceService.deleteRecurrenceRule(eventData.recurrence_id);
        } catch (recurrenceError) {
          console.error('[RecurringAvailabilityService] Error deleting recurrence rule:', recurrenceError);
          // We don't throw here since the event is already deleted
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error deleting recurring availability:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
