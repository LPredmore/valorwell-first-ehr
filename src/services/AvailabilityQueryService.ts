
// Add this at the top of the file to fix the PostgrestFilterBuilder to Promise conversion
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { AvailabilityEvent, CalculatedAvailableSlot } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timezone';
import { DateTime } from 'luxon';
import { AvailabilitySettings, WeeklyAvailability as AvailabilityWeeklyAvailability, DayOfWeek } from '@/types/availability';
import { AvailabilitySlot as AppointmentAvailabilitySlot, WeeklyAvailability as AppointmentWeeklyAvailability } from '@/types/appointment';

// Convert between the two WeeklyAvailability formats
const convertToAvailabilityWeeklyAvailability = (weeklySlots: AppointmentWeeklyAvailability): AvailabilityWeeklyAvailability => {
  // Create empty result object with the expected structure
  const result: AvailabilityWeeklyAvailability = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };
  
  // For each day, convert the slot types adding the required clinicianId field
  if (weeklySlots['Monday']) {
    result.monday = weeklySlots['Monday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId, // Use the existing clinicianId value
      dayOfWeek: 'monday' // Ensure the correct enum value is used
    }));
  }
  
  if (weeklySlots['Tuesday']) {
    result.tuesday = weeklySlots['Tuesday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'tuesday'
    }));
  }
  
  if (weeklySlots['Wednesday']) {
    result.wednesday = weeklySlots['Wednesday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'wednesday'
    }));
  }
  
  if (weeklySlots['Thursday']) {
    result.thursday = weeklySlots['Thursday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'thursday'
    }));
  }
  
  if (weeklySlots['Friday']) {
    result.friday = weeklySlots['Friday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'friday'
    }));
  }
  
  if (weeklySlots['Saturday']) {
    result.saturday = weeklySlots['Saturday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'saturday'
    }));
  }
  
  if (weeklySlots['Sunday']) {
    result.sunday = weeklySlots['Sunday'].map(slot => ({
      ...slot,
      clinicianId: slot.clinicianId,
      dayOfWeek: 'sunday'
    }));
  }
  
  return result;
};

export class AvailabilityQueryService {

  /**
   * Get all availability settings for a clinician
   * @param clinicianId The clinician ID
   * @returns Availability settings object
   */
  public static async getAvailabilitySettings(clinicianId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinicianId', clinicianId)
        .single();

      if (error) {
        console.error('Error fetching availability settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getAvailabilitySettings:', error);
      throw error;
    }
  }

  /**
   * Get all availability slots for a clinician
   * @param clinicianId The clinician ID
   * @returns Array of availability slot objects
   */
  public static async getAvailabilitySlots(clinicianId: string): Promise<AppointmentAvailabilitySlot[]> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinicianId', clinicianId);

