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
      // Improved input validation with detailed error messages
      if (!clinicianId) throw new Error('Clinician ID is required');
      if (!startTime) throw new Error('Start time is required');
      if (!endTime) throw new Error('End time is required');
      if (!dayOfWeek) throw new Error('Day of week is required');
      
      // Ensure clinicianId is a valid UUID
      const validClinicianId = this.ensureUUID(clinicianId);
      console.log(`[AvailabilityMutationService] Validated clinician ID: ${validClinicianId} (original: ${clinicianId})`);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      console.log(`[AvailabilityMutationService] Creating availability slot:`, {
        dayOfWeek,
        startTime,
        endTime,
        timeZone: validTimeZone,
        clinicianId: validClinicianId,
        specificDate: specificDate ? 
          (specificDate instanceof DateTime ? 
            specificDate.toISO() : 
            String(specificDate)
          ) : 'none'
      });
      
      // Get the base date for this availability slot
      const baseDate = this.getBaseDate(dayOfWeek, specificDate);
      console.log(`[AvailabilityMutationService] Using base date: ${baseDate} for day ${dayOfWeek}`);
      
      // Create proper DateTime objects with timezone
      const start = TimeZoneService.parseWithZone(`${baseDate}T${startTime}`, validTimeZone);
      const end = TimeZoneService.parseWithZone(`${baseDate}T${endTime}`, validTimeZone);
      
      console.log('[AvailabilityMutationService] Created DateTimes:', {
        start: start.toISO(),
        end: end.toISO(),
        startValid: start.isValid,
        endValid: end.isValid
      });

      if (!start.isValid || !end.isValid) {
        throw new Error(`Invalid date/time: ${start.invalidReason || end.invalidReason}`);
      }
      
      if (start >= end) {
        throw new Error('Start time must be before end time');
      }
      
      // Get the authenticated user ID for debugging
      const { data: { user } } = await supabase.auth.getUser();
      const authUserId = user?.id;
      console.log(`[AvailabilityMutationService] Current auth user ID: ${authUserId}, using clinician ID: ${validClinicianId}`);
      
      // Verify database access before insert
      const { data: testAccess, error: accessError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);
        
      if (accessError) {
        console.error('[AvailabilityMutationService] Database access check failed:', accessError);
        throw new Error(`Database access error: ${accessError.message}`);
      }
      
      console.log('[AvailabilityMutationService] Database access verified, proceeding with insert');
      
      // Insert into database with explicit UUID conversion
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: 'Available',
          event_type: 'availability',
          start_time: start.toISO(),
          end_time: end.toISO(),
          clinician_id: validClinicianId,
          availability_type: isRecurring ? 'recurring' : 'single',
          is_active: true,
          time_zone: validTimeZone
        })
        .select()
        .single();
      
      if (error) {
        console.error('[AvailabilityMutationService] Error creating availability slot:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message.includes('violates row level security policy')) {
          throw new Error('Permission denied: You do not have access to create availability for this clinician. Check your login permissions.');
        }
        
        throw error;
      }
      
      // If recurring, create a recurrence rule
      if (isRecurring && data.id) {
        const rrule = recurrenceRule || `FREQ=WEEKLY;BYDAY=${this.getDayCode(dayOfWeek)}`;
        
        const { error: ruleError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: data.id,
            rrule: rrule
          });
        
        if (ruleError) {
          console.error('[AvailabilityMutationService] Error creating recurrence rule:', ruleError);
          throw ruleError;
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating availability slot:', error);
      throw error;
    }
  }
  
  // Helper method to ensure the clinician ID is a valid UUID
  private static ensureUUID(id: string): string {
    try {
      // Regular expression pattern for UUID validation
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidPattern.test(id)) {
        return id; // Already a valid UUID format
      }
      
      // Check if this is a JSON-compatible format that needs unwrapping
      try {
        const parsedId = JSON.parse(id);
        if (typeof parsedId === 'string' && uuidPattern.test(parsedId)) {
          return parsedId;
        }
      } catch (e) {
        // Not JSON, continue with other checks
      }
      
      // Log warning for invalid UUID format
      console.warn(`[AvailabilityMutationService] Non-standard UUID format provided: ${id}`);
      
      return id; // Return the original if no conversions apply
    } catch (e) {
      console.error('[AvailabilityMutationService] UUID validation error:', e);
      return id; // Return the original on error
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
    const dayMap: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

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
        return dateTime.toFormat('yyyy-MM-dd');
      }
    }
    
    // Get target day number (0-6, Sunday is 0)
    const targetDay = dayMap[dayOfWeek];
    if (targetDay === undefined) {
      console.error(`[AvailabilityMutationService] Invalid day of week: ${dayOfWeek}`);
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }
    
    // Get current date
    const today = DateTime.now();
    const currentDay = today.weekday % 7; // Convert Luxon's 1-7 to 0-6
    
    // Calculate days to add
    let daysToAdd = targetDay - currentDay;
    
    // If the target day has already passed this week, move to next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const targetDate = today.plus({ days: daysToAdd });
    console.log('[AvailabilityMutationService] Date calculation:', {
      today: today.toISO(),
      targetDay,
      currentDay,
      daysToAdd,
      result: targetDate.toFormat('yyyy-MM-dd')
    });
    
    return targetDate.toFormat('yyyy-MM-dd');
  }
  
  private static getDayCode(day: DayOfWeek): string {
    const codes: Record<DayOfWeek, string> = {
      sunday: 'SU',
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA'
    };
    
    return codes[day] || 'MO';
  }
}
