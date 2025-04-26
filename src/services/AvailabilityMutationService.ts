import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilitySlot, DayOfWeek } from '@/types/availability';
import { DateTime } from 'luxon';

// This file contains functions for creating and updating availability slots

export class AvailabilityMutationService {
  /**
   * Create a new availability slot
   */
  static async createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone: string = 'America/Chicago'
  ) {
    try {
      // Input validation
      if (!clinicianId) throw new Error('Clinician ID is required');
      if (!startTime) throw new Error('Start time is required');
      if (!endTime) throw new Error('End time is required');
      if (!dayOfWeek) throw new Error('Day of week is required');
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      console.log(`Creating availability slot with time zone: ${validTimeZone}`);
      
      // Prepare the data for insertion
      const baseDate = this.getBaseDate(dayOfWeek);
      
      // Use TimeZoneService to create DateTimes properly
      const start = TimeZoneService.parseWithZone(`${baseDate}T${startTime}:00`, validTimeZone);
      const end = TimeZoneService.parseWithZone(`${baseDate}T${endTime}:00`, validTimeZone);
      
      if (!start.isValid || !end.isValid) {
        throw new Error(`Invalid date/time: ${start.invalidReason || end.invalidReason}`);
      }
      
      if (start >= end) {
        throw new Error('Start time must be before end time');
      }
      
      // Insert into database
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: 'Available',
          event_type: 'availability',
          start_time: start.toISO(),
          end_time: end.toISO(),
          clinician_id: clinicianId,
          availability_type: isRecurring ? 'recurring' : 'single',
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If recurring, create a recurrence rule
      if (isRecurring && data.id) {
        const rrule = recurrenceRule || `FREQ=WEEKLY;BYDAY=${this.getDayCode(dayOfWeek)}`;
        
        const { error: ruleError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: data.id,
            rrule: rrule
          });
        
        if (ruleError) throw ruleError;
      }
      
      return data;
      
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing availability slot
   */
  static async updateAvailabilitySlot(
    slotId: string,
    updates: Partial<AvailabilitySlot>
  ) {
    try {
      // Input validation
      if (!slotId) throw new Error('Slot ID is required');
      
      // Fetch the current slot to get context
      const { data: existingSlot, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!existingSlot) throw new Error('Slot not found');
      
      // Prepare updates object
      const dbUpdates: Record<string, any> = {};
      
      if (updates.startTime) {
        const baseDate = DateTime.fromISO(existingSlot.start_time).toISODate();
        if (!baseDate) throw new Error('Invalid start time in existing slot');
        
        const timeZoneToUse = updates.timeZone || existingSlot.time_zone || 'UTC';
        const startDateTime = TimeZoneService.parseWithZone(`${baseDate}T${updates.startTime}:00`, timeZoneToUse);
        dbUpdates.start_time = startDateTime.toISO();
      }
      
      if (updates.endTime) {
        const baseDate = DateTime.fromISO(existingSlot.end_time).toISODate();
        if (!baseDate) throw new Error('Invalid end time in existing slot');
        
        const timeZoneToUse = updates.timeZone || existingSlot.time_zone || 'UTC';
        const endDateTime = TimeZoneService.parseWithZone(`${baseDate}T${updates.endTime}:00`, timeZoneToUse);
        dbUpdates.end_time = endDateTime.toISO();
      }
      
      if (updates.isRecurring !== undefined) {
        dbUpdates.availability_type = updates.isRecurring ? 'recurring' : 'single';
      }
      
      if (Object.keys(dbUpdates).length === 0) {
        console.log('No updates provided');
        return existingSlot;
      }
      
      // Update the database
      const { data, error } = await supabase
        .from('calendar_events')
        .update(dbUpdates)
        .eq('id', slotId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      console.error('Error updating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Delete an availability slot
   */
  static async deleteAvailabilitySlot(slotId: string) {
    try {
      // Input validation
      if (!slotId) throw new Error('Slot ID is required');
      
      // Check if this is a recurring availability
      const { data: existingSlot, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!existingSlot) throw new Error('Slot not found');
      
      // If recurring, delete the recurrence rule first
      if (existingSlot.availability_type === 'recurring') {
        const { error: ruleError } = await supabase
          .from('recurrence_rules')
          .delete()
          .eq('event_id', slotId);
        
        if (ruleError) throw ruleError;
      }
      
      // Delete the slot
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId);
      
      if (error) throw error;
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Get a base date for a day of the week
   * This helps when creating new availability slots
   */
  private static getBaseDate(dayOfWeek: DayOfWeek): string {
    const today = DateTime.now();
    const dayMap: Record<DayOfWeek, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    
    let targetDay = dayMap[dayOfWeek];
    if (!targetDay) targetDay = 1; // Default to Monday
    
    const currentDay = today.weekday;
    const daysToAdd = (targetDay + 7 - currentDay) % 7;
    
    const targetDate = today.plus({ days: daysToAdd });
    return targetDate.toFormat('yyyy-MM-dd');
  }
  
  /**
   * Convert day of week to iCalendar code
   */
  private static getDayCode(day: DayOfWeek): string {
    const codes: Record<DayOfWeek, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };
    
    return codes[day] || 'MO';
  }
}