      if (error) {
        console.error('Error fetching availability slots:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAvailabilitySlots:', error);
      throw error;
    }
  }

  /**
   * Transform a database calendar event into an AvailabilitySlot
   */
  private static transformDatabaseEventToAvailabilityEvent(event: any): AppointmentAvailabilitySlot {
    // Check if this is already in the format we need
    if (event.dayOfWeek || event.day_of_week) {
      return {
        id: event.id,
        startTime: event.start_time || event.startTime,
        endTime: event.end_time || event.endTime,
        dayOfWeek: event.dayOfWeek || event.day_of_week,
        isRecurring: event.is_recurring || event.isRecurring || false,
        excludeDates: event.exclude_dates || event.excludeDates || [],
        clinicianId: event.clinician_id || event.clinicianId || '' // Ensure clinicianId is added with proper fallbacks
      };
    }
    
    // Transform a calendar_events record into an AvailabilitySlot
    const startDate = new Date(event.start_time);
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      id: event.id,
      startTime: event.start_time,
      endTime: event.end_time,
      dayOfWeek,
      isRecurring: event.availability_type === 'recurring',
      excludeDates: [],
      clinicianId: event.clinician_id || '' // Ensure clinicianId is added
    };
  }

  /**
   * Get weekly availability for a clinician from calendar_events
   */
  public static async getWeeklyAvailability(
    clinicianId: string
  ): Promise<AvailabilityWeeklyAvailability> {
    console.log(`[AvailabilityQueryService] Getting weekly availability for clinician: ${clinicianId}`);
    
    try {
      const { data: availabilityEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true)
        .then(result => ({ data: result.data || [], error: result.error }));
        
      if (error) {
        console.error('[AvailabilityQueryService] Error fetching availability:', error);
        throw error;
      }
      
      console.log(`[AvailabilityQueryService] Retrieved ${availabilityEvents.length} availability events`);
      
      // Process events into weekly slots
      const weeklySlots: AppointmentWeeklyAvailability = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: []
      };
      
      // Transform database events to availability slots
      for (const event of availabilityEvents) {
        const availabilitySlot = this.transformDatabaseEventToAvailabilityEvent(event);
        if (availabilitySlot.dayOfWeek && weeklySlots[availabilitySlot.dayOfWeek]) {
          weeklySlots[availabilitySlot.dayOfWeek].push(availabilitySlot);
        }
      }
      
      // Convert to the expected WeeklyAvailability format from the availability.ts type
      return convertToAvailabilityWeeklyAvailability(weeklySlots);
    } catch (error) {
      console.error('[AvailabilityQueryService] Error in getWeeklyAvailability:', error);
      throw error;
    }
  }

  /**
   * Get a single availability slot by ID
   * @param slotId The ID of the availability slot
   * @returns Availability slot object
   */
  public static async getAvailabilitySlotById(slotId: string): Promise<AppointmentAvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (error) {
        console.error('Error fetching availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getAvailabilitySlotById:', error);
      return null;
    }
  }

  /**
   * Create a new availability slot
   * @param slot The availability slot object to create
   * @returns The created availability slot object
   */
  public static async createAvailabilitySlot(slot: AppointmentAvailabilitySlot): Promise<AppointmentAvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert([slot])
        .select()
        .single();

      if (error) {
        console.error('Error creating availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in createAvailabilitySlot:', error);
      return null;
    }
  }

  /**
   * Update an existing availability slot
   * @param slotId The ID of the availability slot to update
   * @param slot The updated availability slot object
   * @returns The updated availability slot object
   */
  public static async updateAvailabilitySlot(slotId: string, slot: AppointmentAvailabilitySlot): Promise<AppointmentAvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .update(slot)
        .eq('id', slotId)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in updateAvailabilitySlot:', error);
      return null;
    }
  }

  /**
   * Delete an availability slot
   * @param slotId The ID of the availability slot to delete
   * @returns True if the slot was successfully deleted, false otherwise
   */
  public static async deleteAvailabilitySlot(slotId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('Error deleting availability slot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAvailabilitySlot:', error);
      return false;
    }
  }

  /**
   * Calculate available time slots for a specific date based on availability settings
   * @param settings The availability settings
   * @param date The date to calculate slots for (YYYY-MM-DD format)
   * @param existingAppointments Array of existing appointments for the date
   * @returns Array of available slot objects
   */
  public static async calculateAvailableSlots(
    settings: AvailabilitySettings,
    date: string,
    existingAppointments: any[] = []
  ): Promise<CalculatedAvailableSlot[]> {
    try {
      console.log(`[AvailabilityQueryService] Calculating available slots for date: ${date}`);
      
      const dateObj = DateTime.fromISO(date, { zone: settings.timeZone });
      const dayOfWeek = dateObj.toFormat('cccc'); // Full day name: Monday, Tuesday, etc.
      
      // Get the day's availability slots
      const { data: availabilityEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', settings.clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);
        
      if (error) {
        console.error('[AvailabilityQueryService] Error fetching availability events:', error);
        return [];
      }
      
      if (!availabilityEvents || availabilityEvents.length === 0) {
        console.log(`[AvailabilityQueryService] No availability events found for date: ${date}`);
        return [];
      }
      
      // Filter events for the specified day
      const dayEvents = availabilityEvents.filter((event) => {
        const eventDate = DateTime.fromISO(event.start_time);
        const eventDayOfWeek = eventDate.toFormat('cccc');
        
        return (
          (event.availability_type === 'recurring' && eventDayOfWeek === dayOfWeek) ||
          (event.availability_type === 'single' && eventDate.toISODate() === date)
        );
      });
      
      if (dayEvents.length === 0) {
        console.log(`[AvailabilityQueryService] No availability for ${dayOfWeek} on ${date}`);
        return [];
      }
      
      // Calculate available time slots based on settings
      const slots: CalculatedAvailableSlot[] = [];
      const slotDuration = settings.defaultSlotDuration;
      
      for (const event of dayEvents) {
        const startDateTime = DateTime.fromISO(event.start_time, { zone: settings.timeZone });
        const endDateTime = DateTime.fromISO(event.end_time, { zone: settings.timeZone });
        
        // Skip if event is not for the requested date (could happen with recurring events)
        if (startDateTime.toISODate() !== date && event.availability_type === 'single') {
          continue;
        }
        
        // Calculate slots within this availability period
        let currentStartTime = startDateTime;
        while (currentStartTime.plus({ minutes: slotDuration }) <= endDateTime) {
          const currentEndTime = currentStartTime.plus({ minutes: slotDuration });
          
          // Check if slot overlaps with any existing appointment
          const isOverlapping = existingAppointments.some(appointment => {
            const apptStart = DateTime.fromISO(appointment.appointment_datetime, { zone: settings.timeZone });
            const apptEnd = DateTime.fromISO(appointment.appointment_end_datetime, { zone: settings.timeZone });
            
            return (
              (currentStartTime >= apptStart && currentStartTime < apptEnd) || // Start time is within appointment
              (currentEndTime > apptStart && currentEndTime <= apptEnd) || // End time is within appointment
              (currentStartTime <= apptStart && currentEndTime >= apptEnd) // Appointment is within slot
            );
          });
          
          // If not overlapping, add as available
          if (!isOverlapping) {
            slots.push({
              start: currentStartTime.toISO(),
              end: currentEndTime.toISO(),
              slotId: event.id,
              isRecurring: event.availability_type === 'recurring'
            });
          }
          
          // Move to next slot
          currentStartTime = currentEndTime;
        }
      }
      
      console.log(`[AvailabilityQueryService] Calculated ${slots.length} available slots for ${date}`);
      return slots;
    } catch (error) {
      console.error('[AvailabilityQueryService] Error calculating available slots:', error);
      return [];
    }
  }
}
