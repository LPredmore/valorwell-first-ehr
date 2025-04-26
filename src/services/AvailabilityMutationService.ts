import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilitySlot, DayOfWeek } from '@/types/availability';
import { DateTime } from 'luxon';

export class AvailabilityMutationService {
  static async createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone: string = 'America/Chicago',
    specificDate?: string | Date | DateTime
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
      const baseDate = this.getBaseDate(dayOfWeek, specificDate);
      console.log(`[AvailabilityMutationService] Using base date: ${baseDate} for day ${dayOfWeek}`);
      
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
          is_active: true,
          time_zone: validTimeZone
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
      
      if (updates.timeZone) {
        dbUpdates.time_zone = TimeZoneService.ensureIANATimeZone(updates.timeZone);
      }
      
      if (updates.isRecurring !== undefined) {
        dbUpdates.availability_type = updates.isRecurring ? 'recurring' : 'single';
      }
      
      if (updates.isActive !== undefined) {
        dbUpdates.is_active = updates.isActive;
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
  
  private static getBaseDate(dayOfWeek: DayOfWeek, specificDate?: string | Date | DateTime): string {
    // If a specific date is provided, use that
    if (specificDate) {
      let dateTime: DateTime;
      
      if (specificDate instanceof DateTime) {
        dateTime = specificDate;
      } else if (specificDate instanceof Date) {
        dateTime = DateTime.fromJSDate(specificDate);
      } else {
        dateTime = DateTime.fromISO(specificDate);
      }
      
      if (!dateTime.isValid) {
        console.error(`[AvailabilityMutationService] Invalid specific date provided: ${specificDate}. Falling back to calculating based on day of week.`);
      } else {
        // Verify this date's weekday matches the requested dayOfWeek
        const weekdayName = dateTime.weekdayLong.toLowerCase() as DayOfWeek;
        
        if (weekdayName !== dayOfWeek) {
          console.warn(`[AvailabilityMutationService] Specific date ${dateTime.toISODate()} is a ${weekdayName}, but requested day is ${dayOfWeek}. Will use the requested day of week for consistency.`);
        }
        
        return dateTime.toFormat('yyyy-MM-dd');
      }
    }
    
    // If no specific date or it's invalid, calculate based on day of week
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
    let daysToAdd = targetDay - currentDay;
    
    // If the day has already passed this week, schedule for next week
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    const targetDate = today.plus({ days: daysToAdd });
    return targetDate.toFormat('yyyy-MM-dd');
  }
  
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
