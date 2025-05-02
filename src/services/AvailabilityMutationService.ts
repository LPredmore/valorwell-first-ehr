
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { DateTime } from 'luxon';
import { ensureUUID } from '@/utils/validation/uuidUtils';

/**
 * Service for handling availability mutations in the calendar system
 */
export class AvailabilityMutationService {
  /**
   * Create a new recurring availability slot
   */
  static async createRecurringAvailability(
    clinicianId: string,
    dayOfWeek: number, // 0 = Sunday, 6 = Saturday
    startTime: string, // "HH:MM" format
    endTime: string, // "HH:MM" format
    timezone: string
  ): Promise<string> {
    try {
      // Validate clinician ID
      const formattedClinicianId = ensureUUID(clinicianId);
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Convert day of week to string representation
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[dayOfWeek % 7];
      
      // Insert new availability slot
      const { data, error } = await supabase
        .from('availability_slots')
        .insert({
          clinician_id: formattedClinicianId,
          day_of_week: dayName,
          start_time: startTime,
          end_time: endTime,
          is_recurring: true,
          timezone: validTimeZone
        })
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating recurring availability:', error);
      throw error;
    }
  }
  
  /**
   * Create a single availability slot for a specific date
   */
  static async createSingleAvailability(
    clinicianId: string,
    date: string, // ISO date string
    startTime: string, // "HH:MM" format
    endTime: string, // "HH:MM" format
    timezone: string
  ): Promise<string> {
    try {
      // Validate clinician ID
      const formattedClinicianId = ensureUUID(clinicianId);
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Create DateTime objects
      const startDateTime = TimeZoneService.createDateTime(date, startTime, validTimeZone);
      const endDateTime = TimeZoneService.createDateTime(date, endTime, validTimeZone);
      
      // Convert to UTC for storage
      const startUtc = startDateTime.toUTC().toISO();
      const endUtc = endDateTime.toUTC().toISO();
      
      // Insert new availability slot
      const { data, error } = await supabase
        .from('availability_slots')
        .insert({
          clinician_id: formattedClinicianId,
          specific_date: date,
          start_time: startTime,
          end_time: endTime,
          start_utc: startUtc,
          end_utc: endUtc,
          is_recurring: false,
          timezone: validTimeZone
        })
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating single availability:', error);
      throw error;
    }
  }
  
  /**
   * Update an availability slot
   */
  static async updateAvailability(
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      dayOfWeek?: number;
      specificDate?: string;
    },
    timezone: string
  ): Promise<boolean> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Get existing slot
      const { data: existingSlot, error: fetchError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Prepare updates
      const updateData: any = {};
      
      if (updates.startTime) {
        updateData.start_time = updates.startTime;
      }
      
      if (updates.endTime) {
        updateData.end_time = updates.endTime;
      }
      
      if (updates.dayOfWeek !== undefined) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        updateData.day_of_week = days[updates.dayOfWeek % 7];
      }
      
      if (updates.specificDate) {
        updateData.specific_date = updates.specificDate;
      }
      
      // If this is a specific date availability, update UTC times
      if (existingSlot.specific_date || updates.specificDate) {
        const specificDate = updates.specificDate || existingSlot.specific_date;
        const startTime = updates.startTime || existingSlot.start_time;
        const endTime = updates.endTime || existingSlot.end_time;
        
        const startDateTime = TimeZoneService.createDateTime(specificDate, startTime, validTimeZone);
        const endDateTime = TimeZoneService.createDateTime(specificDate, endTime, validTimeZone);
        
        updateData.start_utc = startDateTime.toUTC().toISO();
        updateData.end_utc = endDateTime.toUTC().toISO();
      }
      
      // Update timezone if different
      if (existingSlot.timezone !== validTimeZone) {
        updateData.timezone = validTimeZone;
      }
      
      // Update the slot
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update(updateData)
        .eq('id', slotId);
      
      if (updateError) {
        throw updateError;
      }
      
      return true;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error updating availability:', error);
      throw error;
    }
  }
  
  /**
   * Delete an availability slot
   */
  static async deleteAvailability(slotId: string): Promise<boolean> {
    try {
      // Delete the slot
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error deleting availability:', error);
      throw error;
    }
  }
  
  /**
   * Convert a calendar event to an availability slot
   */
  static calendarEventToAvailabilitySlot(event: CalendarEvent, timezone: string): any {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Get clinician ID
    const clinicianId = event.extendedProps?.clinicianId || 
                        event.clinician_id ||
                        event.extendedProps?.clinician_id;
    
    if (!clinicianId) {
      throw new Error('Event is missing a clinician ID');
    }
    
    // Format clinician ID as UUID
    const formattedClinicianId = ensureUUID(clinicianId);
    
    // Parse start and end times
    const start = typeof event.start === 'string' 
      ? DateTime.fromISO(event.start, { zone: validTimeZone })
      : DateTime.fromJSDate(event.start, { zone: validTimeZone });
      
    const end = typeof event.end === 'string'
      ? DateTime.fromISO(event.end, { zone: validTimeZone })
      : DateTime.fromJSDate(event.end, { zone: validTimeZone });
    
    // Check if this is a recurring event
    const isRecurring = event.extendedProps?.isRecurring === true;
    
    if (isRecurring) {
      // For recurring events, we need the day of week
      const dayOfWeek = start.weekday % 7; // Convert to 0-6 format (0 = Sunday)
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      return {
        clinician_id: formattedClinicianId,
        day_of_week: days[dayOfWeek],
        start_time: start.toFormat('HH:mm'),
        end_time: end.toFormat('HH:mm'),
        is_recurring: true,
        timezone: validTimeZone
      };
    } else {
      // For single events, we need the specific date
      return {
        clinician_id: formattedClinicianId,
        specific_date: start.toFormat('yyyy-MM-dd'),
        start_time: start.toFormat('HH:mm'),
        end_time: end.toFormat('HH:mm'),
        start_utc: start.toUTC().toISO(),
        end_utc: end.toUTC().toISO(),
        is_recurring: false,
        timezone: validTimeZone
      };
    }
  }
}

export default AvailabilityMutationService;
