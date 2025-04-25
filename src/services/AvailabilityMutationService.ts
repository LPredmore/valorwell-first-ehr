
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilitySettings, AvailabilityResponse } from '@/types/availability';
import { DateTime } from 'luxon';

/**
 * AvailabilityMutationService: Handles all write operations for availability data
 * This separates the mutation logic from query operations for better clarity and maintainability
 */
export class AvailabilityMutationService {
  /**
   * Update availability settings for a clinician
   */
  static async updateSettings(
    clinicianId: string, 
    settings: Partial<AvailabilitySettings>
  ): Promise<AvailabilitySettings | null> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .upsert({
          clinician_id: clinicianId,
          default_slot_duration: settings.defaultSlotDuration,
          min_notice_days: settings.minNoticeDays,
          max_advance_days: settings.maxAdvanceDays
        })
        .select()
        .single();

      if (error) {
        console.error('[AvailabilityMutationService] Error updating availability settings:', error);
        return null;
      }

      return data ? {
        id: data.id,
        clinicianId: data.clinician_id,
        defaultSlotDuration: data.default_slot_duration,
        minNoticeDays: data.min_notice_days,
        maxAdvanceDays: data.max_advance_days,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } : null;
    } catch (error) {
      console.error('[AvailabilityMutationService] Exception updating settings:', error);
      return null;
    }
  }
  
  /**
   * Create a new availability slot with consistent timezone handling
   */
  static async createAvailabilitySlot(
    clinicianId: string,
    slot: {
      startTime: string;
      endTime: string;
      title?: string;
      recurring?: boolean;
      recurrenceRule?: string;
      dayOfWeek?: string;
    }
  ): Promise<AvailabilityResponse> {
    try {
      console.log('[AvailabilityMutationService] Creating availability slot with:', {
        clinicianId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        recurring: slot.recurring,
        recurrenceRule: slot.recurrenceRule,
        dayOfWeek: slot.dayOfWeek
      });

      // Get clinician's timezone for proper storage
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[AvailabilityMutationService] Error fetching clinician timezone:', profileError);
        return { success: false, error: 'Failed to fetch clinician timezone' };
      }
      
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityMutationService] Using clinician timezone:', clinicianTimeZone);
      
      // Get the correct date based on the day of week
      const now = DateTime.now().setZone(clinicianTimeZone);
      let targetDate: DateTime;
      
      if (slot.dayOfWeek) {
        // Map day name to Luxon weekday number (1-7, Monday is 1)
        const dayToWeekdayNumber: Record<string, number> = {
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'sunday': 7
        };
        
        const targetWeekday = dayToWeekdayNumber[slot.dayOfWeek.toLowerCase()];
        if (!targetWeekday) {
          console.error(`[AvailabilityMutationService] Invalid day of week: ${slot.dayOfWeek}`);
          return { success: false, error: `Invalid day of week: ${slot.dayOfWeek}` };
        }
        
        // Find the next occurrence of this weekday
        targetDate = now.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        
        // Calculate days to add to get to the target weekday
        let daysToAdd = targetWeekday - targetDate.weekday;
        if (daysToAdd <= 0) {
          // If today is the target day or we've passed it this week, go to next week
          daysToAdd += 7;
        }
        
        targetDate = targetDate.plus({ days: daysToAdd });
        
        console.log('[AvailabilityMutationService] Calculated target date:', {
          dayOfWeek: slot.dayOfWeek,
          weekdayNumber: targetWeekday,
          currentWeekday: now.weekday,
          daysToAdd,
          targetDate: targetDate.toISO()
        });
      } else {
        // If no day specified, use today's date
        targetDate = now.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        console.log('[AvailabilityMutationService] No day of week specified, using today:', targetDate.toISO());
      }
      
      // Parse the incoming times with our TimeZoneService
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      // Create the full datetime while maintaining timezone
      const startDateTime = targetDate.set({
        hour: startHour,
        minute: startMinute,
        second: 0,
        millisecond: 0
      });
      
      const endDateTime = targetDate.set({
        hour: endHour,
        minute: endMinute,
        second: 0,
        millisecond: 0
      });
      
      if (!startDateTime.isValid || !endDateTime.isValid) {
        const error = `Invalid date/time formats: ${startDateTime.invalidReason || endDateTime.invalidReason}`;
        console.error('[AvailabilityMutationService] ' + error);
        return { 
          success: false, 
          error 
        };
      }
      
      if (endDateTime <= startDateTime) {
        const error = 'End time must be after start time';
        console.error('[AvailabilityMutationService] ' + error, {
          start: startDateTime.toISO(),
          end: endDateTime.toISO()
        });
        return { 
          success: false, 
          error 
        };
      }
      
      // Convert to UTC for storage
      const startUTC = startDateTime.toUTC();
      const endUTC = endDateTime.toUTC();
      
      console.log('[AvailabilityMutationService] Times for database storage:', {
        originalDate: targetDate.toFormat('yyyy-MM-dd'),
        localStart: startDateTime.toISO(),
        localEnd: endDateTime.toISO(),
        utcStart: startUTC.toISO(),
        utcEnd: endUTC.toISO(),
        timezone: clinicianTimeZone
      });

      // Create the main event
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          clinician_id: clinicianId,
          event_type: 'availability',
          title: slot.title || 'Available',
          start_time: startUTC.toISO(),
          end_time: endUTC.toISO(),
          all_day: false,
          is_active: true,
          recurrence_id: null // Initially null, will update after recurrence rule creation if needed
        })
        .select('id')
        .single();

      if (eventError || !eventData?.id) {
        console.error('[AvailabilityMutationService] Error creating availability slot:', eventError);
        return { success: false, error: `Failed to create availability slot: ${eventError?.message || 'Unknown error'}` };
      }

      // If this is a recurring slot, create the recurrence rule
      if (slot.recurring && slot.recurrenceRule && eventData?.id) {
        const { data: recurrenceData, error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: eventData.id,
            rrule: slot.recurrenceRule
          })
          .select('id')
          .single();

        if (recurrenceError) {
          console.error('[AvailabilityMutationService] Error creating recurrence rule:', recurrenceError);
          
          // Delete the event if recurrence rule creation fails
          await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventData.id);
            
          return { success: false, error: `Failed to create recurrence rule: ${recurrenceError.message}` };
        }
        
        // Update the event with the recurrence ID
        if (recurrenceData?.id) {
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update({ recurrence_id: recurrenceData.id })
            .eq('id', eventData.id);
            
          if (updateError) {
            console.error('[AvailabilityMutationService] Error updating event with recurrence ID:', updateError);
            return { success: false, error: `Failed to update recurrence ID: ${updateError.message}` };
          }
        }
      }

      return { 
        success: true, 
        data: { id: eventData.id } 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AvailabilityMutationService] Error in createAvailabilitySlot:', error);
      return { success: false, error: `Unexpected error creating availability slot: ${errorMessage}` };
    }
  }
  
  /**
   * Update an existing availability slot
   */
  static async updateAvailabilitySlot(
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      title?: string;
    },
    updateRecurrence: boolean = false
  ): Promise<AvailabilityResponse> {
    try {
      // First get the clinician ID for this slot to determine timezone
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', slotId)
        .single();
        
      if (slotError || !slotData?.clinician_id) {
        console.error('[AvailabilityMutationService] Error fetching slot data:', slotError);
        return { success: false, error: 'Failed to fetch slot data' };
      }
      
      // Get clinician timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', slotData.clinician_id)
        .maybeSingle();
        
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityMutationService] Using clinician timezone for update:', clinicianTimeZone);

      const updateData: any = {};
      
      // Properly format times with TimeZoneService if provided
      if (updates.startTime) {
        // Get the date from the existing event
        const { data: existingData } = await supabase
          .from('calendar_events')
          .select('start_time')
          .eq('id', slotId)
          .single();
          
        if (existingData) {
          const existingDate = TimeZoneService.fromUTC(existingData.start_time, clinicianTimeZone);
          const dateStr = existingDate.toFormat('yyyy-MM-dd');
          
          const startDateTime = TimeZoneService.createDateTime(dateStr, updates.startTime, clinicianTimeZone);
          updateData.start_time = TimeZoneService.toUTC(startDateTime.toISO() || '', clinicianTimeZone).toISO();
        }
      }
      
      if (updates.endTime) {
        // Get the date from the existing event
        const { data: existingData } = await supabase
          .from('calendar_events')
          .select('end_time')
          .eq('id', slotId)
          .single();
          
        if (existingData) {
          const existingDate = TimeZoneService.fromUTC(existingData.end_time, clinicianTimeZone);
          const dateStr = existingDate.toFormat('yyyy-MM-dd');
          
          const endDateTime = TimeZoneService.createDateTime(dateStr, updates.endTime, clinicianTimeZone);
          updateData.end_time = TimeZoneService.toUTC(endDateTime.toISO() || '', clinicianTimeZone).toISO();
        }
      }
      
      if (updates.title) {
        updateData.title = updates.title;
      }

      console.log(`[AvailabilityMutationService] Updating slot ${slotId} with data:`, updateData);

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('[AvailabilityMutationService] Error updating availability slot:', error);
        return { success: false, error: 'Failed to update availability slot' };
      }

      if (updateRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError || !eventData?.recurrence_id) {
          console.log('[AvailabilityMutationService] Not a recurring event or error fetching recurrence:', eventError);
          return { success: true };
        }

        console.log(`[AvailabilityMutationService] Updating all occurrences with recurrence ID ${eventData.recurrence_id}`);

        const { error: recurrenceUpdateError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('recurrence_id', eventData.recurrence_id);

        if (recurrenceUpdateError) {
          console.error('[AvailabilityMutationService] Error updating recurring availability slots:', recurrenceUpdateError);
          return { success: false, error: 'Failed to update recurring availability slots' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in updateAvailabilitySlot:', error);
      return { success: false, error: 'Unexpected error updating availability slot' };
    }
  }
  
  /**
   * Delete an availability slot
   */
  static async deleteAvailabilitySlot(
    slotId: string,
    deleteRecurrence: boolean = false
  ): Promise<AvailabilityResponse> {
    try {
      if (deleteRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError) {
          console.error('[AvailabilityMutationService] Error checking recurrence:', eventError);
          return { success: false, error: 'Failed to check recurrence' };
        }

        if (eventData?.recurrence_id) {
          const { error: recurrenceDeleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('recurrence_id', eventData.recurrence_id);

          if (recurrenceDeleteError) {
            console.error('[AvailabilityMutationService] Error deleting recurring availability slots:', recurrenceDeleteError);
            return { success: false, error: 'Failed to delete recurring availability slots' };
          }

          const { error: ruleDeleteError } = await supabase
            .from('recurrence_rules')
            .delete()
            .eq('id', eventData.recurrence_id);

          if (ruleDeleteError) {
            console.error('[AvailabilityMutationService] Error deleting recurrence rule:', ruleDeleteError);
            return { success: false, error: 'Failed to delete recurrence rule' };
          }

          return { success: true };
        }
      }

      // Use hard delete
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('[AvailabilityMutationService] Error deleting availability slot:', error);
        return { success: false, error: 'Failed to delete availability slot' };
      }

      return { success: true };
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in deleteAvailabilitySlot:', error);
      return { success: false, error: 'Unexpected error deleting availability slot' };
    }
  }
}
